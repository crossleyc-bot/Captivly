"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OutreachTone, PlanTier } from "@/types/database";

const PLANS: { tier: PlanTier; name: string; price: string; features: string }[] = [
  { tier: "starter", name: "Starter", price: "$49/mo", features: "100 leads, 1 campaign, 3-step email sequences" },
  { tier: "growth", name: "Growth", price: "$99/mo", features: "500 leads, 5 campaigns, SMS + email, 5-step sequences" },
  { tier: "pro", name: "Pro", price: "$199/mo", features: "2,000 leads, unlimited campaigns, AI reports, chat widget" },
];

const BUSINESS_TYPES = [
  "Gym / Fitness Studio",
  "Salon / Barbershop",
  "Restaurant / Cafe",
  "Home Services",
  "Dental / Medical",
  "Real Estate",
  "Other",
];

const INTEREST_OPTIONS = [
  "Fitness",
  "Wellness",
  "Beauty",
  "Food & Dining",
  "Home Improvement",
  "Health",
  "Family",
  "Sports",
  "Lifestyle",
];

interface OnboardingData {
  name: string;
  type: string;
  location_city: string;
  location_state: string;
  location_zip: string;
  target_age_min: number;
  target_age_max: number;
  target_radius_miles: number;
  target_interests: string[];
  primary_offer: string;
  outreach_tone: OutreachTone;
}

const INITIAL_DATA: OnboardingData = {
  name: "",
  type: "",
  location_city: "",
  location_state: "",
  location_zip: "",
  target_age_min: 18,
  target_age_max: 65,
  target_radius_miles: 10,
  target_interests: [],
  primary_offer: "",
  outreach_tone: "friendly",
};

const STEP_TITLES = [
  "Business basics",
  "Target audience",
  "Primary offer",
  "Connect Meta",
  "Choose plan",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>("starter");
  const [loading, setLoading] = useState(false);

  function update(fields: Partial<OnboardingData>) {
    setData((prev) => ({ ...prev, ...fields }));
  }

  function toggleInterest(interest: string) {
    setData((prev) => ({
      ...prev,
      target_interests: prev.target_interests.includes(interest)
        ? prev.target_interests.filter((i) => i !== interest)
        : [...prev.target_interests, interest],
    }));
  }

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return data.name.trim() !== "" && data.type !== "";
      case 1:
        return data.target_interests.length > 0;
      case 2:
        return data.primary_offer.trim() !== "";
      case 3:
        return true; // Meta connect is optional during onboarding
      case 4:
        return true;
      default:
        return false;
    }
  }

  async function handleFinish() {
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    // Ensure the public.users row exists (covers cases where the DB trigger didn't fire)
    const { error: upsertError } = await supabase.from("users").upsert(
      {
        id: user.id,
        email: user.email ?? "",
        full_name: (user.user_metadata?.full_name as string) ?? null,
      },
      { onConflict: "id" }
    );

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("businesses").insert({
      user_id: user.id,
      name: data.name.trim(),
      type: data.type,
      location_city: data.location_city.trim() || null,
      location_state: data.location_state.trim() || null,
      location_zip: data.location_zip.trim() || null,
      target_age_min: data.target_age_min,
      target_age_max: data.target_age_max,
      target_radius_miles: data.target_radius_miles,
      target_interests: data.target_interests,
      primary_offer: data.primary_offer.trim(),
      outreach_tone: data.outreach_tone,
      onboarding_completed: true,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Redirect to Stripe checkout if a paid plan was selected
    const res = await fetch("/api/stripe/create-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: selectedPlan }),
    });

    if (res.ok) {
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
        return;
      }
    }

    // Fallback: go to dashboard (e.g. if Stripe isn't configured yet)
    router.push("/dashboard");
    router.refresh();
  }

  function handleNext() {
    if (step === 4) {
      handleFinish();
    } else {
      setStep((s) => s + 1);
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500";
  const labelClass = "block text-sm font-medium text-zinc-700";

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-lg space-y-6 px-4">
        {/* Progress */}
        <div className="flex gap-2">
          {STEP_TITLES.map((title, i) => (
            <div key={title} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${
                  i <= step ? "bg-zinc-900" : "bg-zinc-200"
                }`}
              />
              <p
                className={`mt-1 text-xs ${
                  i === step ? "font-medium text-zinc-900" : "text-zinc-400"
                }`}
              >
                {title}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: Business basics */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Tell us about your business</h2>
            <div>
              <label htmlFor="name" className={labelClass}>
                Business name
              </label>
              <input
                id="name"
                type="text"
                value={data.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="e.g. Peak Fitness Gym"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="type" className={labelClass}>
                Business type
              </label>
              <select
                id="type"
                value={data.type}
                onChange={(e) => update({ type: e.target.value })}
                className={inputClass}
              >
                <option value="">Select a type...</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="city" className={labelClass}>
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={data.location_city}
                  onChange={(e) => update({ location_city: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="state" className={labelClass}>
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={data.location_state}
                  onChange={(e) => update({ location_state: e.target.value })}
                  maxLength={2}
                  placeholder="CA"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="zip" className={labelClass}>
                  ZIP
                </label>
                <input
                  id="zip"
                  type="text"
                  value={data.location_zip}
                  onChange={(e) => update({ location_zip: e.target.value })}
                  maxLength={5}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Target audience */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Who are your ideal customers?</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="age-min" className={labelClass}>
                  Min age
                </label>
                <input
                  id="age-min"
                  type="number"
                  min={13}
                  max={99}
                  value={data.target_age_min}
                  onChange={(e) =>
                    update({ target_age_min: parseInt(e.target.value) || 18 })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="age-max" className={labelClass}>
                  Max age
                </label>
                <input
                  id="age-max"
                  type="number"
                  min={13}
                  max={99}
                  value={data.target_age_max}
                  onChange={(e) =>
                    update({ target_age_max: parseInt(e.target.value) || 65 })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="radius" className={labelClass}>
                Target radius (miles)
              </label>
              <input
                id="radius"
                type="number"
                min={1}
                max={100}
                value={data.target_radius_miles}
                onChange={(e) =>
                  update({
                    target_radius_miles: parseInt(e.target.value) || 10,
                  })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Interests (select at least one)</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      data.target_interests.includes(interest)
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Primary offer */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">What&apos;s your lead magnet?</h2>
            <p className="text-sm text-zinc-500">
              This is the offer that will attract leads from your ads.
            </p>
            <div>
              <label htmlFor="offer" className={labelClass}>
                Primary offer
              </label>
              <input
                id="offer"
                type="text"
                value={data.primary_offer}
                onChange={(e) => update({ primary_offer: e.target.value })}
                placeholder="e.g. Free 7-day trial membership"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Outreach tone</label>
              <div className="mt-2 flex gap-3">
                {(["friendly", "professional", "casual"] as const).map(
                  (tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => update({ outreach_tone: tone })}
                      className={`rounded-md border px-4 py-2 text-sm capitalize ${
                        data.outreach_tone === tone
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
                      }`}
                    >
                      {tone}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Connect Meta */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Connect your Meta ad account</h2>
            <p className="text-sm text-zinc-500">
              Link your Facebook/Instagram ad account so Captivly can create
              campaigns and receive leads automatically.
            </p>
            <a
              href="/api/meta/auth"
              className="inline-flex w-full items-center justify-center rounded-md bg-[#1877F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#166FE5]"
            >
              Connect with Facebook
            </a>
            <p className="text-center text-xs text-zinc-400">
              You can skip this and connect later from Settings.
            </p>
          </div>
        )}

        {/* Step 5: Choose plan */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Choose your plan</h2>
            <p className="text-sm text-zinc-500">
              Select a plan to get started. You can change it anytime.
            </p>
            <div className="space-y-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.tier}
                  type="button"
                  onClick={() => setSelectedPlan(plan.tier)}
                  className={`w-full rounded-md border px-4 py-3 text-left ${
                    selectedPlan === plan.tier
                      ? "border-zinc-900 ring-1 ring-zinc-900"
                      : "border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{plan.name}</span>
                    <span className="text-sm font-medium text-zinc-600">
                      {plan.price}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{plan.features}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className={`rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 ${
              step === 0 ? "invisible" : ""
            }`}
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance() || loading}
            className="rounded-md bg-zinc-900 px-6 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : step === 4
                ? "Finish setup"
                : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
