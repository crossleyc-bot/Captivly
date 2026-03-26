import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unauthorized, notFound, internalError } from "@/lib/error-handler";

/**
 * GET /api/agency/stats — aggregate metrics across all agency client businesses
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  // Resolve agency ID (as owner or member)
  const agencyId = await getAgencyId(supabase, user.id);
  if (!agencyId) {
    return notFound("No agency found");
  }

  // Get all business IDs in this agency
  const { data: businesses, error: bizError } = await supabase
    .from("businesses")
    .select("id")
    .eq("agency_id", agencyId);

  if (bizError) {
    return internalError(bizError.message);
  }

  const businessIds = (businesses ?? []).map((b) => b.id);

  if (businessIds.length === 0) {
    return NextResponse.json({
      total_leads: 0,
      total_conversions: 0,
      avg_ai_score: null,
      active_campaigns: 0,
      messages_sent: 0,
      leads_this_month: 0,
      sms_this_month: 0,
      emails_this_month: 0,
      client_count: 0,
      clients: [],
    });
  }

  const month = new Date().toISOString().slice(0, 7);
  const monthStart = `${month}-01T00:00:00.000Z`;

  // Previous month for comparison
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = prevDate.toISOString().slice(0, 7);

  // Run all queries in parallel
  const [
    totalLeadsResult,
    conversionsThisMonthResult,
    aiScoreResult,
    activeCampaignsResult,
    usageThisMonthResult,
    usagePrevMonthResult,
    clientPerformanceResult,
  ] = await Promise.all([
    // Total leads across all clients
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .in("business_id", businessIds),

    // Conversions this month
    supabase
      .from("conversions")
      .select("id", { count: "exact", head: true })
      .in("business_id", businessIds)
      .gte("converted_at", monthStart),

    // Average AI score across all leads
    supabase
      .from("leads")
      .select("ai_score")
      .in("business_id", businessIds)
      .not("ai_score", "is", null),

    // Active campaigns
    supabase
      .from("campaigns")
      .select("id", { count: "exact", head: true })
      .in("business_id", businessIds)
      .eq("status", "active"),

    // Usage this month
    supabase
      .from("usage_tracking")
      .select("business_id, leads_count, sms_count, emails_count")
      .in("business_id", businessIds)
      .eq("month", month),

    // Usage previous month (for comparison)
    supabase
      .from("usage_tracking")
      .select("business_id, leads_count, sms_count, emails_count")
      .in("business_id", businessIds)
      .eq("month", prevMonth),

    // Per-client performance: businesses with their leads and conversions this month
    supabase
      .from("businesses")
      .select("id, name, type, location_city, location_state")
      .eq("agency_id", agencyId),
  ]);

  // Compute aggregate stats
  const totalLeads = totalLeadsResult.count ?? 0;
  const conversionsThisMonth = conversionsThisMonthResult.count ?? 0;
  const activeCampaigns = activeCampaignsResult.count ?? 0;

  // Weighted average AI score
  const scores = (aiScoreResult.data ?? []).map((l) => l.ai_score as number);
  const avgAiScore =
    scores.length > 0
      ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
      : null;

  // Usage aggregation
  const usageThisMonth = usageThisMonthResult.data ?? [];
  const leadsThisMonth = usageThisMonth.reduce((sum, u) => sum + (u.leads_count ?? 0), 0);
  const smsThisMonth = usageThisMonth.reduce((sum, u) => sum + (u.sms_count ?? 0), 0);
  const emailsThisMonth = usageThisMonth.reduce((sum, u) => sum + (u.emails_count ?? 0), 0);
  const messagesSent = emailsThisMonth + smsThisMonth;

  // Previous month for comparison
  const usagePrevMonth = usagePrevMonthResult.data ?? [];
  const leadsPrevMonth = usagePrevMonth.reduce((sum, u) => sum + (u.leads_count ?? 0), 0);
  const conversionRate =
    leadsThisMonth > 0
      ? parseFloat(((conversionsThisMonth / leadsThisMonth) * 100).toFixed(1))
      : 0;

  // Build per-client usage map
  const usageByBusiness: Record<string, { leads: number; sms: number; emails: number }> = {};
  for (const u of usageThisMonth) {
    usageByBusiness[u.business_id] = {
      leads: u.leads_count ?? 0,
      sms: u.sms_count ?? 0,
      emails: u.emails_count ?? 0,
    };
  }

  // Per-client conversions this month - we need to query per business
  const clientConversionsResult = await supabase
    .from("conversions")
    .select("business_id")
    .in("business_id", businessIds)
    .gte("converted_at", monthStart);

  const conversionsByBusiness: Record<string, number> = {};
  for (const c of clientConversionsResult.data ?? []) {
    if (c.business_id) {
      conversionsByBusiness[c.business_id] = (conversionsByBusiness[c.business_id] ?? 0) + 1;
    }
  }

  // Per-client avg AI score
  const scoresByBusiness: Record<string, number[]> = {};
  for (const l of aiScoreResult.data ?? []) {
    // We need business_id on leads - re-query with business_id
    // Actually we already have all leads with ai_score, but we don't have business_id here
    // Let's do a separate lightweight query
  }

  // Fetch per-client AI scores
  const clientScoresResult = await supabase
    .from("leads")
    .select("business_id, ai_score")
    .in("business_id", businessIds)
    .not("ai_score", "is", null);

  for (const l of clientScoresResult.data ?? []) {
    if (!scoresByBusiness[l.business_id]) {
      scoresByBusiness[l.business_id] = [];
    }
    scoresByBusiness[l.business_id].push(l.ai_score as number);
  }

  // Build per-client stats
  const clientBiz = clientPerformanceResult.data ?? [];
  const clients = clientBiz.map((biz) => {
    const usage = usageByBusiness[biz.id] ?? { leads: 0, sms: 0, emails: 0 };
    const convCount = conversionsByBusiness[biz.id] ?? 0;
    const bizScores = scoresByBusiness[biz.id] ?? [];
    const bizAvgScore =
      bizScores.length > 0
        ? parseFloat((bizScores.reduce((a, b) => a + b, 0) / bizScores.length).toFixed(1))
        : null;
    const bizConvRate =
      usage.leads > 0
        ? parseFloat(((convCount / usage.leads) * 100).toFixed(1))
        : 0;

    return {
      id: biz.id,
      name: biz.name,
      type: biz.type,
      location_city: biz.location_city,
      location_state: biz.location_state,
      leads_this_month: usage.leads,
      conversions_this_month: convCount,
      conversion_rate: bizConvRate,
      avg_ai_score: bizAvgScore,
      messages_sent: usage.emails + usage.sms,
    };
  });

  return NextResponse.json({
    total_leads: totalLeads,
    total_conversions: conversionsThisMonth,
    avg_ai_score: avgAiScore,
    active_campaigns: activeCampaigns,
    messages_sent: messagesSent,
    leads_this_month: leadsThisMonth,
    leads_prev_month: leadsPrevMonth,
    sms_this_month: smsThisMonth,
    emails_this_month: emailsThisMonth,
    conversion_rate: conversionRate,
    client_count: businessIds.length,
    clients,
  });
}

async function getAgencyId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_user_id", userId)
    .single();

  if (agency) return agency.id;

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", userId)
    .single();

  return membership?.agency_id ?? null;
}
