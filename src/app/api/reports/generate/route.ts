import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, AI_MODEL } from "@/lib/anthropic";
import { validateInternalAuth } from "@/lib/internal-auth";
import { getServiceClient } from "@/lib/supabase/service";
import { getResendClient } from "@/lib/resend";
import type Anthropic from "@anthropic-ai/sdk";

interface ReportResponse {
  summary: string;
  top_insight: string;
  recommendation: string;
}

/**
 * Generate AI monthly report cards for all Pro-tier businesses.
 *
 * Called by a cron job on the 1st of each month. Gathers last month's
 * metrics, asks Claude for a plain-English report, saves it, and
 * emails it to the business owner.
 */
export async function POST(request: NextRequest) {
  const authError = validateInternalAuth(request);
  if (authError) return authError;

  const supabase = getServiceClient();

  // Determine which month to report on (previous month)
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const month = prevMonth.toISOString().slice(0, 7); // e.g. '2026-02'

  // Find all Pro users with active subscriptions
  const { data: proUsers } = await supabase
    .from("users")
    .select("id, email, full_name")
    .eq("plan_tier", "pro")
    .eq("subscription_status", "active");

  if (!proUsers || proUsers.length === 0) {
    return NextResponse.json({ generated: 0 });
  }

  const client = getAnthropicClient();
  const resend = getResendClient();
  let generated = 0;

  for (const proUser of proUsers) {
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, type, primary_offer")
      .eq("user_id", proUser.id)
      .single();

    if (!business) continue;

    // Check if report already exists for this month
    const { data: existing } = await supabase
      .from("report_cards")
      .select("id")
      .eq("business_id", business.id)
      .eq("month", month)
      .single();

    if (existing) continue;

    // Gather metrics for the month
    const [usageResult, leadsResult, conversionsResult, messagesResult] =
      await Promise.all([
        supabase
          .from("usage_tracking")
          .select("leads_count, sms_count, emails_count")
          .eq("business_id", business.id)
          .eq("month", month)
          .single(),
        supabase
          .from("leads")
          .select("ai_score, status, created_at")
          .eq("business_id", business.id)
          .gte("created_at", `${month}-01`)
          .lt(
            "created_at",
            `${now.toISOString().slice(0, 7)}-01`
          ),
        supabase
          .from("conversions")
          .select("id", { count: "exact", head: true })
          .eq("business_id", business.id)
          .gte("converted_at", `${month}-01`)
          .lt(
            "converted_at",
            `${now.toISOString().slice(0, 7)}-01`
          ),
        supabase
          .from("messages_sent")
          .select("status, channel")
          .eq("lead_id", business.id)
          .gte("created_at", `${month}-01`)
          .lt(
            "created_at",
            `${now.toISOString().slice(0, 7)}-01`
          ),
      ]);

    const usage = usageResult.data;
    const leads = leadsResult.data ?? [];
    const totalConversions = conversionsResult.count ?? 0;
    const messages = messagesResult.data ?? [];

    const scoredLeads = leads.filter((l) => l.ai_score !== null);
    const avgScore =
      scoredLeads.length > 0
        ? (
            scoredLeads.reduce((sum, l) => sum + (l.ai_score ?? 0), 0) /
            scoredLeads.length
          ).toFixed(1)
        : "N/A";

    const repliedLeads = leads.filter((l) => l.status === "replied").length;
    const convertedLeads = leads.filter(
      (l) => l.status === "converted"
    ).length;

    const emailsSent = messages.filter(
      (m) => m.channel === "email" && m.status !== "failed"
    ).length;
    const smsSent = messages.filter(
      (m) => m.channel === "sms" && m.status !== "failed"
    ).length;
    const repliedMessages = messages.filter(
      (m) => m.status === "replied"
    ).length;

    const metrics = {
      month,
      business_name: business.name,
      business_type: business.type,
      total_leads: leads.length,
      avg_ai_score: avgScore,
      leads_replied: repliedLeads,
      leads_converted: convertedLeads,
      total_conversions: totalConversions,
      conversion_rate:
        leads.length > 0
          ? `${((totalConversions / leads.length) * 100).toFixed(1)}%`
          : "0%",
      emails_sent: usage?.emails_count ?? emailsSent,
      sms_sent: usage?.sms_count ?? smsSent,
      messages_replied: repliedMessages,
    };

    // Generate report with Claude
    const systemPrompt = `You are a marketing analyst writing a plain-English performance summary for a local business owner. Be encouraging but honest. Use specific numbers from the data. Write in a warm, professional tone. Return ONLY valid JSON: { "summary": string, "top_insight": string, "recommendation": string }`;

    const userPrompt = `Here is last month's data for ${business.name} (${business.type}), promoting "${business.primary_offer ?? "their services"}":

${JSON.stringify(metrics, null, 2)}

Write a 3-paragraph report card with:
1. summary: A 2-3 sentence overview of the month's performance
2. top_insight: The most interesting or actionable finding from the data
3. recommendation: One specific thing they should do next month to improve results`;

    const response = await client.messages.create({
      model: AI_MODEL,
      max_tokens: 512,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt,
    });

    const text = response.content
      .filter(
        (block): block is Anthropic.TextBlock => block.type === "text"
      )
      .map((block) => block.text)
      .join("");

    let report: ReportResponse;
    try {
      report = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*"summary"[\s\S]*\}/);
      if (match) {
        report = JSON.parse(match[0]);
      } else {
        continue; // Skip this business if AI response is unparseable
      }
    }

    // Save to database
    await supabase.from("report_cards").insert({
      business_id: business.id,
      month,
      summary: report.summary,
      top_insight: report.top_insight,
      recommendation: report.recommendation,
      metrics,
    });

    // Email to owner
    const monthLabel = prevMonth.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });

    await resend.emails.send({
      from: `Captivly.ai <noreply@${process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "").replace("http://", "") ?? "captivly.ai"}>`,
      to: proUser.email,
      subject: `Your ${monthLabel} Report Card — ${business.name}`,
      text: `Hi ${proUser.full_name ?? "there"},

Here's your monthly report card for ${business.name} (${monthLabel}).

SUMMARY
${report.summary}

TOP INSIGHT
${report.top_insight}

RECOMMENDATION
${report.recommendation}

KEY NUMBERS
• Total leads: ${metrics.total_leads}
• Average AI score: ${metrics.avg_ai_score}
• Conversions: ${metrics.total_conversions} (${metrics.conversion_rate})
• Emails sent: ${metrics.emails_sent}
• SMS sent: ${metrics.sms_sent}

View the full report in your dashboard:
${process.env.NEXT_PUBLIC_APP_URL}/reports

— The Captivly.ai Team`,
    });

    generated++;
  }

  return NextResponse.json({ generated, month });
}
