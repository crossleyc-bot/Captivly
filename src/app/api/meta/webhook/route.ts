import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO: Validate webhook signature
  // TODO: Parse lead data from Meta webhook payload
  // TODO: Save lead to Supabase
  // TODO: Trigger AI lead scoring
  // TODO: Queue sequence messages

  console.log("Meta webhook received:", JSON.stringify(body));

  return NextResponse.json({ received: true });
}
