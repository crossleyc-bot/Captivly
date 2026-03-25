import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import { validateInternalAuth } from "@/lib/internal-auth";
import { getServiceClient } from "@/lib/supabase/service";
import { enrichLead, formatEnrichmentForScoring } from "@/lib/lead-enrichment";
import { badRequest, notFound, internalError } from "@/lib/error-handler";
import type Anthropic from "@anthropic-ai/sdk";

interface ScoreResponse {
  score: number;
  reason: string;
}

export async function POST(request: NextRequest) {
  const authError = validateInternalAuth(request);
  if (authError) return authError;

  const { lead_id } = (await request.json()) as { lead_id: string };

  if (!lead_id) {
    return badRequest("lead_id required");
  }

  const supabase = getServiceClient();

  // Fetch lead
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", lead_id)
    .single();

  if (!lead) {
    return notFound("Lead not found");
  }

  // Fetch business profile
  const { data: business } = await supabase
    .from("businesses")
    .select("type, location_city, location_state, target_age_min, target_age_max, target_interests, primary_offer")
    .eq("id", lead.business_id)
    .single();

  if (!business) {
    return notFound("Business not found");
  }

  // Enrich lead with derived data
  const enrichment = enrichLead(
    {
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      custom_answers: lead.custom_answers,
      source: lead.source,
    },
    {
      location_city: business.location_city,
      location_state: business.location_state,
    }
  );

  // Save enrichment data
  await supabase
    .from("leads")
    .update({
      enrichment_data: enrichment,
      enriched_at: new Date().toISOString(),
    })
    .eq("id", lead_id);

  const client = getAnthropicClient();
  const enrichmentText = formatEnrichmentForScoring(enrichment);

  const systemPrompt = `You are a lead quality analyst for a local business. Given a lead's info, enrichment data, and the business's target profile, score this lead from 1 to 10 (10 = perfect match, 1 = poor match).

Consider these factors in order of importance:
1. Geographic proximity to the business
2. Contact quality (email type, phone type, name confidence)
3. Engagement signals (form completeness, custom answers)
4. Demographic fit with target audience
5. Red flags (disposable email, missing contact info)

Return ONLY valid JSON: { "score": number, "reason": string }`;

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
Custom answers: ${lead.custom_answers ? JSON.stringify(lead.custom_answers) : "none"}

Enrichment data:
${enrichmentText}`;

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
      return internalError("Failed to parse AI response");
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

  return NextResponse.json({ score, reason: scoreData.reason, enrichment });
}
