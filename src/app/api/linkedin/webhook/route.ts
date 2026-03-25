import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/service";
import { processInboundLead } from "@/lib/process-inbound-lead";
import { decryptToken } from "@/lib/token-encryption";
import { saveToDeadLetter } from "@/lib/webhook-dead-letter";
import { LINKEDIN_API_BASE_URL } from "@/lib/constants";

interface LinkedInWebhookBody {
  input: {
    leadGenFormUrn: string;
    leadGenFormResponseUrn: string;
    sponsoredAccountUrn: string;
    sponsoredCampaignUrn: string;
  };
}

/**
 * Receives lead form submissions from LinkedIn Lead Gen Forms.
 */
export async function POST(request: NextRequest) {
  const body: LinkedInWebhookBody = await request.json();

  const { leadGenFormUrn, leadGenFormResponseUrn, sponsoredAccountUrn } =
    body.input ?? {};

  if (!leadGenFormResponseUrn || !sponsoredAccountUrn) {
    return NextResponse.json({ received: true });
  }

  // Extract IDs from URNs
  const adAccountId = sponsoredAccountUrn.replace("urn:li:sponsoredAccount:", "");
  const formId = leadGenFormUrn?.replace("urn:li:leadGenForm:", "") ?? null;
  const responseId = leadGenFormResponseUrn.replace("urn:li:leadGenFormResponse:", "");

  const supabase = getServiceClient();

  // Find business by LinkedIn ad account ID
  const { data: business } = await supabase
    .from("businesses")
    .select("id, linkedin_access_token, linkedin_refresh_token")
    .eq("linkedin_ad_account_id", adAccountId)
    .single();

  if (!business?.linkedin_access_token) {
    return NextResponse.json({ received: true });
  }

  const accessToken = decryptToken(business.linkedin_access_token);

  // Fetch full lead response data from LinkedIn API
  const fieldData: Record<string, string> = {};
  try {
    const leadRes = await fetch(
      `${LINKEDIN_API_BASE_URL}/leadGenFormResponses/${encodeURIComponent(leadGenFormResponseUrn)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    if (leadRes.ok) {
      const leadData = await leadRes.json();
      for (const answer of leadData.answers ?? []) {
        if (answer.fieldName && answer.value) {
          fieldData[answer.fieldName.toLowerCase()] = answer.value;
        }
      }
    }
  } catch {
    // If we can't fetch lead data, still save what we can
  }

  // Find campaign by linkedin_form_id
  const { data: campaign } = formId
    ? await supabase
        .from("campaigns")
        .select("id")
        .eq("business_id", business.id)
        .eq("linkedin_form_id", formId)
        .single()
    : { data: null };

  const result = await processInboundLead({
    source: "linkedin",
    businessId: business.id,
    campaignId: campaign?.id ?? null,
    platformLeadId: responseId,
    platformLeadIdColumn: "linkedin_lead_id",
    fieldData,
    rawPayload: body as unknown as Record<string, unknown>,
  });

  if (!result.saved && result.skipReason === "insert_failed") {
    await saveToDeadLetter({
      source: "linkedin",
      payload: body as unknown as Record<string, unknown>,
      error_message: "Lead insert failed",
    });
  }

  return NextResponse.json({ received: true });
}
