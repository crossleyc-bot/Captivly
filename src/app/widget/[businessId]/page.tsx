import { getServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import { ChatWidget } from "./chat-widget";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default async function WidgetPage({ params }: Props) {
  const { businessId } = await params;
  const supabase = getServiceClient();

  // Verify business + Pro plan + widget enabled
  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, type, user_id")
    .eq("id", businessId)
    .single();

  if (!business) notFound();

  const { data: user } = await supabase
    .from("users")
    .select("plan_tier, subscription_status")
    .eq("id", business.user_id)
    .single();

  if (!user || user.plan_tier !== "pro" || user.subscription_status !== "active") {
    notFound();
  }

  const { data: config } = await supabase
    .from("chat_widget_config")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (!config?.is_enabled) notFound();

  return (
    <ChatWidget
      businessId={businessId}
      businessName={business.name}
      greeting={config.greeting}
      accentColor={config.accent_color}
      apiUrl={`${process.env.NEXT_PUBLIC_APP_URL}/api/chat`}
    />
  );
}
