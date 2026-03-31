import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { getServiceClient } from "@/lib/supabase/service";
import { logger } from "@/lib/logger";

function planFromPriceId(priceId: string): string {
  const prices: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER!]: "starter",
    [process.env.STRIPE_PRICE_GROWTH!]: "growth",
    [process.env.STRIPE_PRICE_PRO!]: "pro",
  };
  return prices[priceId] ?? "starter";
}

async function deactivateProFeatures(
  serviceClient: ReturnType<typeof getServiceClient>,
  userId: string
): Promise<void> {
  const { data: business } = await serviceClient
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!business) return;

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

  const serviceClient = getServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      if (!session.subscription) break;

      const subscription = await getStripe().subscriptions.retrieve(
        session.subscription as string
      );
      const userId =
        subscription.metadata?.supabase_user_id ??
        session.metadata?.supabase_user_id;

      if (!userId) {
        logger.error("Stripe webhook: checkout.session.completed missing supabase_user_id in metadata", {
          sessionId: session.id,
          subscriptionId: subscription.id,
          customerId: session.customer,
        });
        break;
      }

      {
        const priceId = subscription.items.data[0]?.price.id;
        const plan = planFromPriceId(priceId);
        const customerId =
          (typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id) ??
          (session.customer as string | null);

        const { error } = await serviceClient
          .from("users")
          .update({
            stripe_customer_id: customerId ?? undefined,
            stripe_subscription_id: subscription.id,
            plan_tier: plan,
            subscription_status: "active",
          })
          .eq("id", userId);

        if (error) {
          logger.error("Stripe webhook: failed to update user on checkout", {
            userId,
            error: error.message,
          });
        }
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
        incomplete: "inactive",
        incomplete_expired: "canceled",
        paused: "inactive",
      };

      // Check if downgrading from Pro — deactivate Phase 4 features
      const { data: currentUser } = await serviceClient
        .from("users")
        .select("plan_tier")
        .eq("id", userId)
        .single();

      const wasOnPro = currentUser?.plan_tier === "pro";
      const isNowPro = plan === "pro";

      const mappedStatus = statusMap[subscription.status];
      if (!mappedStatus) {
        logger.warn("Stripe webhook: unmapped subscription status", {
          userId,
          stripeStatus: subscription.status,
          defaultingTo: "inactive",
        });
      }

      const { error } = await serviceClient
        .from("users")
        .update({
          plan_tier: plan,
          subscription_status: mappedStatus ?? "inactive",
        })
        .eq("id", userId);

      if (error) {
        logger.error("Stripe webhook: failed to update user on subscription change", {
          userId,
          error: error.message,
        });
      }

      if (wasOnPro && !isNowPro) {
        await deactivateProFeatures(serviceClient, userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata.supabase_user_id;
      if (!userId) break;

      // Check if was on Pro before cancellation
      const { data: cancelledUser } = await serviceClient
        .from("users")
        .select("plan_tier")
        .eq("id", userId)
        .single();

      const { error } = await serviceClient
        .from("users")
        .update({
          plan_tier: "starter",
          subscription_status: "canceled",
          stripe_subscription_id: null,
        })
        .eq("id", userId);

      if (error) {
        logger.error("Stripe webhook: failed to update user on subscription delete", {
          userId,
          error: error.message,
        });
      }

      if (cancelledUser?.plan_tier === "pro") {
        await deactivateProFeatures(serviceClient, userId);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      const { data: dbUser } = await serviceClient
        .from("users")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();

      if (dbUser) {
        await serviceClient
          .from("users")
          .update({ subscription_status: "past_due" })
          .eq("id", dbUser.id);
      } else {
        logger.error("Stripe webhook: no user found for failed invoice", {
          customerId,
        });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      // Only restore status if the user is currently past_due
      const { data: dbUser } = await serviceClient
        .from("users")
        .select("id, subscription_status")
        .eq("stripe_customer_id", customerId)
        .single();

      if (dbUser?.subscription_status === "past_due") {
        await serviceClient
          .from("users")
          .update({ subscription_status: "active" })
          .eq("id", dbUser.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
