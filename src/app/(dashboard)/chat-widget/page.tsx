import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requirePlan } from "@/lib/feature-gate";
import type { PlanTier } from "@/types/database";
import Link from "next/link";
import { ChatWidgetSettings } from "./chat-widget-settings";

export default async function ChatWidgetPage() {
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
      <div className="max-w-xl space-y-4">
        <h1 className="text-2xl font-bold">AI Chat Widget</h1>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">
            The AI chat widget is available on the{" "}
            <span className="font-semibold text-slate-900">Pro plan</span>.
          </p>
          <Link
            href="/settings"
            className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  // Get or create widget config
  let { data: config } = await supabase
    .from("chat_widget_config")
    .select("*")
    .eq("business_id", business.id)
    .single();

  if (!config) {
    const { data: newConfig } = await supabase
      .from("chat_widget_config")
      .insert({ business_id: business.id })
      .select("*")
      .single();
    config = newConfig;
  }

  if (!config) {
    return <p className="text-sm text-red-500">Failed to load widget config.</p>;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.captivly.ai";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">AI Chat Widget</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add an AI-powered chat to your website. Visitors can ask questions and
          get instant answers about your business.
        </p>
      </div>

      <ChatWidgetSettings
        businessId={business.id}
        initialConfig={{
          is_enabled: config.is_enabled,
          greeting: config.greeting,
          accent_color: config.accent_color,
          position: config.position,
        }}
        embedCode={`<script src="${appUrl}/widget-loader.js" data-business-id="${business.id}" data-position="${config.position ?? "bottom-right"}" data-color="${config.accent_color ?? "#18181b"}"></script>`}
      />
    </div>
  );
}
