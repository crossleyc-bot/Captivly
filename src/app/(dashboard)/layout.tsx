import { SidebarNav } from "./sidebar-nav";
import { UsageBanner } from "@/components/usage-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <main className="flex-1 space-y-6 p-8 pt-20 lg:pt-8">
        <UsageBanner />
        {children}
      </main>
    </div>
  );
}
