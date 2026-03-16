import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import type Anthropic from "@anthropic-ai/sdk";

// Use service role client — this endpoint is called internally from the webhook
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface ScoreResponse {
  score: number;
  reason: string;
}

export async function POST(request: NextRequest) {
  const { lead_id } = (await request.json()) as { lead_id: string };

  if (!lead_id) {
    return NextResponse.json({ error: "lead_id required" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Fetch lead
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", lead_id)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Fetch business profile
  const { data: business } = await supabase
    .from("businesses")
    .select("type, location_city, location_state, target_age_min, target_age_max, target_interests, primary_offer")
    .eq("id", lead.business_id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const client = getAnthropicClient();

  const systemPrompt = `You are a lead quality analyst for a local business. Given a lead's info and the business's target profile, score this lead from 1 to 10 (10 = perfect match, 1 = poor match). Consider how well the lead matches the business's target demographics and offering. Return ONLY valid JSON: { "score": number, "reason": string }`;

  const userPrompt = `Business type: ${business.type}
Location: ${business.location_city ?? "unknown"}, ${business.location_state ?? "unknown"}
Target age range: ${business.target_age_min ?? "any"} - ${business.target_age_max ?? "any"}
Target interests: ${business.target_interests?.join(", ") || "general"}
Offer: ${business.primary_offer ?? "not specified"}

Lead info:
Name: ${lead.first_name ?? "unknown"} ${lead.last_name ?? ""}
Email: ${lead.email ?? "not provided"}
Phone: ${lead.phone ?? "not provided"}
Source: ${lead.source}
Custom answers: ${lead.custom_answers ? JSON.stringify(lead.custom_answers) : "none"}`;

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 256,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  // Parse JSON from response
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  let scoreData: ScoreResponse;
  try {
    scoreData = JSON.parse(text);
  } catch {
    // Try to extract JSON from markdown code blocks
    const match = text.match(/\{[\s\S]*"score"[\s\S]*\}/);
    if (match) {
      scoreData = JSON.parse(match[0]);
    } else {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }
  }

  const score = Math.max(1, Math.min(10, Math.round(scoreData.score)));

  // Update lead with score
  await supabase
    .from("leads")
    .update({
      ai_score: score,
      ai_score_reason: scoreData.reason,
    })
    .eq("id", lead_id);

  return NextResponse.json({ score, reason: scoreData.reason });
}
