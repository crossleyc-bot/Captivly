import Link from "next/link";
import { LogoutButton } from "./logout-button";
import { UsageBanner } from "@/components/usage-banner";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/leads", label: "Leads" },
  { href: "/sequences", label: "Sequences" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-zinc-50 px-4 py-6">
        <Link href="/dashboard" className="text-xl font-bold">
          Captivly
        </Link>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <LogoutButton />
      </aside>
      <main className="flex-1 space-y-6 p-8">
        <UsageBanner />
        {children}
      </main>
    </div>
  );
}
