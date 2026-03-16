import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service role client for webhook processing (no user session)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_VERIFY_TOKEN) {
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
  const body: MetaWebhookBody = await request.json();

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

      // Fetch full lead data from Meta
      const leadRes = await fetch(
        `https://graph.facebook.com/v21.0/${leadgen_id}?access_token=${business.meta_access_token}`
      );
      const leadData = await leadRes.json();

      if (!leadRes.ok) continue;

      // Parse field data from Meta's format
      const fieldData: Record<string, string> = {};
      for (const field of leadData.field_data ?? []) {
        fieldData[field.name] = field.values?.[0] ?? "";
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

        const plan = dbUser?.plan_tier ?? "starter";
        const planLimits: Record<string, number> = {
          starter: 100,
          growth: 500,
          pro: 2000,
        };

        const { data: usage } = await supabase
          .from("usage_tracking")
          .select("leads_count")
          .eq("business_id", business.id)
          .eq("month", month)
          .single();

        if ((usage?.leads_count ?? 0) >= (planLimits[plan] ?? 100)) {
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

      // Trigger AI lead scoring asynchronously
      // The scoring endpoint will be called by the app internally
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/leads/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lead_id: lead.id }),
        });
      } catch {
        // Scoring failure shouldn't block lead ingestion
      }
    }
  }

  return NextResponse.json({ received: true });
}
