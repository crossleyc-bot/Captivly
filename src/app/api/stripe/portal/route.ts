import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { unauthorized, badRequest } from "@/lib/error-handler";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return unauthorized();
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!dbUser?.stripe_customer_id) {
    return badRequest("No billing account found. Please subscribe to a plan first.");
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: dbUser.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
  });

  return NextResponse.json({ url: session.url });
}
