import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requirePlan } from "@/lib/feature-gate";
import type { PlanTier } from "@/types/database";
import Link from "next/link";
import { WhiteLabelForm } from "./white-label-form";
import { CustomDomainSection } from "./custom-domain-section";

export default async function WhiteLabelPage() {
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

  if (!requirePlan(plan, "pro")) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">White-Labeling</h1>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
          <p className="text-sm text-yellow-800">
            White-labeling is available on the <strong>Pro plan</strong>.
            Upgrade to customize your branding.
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  const { data: config } = await supabase
    .from("white_label_config")
    .select("*")
    .eq("business_id", business.id)
    .single();

  const { data: customDomain } = await supabase
    .from("custom_domains")
    .select("*")
    .eq("business_id", business.id)
    .single();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">White-Labeling</h1>
        <p className="mt-1 text-sm text-slate-500">
          Customize the branding of your dashboard and customer-facing pages.
        </p>
      </div>
      <WhiteLabelForm
        initialConfig={
          config ?? {
            app_name: "Captivly.ai",
            logo_url: "",
            primary_color: "#18181b",
            accent_color: "#3b82f6",
            favicon_url: "",
            hide_captivly_branding: false,
          }
        }
      />
      <CustomDomainSection initialDomain={customDomain ?? null} />
    </div>
  );
}
