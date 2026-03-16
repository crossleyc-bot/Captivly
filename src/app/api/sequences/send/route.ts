import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO: Validate request (internal or authenticated)
  // TODO: Check usage limits (SMS)
  // TODO: Send via Resend (email) or Twilio (SMS)
  // TODO: Update messages_sent status
  // TODO: Increment usage_tracking counts

  console.log("Send sequence step request:", JSON.stringify(body));

  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
