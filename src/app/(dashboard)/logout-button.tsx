"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-md px-3 py-2 text-left text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
    >
      Log out
    </button>
  );
}
