import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // TODO: Validate authenticated user
  // TODO: Create or retrieve Stripe customer
  // TODO: Create Stripe checkout session with the selected plan price
  // TODO: Return checkout URL

  console.log("Create checkout request:", JSON.stringify(body));

  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
