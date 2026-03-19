import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getServiceClient } from "@/lib/supabase/service";
import { getInternalAuthHeader } from "@/lib/internal-auth";
import { PLAN_LIMITS, META_API_BASE_URL } from "@/lib/constants";
import type { PlanTier } from "@/types/database";

// Webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_VERIFY_TOKEN ?? "";
  if (
    mode === "subscribe" &&
    token &&
    token.length === verifyToken.length &&
    timingSafeEqual(Buffer.from(token), Buffer.from(verifyToken))
  ) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

interface MetaLeadEntry {
  changes: Array<{
    field: string;
    value: {
      form_id: string;
      leadgen_id: string;
      page_id: string;
      created_time: number;
    };
  }>;
}

interface MetaWebhookBody {
  object: string;
  entry: MetaLeadEntry[];
}

// Receive leads from Meta
export async function POST(request: NextRequest) {
  // Verify Meta webhook signature
  let body: MetaWebhookBody;
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.META_APP_SECRET;
  if (appSecret && signature) {
    const rawBody = await request.text();
    const expectedSig = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");

    if (
      signature.length !== expectedSig.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    // Re-parse the body since we consumed it
    body = JSON.parse(rawBody) as MetaWebhookBody;
  } else {
    body = await request.json();
  }

  // Must respond 200 quickly to Meta
  if (body.object !== "page") {
    return NextResponse.json({ received: true });
  }

  const supabase = getServiceClient();

  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field !== "leadgen") continue;

      const { leadgen_id, page_id, form_id } = change.value;

      // Find the business by page_id
      const { data: business } = await supabase
        .from("businesses")
        .select("id, meta_access_token, type, primary_offer, target_age_min, target_age_max, target_interests")
        .eq("meta_page_id", page_id)
        .single();

      if (!business?.meta_access_token) continue;

      // Deduplicate: skip if lead already exists
      const { count: existingCount } = await supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("meta_lead_id", leadgen_id);

      if ((existingCount ?? 0) > 0) continue;

      // Fetch full lead data from Meta
      let leadData: Record<string, unknown>;
      try {
        const leadRes = await fetch(
          `${META_API_BASE_URL}/${leadgen_id}?access_token=${business.meta_access_token}`
        );
        if (!leadRes.ok) continue;
        leadData = await leadRes.json();
      } catch {
        continue; // Skip on network/parse error
      }

      // Validate field_data before parsing
      if (!leadData.field_data || !Array.isArray(leadData.field_data)) continue;

      // Parse field data from Meta's format
      const fieldData: Record<string, string> = {};
      for (const field of leadData.field_data) {
        const f = field as { name?: string; values?: string[] };
        if (f.name && Array.isArray(f.values)) {
          fieldData[f.name] = f.values[0] ?? "";
        }
      }

      // Find the campaign by form_id
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("id")
        .eq("business_id", business.id)
        .eq("meta_form_id", form_id)
        .single();

      // Check lead usage limit
      const month = new Date().toISOString().slice(0, 7);
      const { data: user } = await supabase
        .from("businesses")
        .select("user_id")
        .eq("id", business.id)
        .single();

      if (user) {
        const { data: dbUser } = await supabase
          .from("users")
          .select("plan_tier")
          .eq("id", user.user_id)
          .single();

        const plan = (dbUser?.plan_tier ?? "starter") as PlanTier;

        const { data: usage } = await supabase
          .from("usage_tracking")
          .select("leads_count")
          .eq("business_id", business.id)
          .eq("month", month)
          .single();

        if ((usage?.leads_count ?? 0) >= PLAN_LIMITS[plan].leads_per_month) {
          // Over limit — skip this lead
          continue;
        }
      }

      // Save lead
      const { data: lead } = await supabase
        .from("leads")
        .insert({
          business_id: business.id,
          campaign_id: campaign?.id ?? null,
          meta_lead_id: leadgen_id,
          first_name: fieldData.full_name?.split(" ")[0] ?? fieldData.first_name ?? null,
          last_name: fieldData.full_name?.split(" ").slice(1).join(" ") ?? fieldData.last_name ?? null,
          email: fieldData.email ?? null,
          phone: fieldData.phone_number ?? null,
          custom_answers: fieldData,
          status: "new",
          source: "meta",
        })
        .select()
        .single();

      if (!lead) continue;

      // Increment usage
      await supabase.rpc("increment_usage", {
        p_business_id: business.id,
        p_month: month,
        p_field: "leads_count",
      });

      // Update campaign leads count
      if (campaign?.id) {
        await supabase.rpc("increment_campaign_leads", {
          p_campaign_id: campaign.id,
        });
      }

      // Check for referral code in custom answers
      const referralCode =
        fieldData.referral_code ??
        fieldData.ref ??
        fieldData.referred_by ??
        null;

      if (referralCode && typeof referralCode === "string") {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/referrals/track`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getInternalAuthHeader(),
          },
          body: JSON.stringify({
            lead_id: lead.id,
            referral_code: referralCode,
          }),
        }).catch(() => {
          // Referral attribution failure shouldn't block lead ingestion
        });
      }

      // Fire-and-forget: trigger AI lead scoring without blocking webhook response
      fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/leads/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getInternalAuthHeader(),
        },
        body: JSON.stringify({ lead_id: lead.id }),
      }).catch(() => {
        // Scoring failure shouldn't block lead ingestion
      });
    }
  }

  return NextResponse.json({ received: true });
}
