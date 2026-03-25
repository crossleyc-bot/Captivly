import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { unauthorized, badRequest } from "@/lib/error-handler";
import type { PlanTier } from "@/types/database";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { plan } = (await request.json()) as { plan: PlanTier };

  if (!plan || !STRIPE_PRICES[plan]) {
    return badRequest("Invalid plan");
  }

  // Get or create Stripe customer
  const { data: dbUser } = await supabase
    .from("users")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();

  let customerId = dbUser?.stripe_customer_id;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: dbUser?.email ?? user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from("users")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: STRIPE_PRICES[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    subscription_data: {
      metadata: { supabase_user_id: user.id, plan },
    },
  });

  return NextResponse.json({ url: session.url });
}
