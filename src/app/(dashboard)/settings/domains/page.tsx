import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requirePlan } from "@/lib/feature-gate";
import type { PlanTier, CustomDomain } from "@/types/database";
import { CustomDomainManager } from "./custom-domain-manager";

export default async function CustomDomainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: dbUser } = await supabase
    .from("users")
    .select("plan_tier")
    .eq("id", user.id)
    .single();

  const plan = (dbUser?.plan_tier ?? "starter") as PlanTier;
  const isPro = requirePlan(plan, "pro");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  let domain: CustomDomain | null = null;

  if (isPro) {
    const { data } = await supabase
      .from("custom_domains")
      .select("*")
      .eq("business_id", business.id)
      .single();

    domain = data as CustomDomain | null;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <Link
          href="/settings"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          &larr; Back to Settings
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Custom Domain</h1>
        <p className="mt-1 text-sm text-slate-500">
          Use your own domain for your Captivly-powered pages and widget.
        </p>
      </div>

      {!isPro ? (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="text-sm font-semibold text-yellow-800">
            Pro Plan Required
          </p>
          <p className="mt-1 text-sm text-yellow-700">
            Custom domains are available on the Pro plan. Upgrade to use your
            own domain.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Upgrade Plan
          </Link>
        </div>
      ) : (
        <CustomDomainManager
          businessId={business.id}
          initialDomain={domain}
        />
      )}
    </div>
  );
}
