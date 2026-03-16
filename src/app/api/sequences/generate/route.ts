import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import { PLAN_LIMITS } from "@/lib/constants";
import type { PlanTier, MessageChannel } from "@/types/database";
import type Anthropic from "@anthropic-ai/sdk";

interface GeneratedStep {
  step: number;
  channel: MessageChannel;
  subject?: string;
  body: string;
  delay_days: number;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { campaign_id } = (await request.json()) as { campaign_id: string };

  if (!campaign_id) {
    return NextResponse.json({ error: "campaign_id required" }, { status: 400 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const plan = (dbUser?.plan_tier ?? "starter") as PlanTier;
  const maxSteps = PLAN_LIMITS[plan].sequence_steps;
  const hasSms = PLAN_LIMITS[plan].sms_per_month > 0;

  // Fetch business + campaign
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, type, primary_offer, outreach_tone")
    .eq("user_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "No business found" }, { status: 404 });
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("id", campaign_id)
    .eq("business_id", business.id)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const client = getAnthropicClient();

  const channels = hasSms ? "email and SMS alternating" : "email only";

  const systemPrompt = `You are an expert local business marketer specializing in lead nurturing sequences.
Generate a ${maxSteps}-step outreach sequence for a ${business.type} promoting "${business.primary_offer ?? "their services"}".
Tone: ${business.outreach_tone}.
Channels: ${channels}.
The first message should go out immediately (delay_days: 0).
Space subsequent messages 1-4 days apart.
Keep messages concise and action-oriented. Email bodies should be 2-4 sentences. SMS bodies should be under 160 characters.
Return ONLY valid JSON array: [{ "step": number, "channel": "email" | "sms", "subject": "string (email only)", "body": "string", "delay_days": number }]`;

  const userPrompt = `Business: ${business.name} (${business.type})
Offer: ${business.primary_offer ?? "general services"}
Campaign: ${campaign.name}
Number of steps: ${maxSteps}
Available channels: ${channels}

Generate the sequence now.`;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  let steps: GeneratedStep[];
  try {
    steps = JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      steps = JSON.parse(match[0]);
    } else {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  }

  // Enforce limits: cap steps and remove SMS if not available
  steps = steps.slice(0, maxSteps).map((step) => ({
    ...step,
    channel: !hasSms && step.channel === "sms" ? "email" : step.channel,
  }));

  // Create sequence record
  const { data: sequence, error: seqError } = await supabase
    .from("sequences")
    .insert({
      business_id: business.id,
      campaign_id: campaign.id,
      name: `${campaign.name} - Auto Sequence`,
      is_active: true,
    })
    .select()
    .single();

  if (seqError || !sequence) {
    return NextResponse.json({ error: seqError?.message ?? "Failed to create sequence" }, { status: 500 });
  }

  // Insert sequence steps
  const { error: stepsError } = await supabase.from("sequence_steps").insert(
    steps.map((step) => ({
      sequence_id: sequence.id,
      step_number: step.step,
      channel: step.channel,
      subject: step.channel === "email" ? (step.subject ?? null) : null,
      body: step.body,
      delay_days: step.delay_days,
    }))
  );

  if (stepsError) {
    return NextResponse.json({ error: stepsError.message }, { status: 500 });
  }

  return NextResponse.json({ sequence_id: sequence.id, steps });
}
