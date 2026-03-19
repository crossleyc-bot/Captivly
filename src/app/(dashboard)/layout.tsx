import { SidebarNav } from "./sidebar-nav";
import { UsageBanner } from "@/components/usage-banner";
import { BrandingProvider } from "./branding-provider";
import type { BrandingConfig } from "./branding-provider";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let branding: BrandingConfig | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (business) {
        const { data: config } = await supabase
          .from("white_label_config")
          .select("app_name, logo_url, primary_color, accent_color, favicon_url, hide_captivly_branding")
          .eq("business_id", business.id)
          .single();

        if (config) {
          branding = config as BrandingConfig;
        }
      }
    }
  } catch {
    // Fall back to default branding
  }

  return (
    <BrandingProvider branding={branding}>
      <div className="flex min-h-screen">
        <SidebarNav />
        <main className="flex-1 space-y-6 p-8 pt-20 lg:pt-8">
          <UsageBanner />
          {children}
        </main>
      </div>
    </BrandingProvider>
  );
}
