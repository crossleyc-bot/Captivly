import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const _body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // TODO: Verify Stripe webhook signature
  // TODO: Handle subscription events:
  //   - checkout.session.completed → activate subscription
  //   - customer.subscription.updated → update plan tier
  //   - customer.subscription.deleted → deactivate subscription
  //   - invoice.payment_failed → mark as past_due

  console.log("Stripe webhook received");

  return NextResponse.json({ received: true });
}
