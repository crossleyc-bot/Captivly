import { NextRequest, NextResponse } from "next/server";

export async function POST(_request: NextRequest) {
  // TODO: Validate authenticated user
  // TODO: Get user's stripe_customer_id
  // TODO: Create Stripe billing portal session
  // TODO: Return portal URL

  console.log("Portal request received");

  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
