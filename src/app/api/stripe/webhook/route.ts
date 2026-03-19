import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/service";

function planFromPriceId(priceId: string): string {
  const prices: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER!]: "starter",
    [process.env.STRIPE_PRICE_GROWTH!]: "growth",
    [process.env.STRIPE_PRICE_PRO!]: "pro",
  };
  return prices[priceId] ?? "starter";
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.subscription
        ? (
            await getStripe().subscriptions.retrieve(session.subscription as string)
          ).metadata.supabase_user_id
        : session.metadata?.supabase_user_id;

      if (userId && session.subscription) {
        const subscription = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const plan = planFromPriceId(priceId);

        await getServiceClient()
          .from("users")
          .update({
            stripe_subscription_id: subscription.id,
            plan_tier: plan,
            subscription_status: "active",
          })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      const priceId = subscription.items.data[0]?.price.id;
      const plan = planFromPriceId(priceId);

      const statusMap: Record<string, string> = {
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        unpaid: "past_due",
        trialing: "active",
      };

      // Check if downgrading from Pro — deactivate Phase 4 features
      const serviceClient = getServiceClient();
      const { data: currentUser } = await serviceClient
        .from("users")
        .select("plan_tier")
        .eq("id", userId)
        .single();

      const wasOnPro = currentUser?.plan_tier === "pro";
      const isNowPro = plan === "pro";

      await serviceClient
        .from("users")
        .update({
          plan_tier: plan,
          subscription_status: statusMap[subscription.status] ?? "inactive",
        })
        .eq("id", userId);

      // If downgrading from Pro, deactivate white-label and custom domains
      if (wasOnPro && !isNowPro) {
        const { data: business } = await serviceClient
          .from("businesses")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (business) {
          // Reset white-label branding to defaults
          await serviceClient
            .from("white_label_config")
            .update({
              hide_captivly_branding: false,
              custom_domain: null,
              custom_domain_verified: false,
            })
            .eq("business_id", business.id);

          // Unverify custom domains (keep records for re-upgrade)
          await serviceClient
            .from("custom_domains")
            .update({ verified: false, ssl_provisioned: false })
            .eq("business_id", business.id);
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      const serviceClient = getServiceClient();

      // Check if was on Pro before cancellation
      const { data: cancelledUser } = await serviceClient
        .from("users")
        .select("plan_tier")
        .eq("id", userId)
        .single();

      await serviceClient
        .from("users")
        .update({
          plan_tier: "starter",
          subscription_status: "canceled",
          stripe_subscription_id: null,
        })
        .eq("id", userId);

      // Deactivate Phase 4 features if was on Pro
      if (cancelledUser?.plan_tier === "pro") {
        const { data: business } = await serviceClient
          .from("businesses")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (business) {
          await serviceClient
            .from("white_label_config")
            .update({
              hide_captivly_branding: false,
              custom_domain: null,
              custom_domain_verified: false,
            })
            .eq("business_id", business.id);

          await serviceClient
            .from("custom_domains")
            .update({ verified: false, ssl_provisioned: false })
            .eq("business_id", business.id);
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const { data: dbUser } = await getServiceClient()
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (dbUser) {
        await getServiceClient()
          .from("users")
          .update({ subscription_status: "past_due" })
          .eq("id", dbUser.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
