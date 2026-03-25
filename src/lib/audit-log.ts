import { getServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";

export type AuditAction =
  | "user.login"
  | "user.signup"
  | "user.plan_change"
  | "business.create"
  | "business.update"
  | "campaign.create"
  | "campaign.update"
  | "campaign.delete"
  | "lead.score"
  | "lead.status_change"
  | "sequence.create"
  | "sequence.send"
  | "api_key.create"
  | "api_key.delete"
  | "oauth.connect"
  | "oauth.disconnect"
  | "oauth.token_refresh"
  | "agency.create"
  | "agency.member_add"
  | "agency.member_remove"
  | "agency.client_add"
  | "agency.client_remove"
  | "white_label.update"
  | "custom_domain.register"
  | "custom_domain.verify"
  | "custom_domain.delete"
  | "subscription.checkout"
  | "subscription.cancel"
  | "subscription.payment_failed"
  | "webhook.received"
  | "webhook.failed";

interface AuditLogEntry {
  user_id?: string | null;
  business_id?: string | null;
  action: AuditAction;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
}

/**
 * Records an audit log entry. Fire-and-forget — never blocks the caller.
 * Falls back to structured logging if the database insert fails.
 */
export function auditLog(entry: AuditLogEntry): void {
  const record = {
    user_id: entry.user_id ?? null,
    business_id: entry.business_id ?? null,
    action: entry.action,
    resource_type: entry.resource_type ?? null,
    resource_id: entry.resource_id ?? null,
    details: entry.details ?? null,
    ip_address: entry.ip_address ?? null,
    created_at: new Date().toISOString(),
  };

  // Always log structurally regardless of DB success
  logger.info(`audit: ${entry.action}`, {
    ...record,
  });

  // Fire-and-forget DB insert
  const supabase = getServiceClient();
  supabase
    .from("audit_logs")
    .insert(record)
    .then(({ error }) => {
      if (error) {
        logger.warn("Failed to write audit log to database", {
          action: entry.action,
          error: error.message,
        });
      }
    });
}
