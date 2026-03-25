import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getServiceClient } from "@/lib/supabase/service";
import { META_API_BASE_URL } from "@/lib/constants";
import { decryptToken } from "@/lib/token-encryption";
import { processInboundLead } from "@/lib/process-inbound-lead";
import { saveToDeadLetter } from "@/lib/webhook-dead-letter";

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
  // In production, always require signature verification
  if (!appSecret && process.env.NODE_ENV === "production") {
    console.error("META_APP_SECRET is not configured in production");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (appSecret) {
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 403 });
    }

    const rawBody = await request.text();
    const expectedSig = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex");

    if (
      signature.length !== expectedSig.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    ) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    // Re-parse the body since we consumed it
    try {
      body = JSON.parse(rawBody) as MetaWebhookBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
  } else {
    // Development only: allow unsigned requests
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

      const accessToken = decryptToken(business.meta_access_token);

      // Fetch full lead data from Meta
      let leadData: Record<string, unknown>;
      try {
        const leadRes = await fetch(
          `${META_API_BASE_URL}/${leadgen_id}?access_token=${accessToken}`
        );
        if (!leadRes.ok) {
          console.error(`Meta API error for lead ${leadgen_id}: ${leadRes.status} ${leadRes.statusText}`);
          continue;
        }
        leadData = await leadRes.json();
      } catch (err) {
        console.error(`Failed to fetch lead ${leadgen_id} from Meta:`, err);
        continue;
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

      // Use shared lead processing (dedup, limit check, upsert, scoring, referral)
      const result = await processInboundLead({
        source: "meta",
        businessId: business.id,
        campaignId: campaign?.id ?? null,
        platformLeadId: leadgen_id,
        platformLeadIdColumn: "meta_lead_id",
        fieldData,
        rawPayload: { leadgen_id, page_id, form_id },
      });

      if (!result.saved && result.skipReason === "insert_failed") {
        await saveToDeadLetter({
          source: "meta",
          payload: { leadgen_id, page_id, form_id, fieldData },
          error_message: "Lead insert failed",
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
