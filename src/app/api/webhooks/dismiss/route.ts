import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceClient } from "@/lib/supabase/service";
import { markDeadLetterFailed } from "@/lib/webhook-dead-letter";
import {
  unauthorized,
  badRequest,
  notFound,
  forbidden,
  handleApiError,
} from "@/lib/error-handler";

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
      .select("id, status, business_id")
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

    await markDeadLetterFailed(entry.id);

    return NextResponse.json({ success: true, status: "dismissed" });
  } catch (err) {
    return handleApiError(err, "webhooks/dismiss");
  }
}
