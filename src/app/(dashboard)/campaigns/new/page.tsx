import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewCampaignForm } from "./new-campaign-form";

export default async function NewCampaignPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  return <NewCampaignForm />;
}
