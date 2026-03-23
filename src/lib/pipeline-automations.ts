import type { SupabaseClient } from "@supabase/supabase-js";
import { getResendClient } from "@/lib/resend";
import { getTwilioClient, TWILIO_FROM } from "@/lib/twilio";

interface AutomationRow {
  id: string;
  action_type: string;
  action_config: {
    subject?: string;
    body?: string;
    lead_status?: string;
    note?: string;
  };
}

interface LeadInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
}

/**
 * Execute all active automations triggered by a deal moving to a new stage.
 * Called from the deals PATCH endpoint after a stage change is persisted.
 *
 * Runs fire-and-forget — errors are logged but don't block the stage move response.
 */
export async function executePipelineAutomations(
  supabase: SupabaseClient,
  dealId: string,
  newStageId: string,
  businessId: string
): Promise<void> {
  // Find active automations for this stage
  const { data: automations } = await supabase
    .from("pipeline_automations")
    .select("id, action_type, action_config")
    .eq("trigger_stage_id", newStageId)
    .eq("business_id", businessId)
    .eq("is_active", true);

  if (!automations?.length) return;

  // Get the deal's associated lead
  const { data: deal } = await supabase
    .from("deals")
    .select("lead_id")
    .eq("id", dealId)
    .single();

  let lead: LeadInfo | null = null;
  if (deal?.lead_id) {
    const { data: leadData } = await supabase
      .from("leads")
      .select("id, first_name, last_name, email, phone")
      .eq("id", deal.lead_id)
      .single();
    lead = leadData;
  }

  for (const automation of automations as AutomationRow[]) {
    try {
      await executeAction(supabase, automation, dealId, lead);
    } catch (err) {
      console.error(`Pipeline automation ${automation.id} failed:`, err);
    }
  }
}

function interpolateTemplate(template: string, lead: LeadInfo | null): string {
  if (!lead) return template;
  return template
    .replace(/\{\{first_name\}\}/g, lead.first_name ?? "")
    .replace(/\{\{last_name\}\}/g, lead.last_name ?? "")
    .replace(/\{\{email\}\}/g, lead.email ?? "")
    .replace(/\{\{phone\}\}/g, lead.phone ?? "");
}

async function executeAction(
  supabase: SupabaseClient,
  automation: AutomationRow,
  dealId: string,
  lead: LeadInfo | null
): Promise<void> {
  const config = automation.action_config;

  switch (automation.action_type) {
    case "send_email": {
      if (!lead?.email || !config.subject || !config.body) return;
      const resend = getResendClient();
      const appDomain = process.env.NEXT_PUBLIC_APP_URL?.replace("https://", "").replace("http://", "") ?? "captivly.ai";
      await resend.emails.send({
        from: `Captivly.ai <noreply@${appDomain}>`,
        to: lead.email,
        subject: interpolateTemplate(config.subject, lead),
        text: interpolateTemplate(config.body, lead),
      });
      break;
    }

    case "send_sms": {
      if (!lead?.phone || !config.body) return;
      const twilioClient = getTwilioClient();
      await twilioClient.messages.create({
        body: interpolateTemplate(config.body, lead),
        from: TWILIO_FROM,
        to: lead.phone,
      });
      break;
    }

    case "update_lead_status": {
      if (!lead || !config.lead_status) return;
      await supabase
        .from("leads")
        .update({ status: config.lead_status, updated_at: new Date().toISOString() })
        .eq("id", lead.id);
      break;
    }

    case "create_activity_note": {
      if (!config.note) return;
      await supabase.from("deal_activities").insert({
        deal_id: dealId,
        type: "note",
        content: interpolateTemplate(config.note, lead),
      });
      break;
    }
  }
}
