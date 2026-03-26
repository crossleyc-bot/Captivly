import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import {
  markDeadLetterProcessed,
  markDeadLetterRetried,
} from "@/lib/webhook-dead-letter";
import {
  unauthorized,
  badRequest,
  notFound,
  forbidden,
  handleApiError,
} from "@/lib/error-handler";

const WEBHOOK_ENDPOINTS: Record<string, string> = {
  meta: "/api/meta/webhook",
  google: "/api/google/webhook",
  tiktok: "/api/tiktok/webhook",
  linkedin: "/api/linkedin/webhook",
};

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return unauthorized();

    const body = await request.json();
    const deadLetterId = body.dead_letter_id;

    if (!deadLetterId || typeof deadLetterId !== "string") {
      return badRequest("Missing dead_letter_id");
    }

    // Fetch dead letter entry using service client (bypasses RLS)
    const serviceClient = getServiceClient();
    const { data: entry, error: fetchError } = await serviceClient
      .from("webhook_dead_letters")
      .select("id, source, payload, retry_count, status, business_id")
      .eq("id", deadLetterId)
      .single();

    if (fetchError || !entry) {
      return notFound("Dead letter entry not found");
    }

    // Verify the entry belongs to a business owned by this user
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", entry.business_id)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return forbidden("You do not have access to this entry");
    }

    if (entry.status !== "pending") {
      return badRequest("This entry has already been processed or dismissed");
    }

    if (entry.retry_count >= 5) {
      return badRequest("Maximum retry attempts exceeded");
    }

    // Re-dispatch the webhook payload to the appropriate handler
    const endpoint = WEBHOOK_ENDPOINTS[entry.source];
    if (!endpoint) {
      return badRequest(`Unknown webhook source: ${entry.source}`);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const targetUrl = `${appUrl}${endpoint}`;

    try {
      const webhookRes = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry.payload),
      });

      if (webhookRes.ok) {
        await markDeadLetterProcessed(entry.id);
        return NextResponse.json({ success: true, status: "processed" });
      }

      // Webhook handler returned an error — increment retry count
      const errorText = await webhookRes.text().catch(() => "Unknown error");
      await markDeadLetterRetried(
        entry.id,
        `Retry failed with status ${webhookRes.status}: ${errorText.slice(0, 200)}`
      );

      return NextResponse.json({
        success: false,
        status: "retried",
        error: `Webhook returned ${webhookRes.status}`,
      });
    } catch (fetchErr) {
      const errorMsg =
        fetchErr instanceof Error ? fetchErr.message : "Unknown fetch error";
      await markDeadLetterRetried(entry.id, `Retry fetch error: ${errorMsg}`);

      return NextResponse.json({
        success: false,
        status: "retried",
        error: errorMsg,
      });
    }
  } catch (err) {
    return handleApiError(err, "webhooks/retry");
  }
}
