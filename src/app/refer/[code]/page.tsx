import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceClient } from "@/lib/supabase/service";
import { ReferralClickTracker } from "./referral-click-tracker";

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const supabase = getServiceClient();

  const { data: link } = await supabase
    .from("referral_links")
    .select("referrer_name, business:businesses(name, type, primary_offer)")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  const business = (link?.business ?? null) as unknown as { name: string; type: string; primary_offer: string | null } | null;

  if (!business) {
    return { title: "Referral — Captivly.ai" };
  }

  return {
    title: `${business.name} — Referred to You | Captivly.ai`,
    description: business.primary_offer ?? `Check out ${business.name} — a great local ${business.type}.`,
  };
}

export default async function ReferralLandingPage({ params }: PageProps) {
  const { code } = await params;
  const supabase = getServiceClient();

  const { data: link } = await supabase
    .from("referral_links")
    .select("id, code, referrer_name, is_active, business:businesses(name, type, primary_offer, location_city, location_state)")
    .eq("code", code)
    .eq("is_active", true)
    .single();

  if (!link) {
    notFound();
  }

  const business = (link.business ?? null) as unknown as {
    name: string;
    type: string;
    primary_offer: string | null;
    location_city: string | null;
    location_state: string | null;
  } | null;

  if (!business) {
    notFound();
  }

  const location =
    business.location_city && business.location_state
      ? `${business.location_city}, ${business.location_state}`
      : business.location_city || business.location_state || null;

  return (
    <div className="flex min-h-screen flex-col">
      <ReferralClickTracker code={code} />

      {/* Hero gradient background matching landing page style */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-orange-50/30 px-6 py-20">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-orange-100/40 blur-3xl" />

        <div className="relative w-full max-w-md">
          {/* Referral badge */}
          {link.referrer_name && (
            <div className="mb-6 text-center">
              <span className="inline-block rounded-full bg-orange-100 px-4 py-1.5 text-xs font-medium text-orange-700">
                Referred by {link.referrer_name}
              </span>
            </div>
          )}

          {/* Main card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
            {/* Business type pill */}
            <div className="text-center">
              <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium capitalize text-blue-600">
                {business.type}
              </span>
            </div>

            {/* Business name */}
            <h1 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900">
              {business.name}
            </h1>

            {/* Location */}
            {location && (
              <p className="mt-1 text-center text-sm text-slate-500">{location}</p>
            )}

            {/* Primary offer */}
            {business.primary_offer && (
              <div className="mt-6 rounded-lg bg-blue-50 px-4 py-3 text-center">
                <p className="text-xs font-medium uppercase tracking-wider text-blue-600">
                  Special Offer
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {business.primary_offer}
                </p>
              </div>
            )}

            {/* CTA */}
            <Link
              href={`/signup?ref=${code}`}
              className="mt-8 block rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30"
            >
              Claim This Offer
            </Link>

            <p className="mt-3 text-center text-xs text-slate-400">
              Free to sign up. No credit card required.
            </p>
          </div>

          {/* Powered by Captivly */}
          <p className="mt-6 text-center text-xs text-slate-400">
            Powered by{" "}
            <Link href="/" className="font-medium text-slate-500 hover:text-blue-600">
              Captivly.ai
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
