import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Competitor Ad Monitoring",
  description:
    "See what competing local businesses are running on Meta — their ad creative, copy, offers, and targeting. Updated daily.",
  openGraph: {
    title: "Competitor Ad Monitoring - Captivly.ai",
    description:
      "See competitor ad creative, copy, offers, and targeting from Meta Ad Library.",
    url: "https://captivly.ai/features/competitor-monitoring",
  },
};

export default function CompetitorMonitoringPage() {
  return (
    <FeatureLayout
      title="Competitor Ad Monitoring"
      description="See what competing local businesses are running on Meta — their ad creative, copy, offers, and targeting. Powered by Meta's Ad Library API, updated daily, with no extra tools needed."
      ctaHeading="Compete with confidence"
      ctaDescription="See every ad your competitors are running. Get AI insights on how to differentiate. Win more local customers."
    >
      {/* Why monitor */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Know what your competitors are doing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
            The gym down the street is running Facebook ads right now. Do you
            know what offer they&apos;re promoting? What their creative looks
            like? Whether they just launched a new campaign?
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-teal-600">100%</div>
              <p className="mt-2 text-sm text-slate-600">
                of active Meta ads are publicly visible through the Ad
                Library — Captivly.ai just makes them easy to find and analyze
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-teal-600">Daily</div>
              <p className="mt-2 text-sm text-slate-600">
                updates so you see new competitor ads within 24 hours of
                launch — stay ahead, not behind
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-green-600">Free</div>
              <p className="mt-2 text-sm text-slate-600">
                data from Meta&apos;s public Ad Library API — no additional
                subscriptions or spy tools needed
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you see */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            What you see for each competitor
          </h2>
          <p className="mt-4 text-sm text-slate-600">
            Add competitors by Facebook Page name or URL. Captivly.ai pulls
            their active ads and surfaces the details that matter.
          </p>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Ad creative & copy
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                See the actual images, videos, headlines, and body text
                your competitors are using. Spot trends in what&apos;s
                working in your market — are they using video or static?
                Lifestyle photos or bold text overlays?
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Offers & CTAs
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                See what offers competitors are promoting. Free trial?
                50% off first month? Free consultation? Understanding
                their offers helps you differentiate yours or match
                market expectations.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Active ad count & run dates
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                See how many ads each competitor is running and when they
                started. Long-running ads are likely performing well — short
                bursts may indicate testing. Use this to gauge their
                strategy.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Platform placement
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                See whether competitors are running on Facebook, Instagram,
                Messenger, or Audience Network. If everyone is on Instagram
                but nobody is on Facebook, there may be an untapped
                opportunity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Example competitor card */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Competitor insights at a glance
          </h2>
          <div className="mt-12 space-y-6">
            <div className="rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    PF
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      PowerFit Gym
                    </p>
                    <p className="text-xs text-slate-500">
                      0.8 miles away
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  7 active ads
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Main offer
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    &quot;Free 14-day trial&quot;
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Longest running ad
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    47 days (video ad)
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Platforms
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    Facebook, Instagram
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-md bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">
                  Latest ad copy
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  &quot;Ready to crush your fitness goals? Join PowerFit
                  and get a FREE 14-day trial. No contracts, no
                  commitment. Just results. Tap below to claim your
                  spot!&quot;
                </p>
              </div>
            </div>
            <div className="rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                    IF
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Iron & Flow Studio
                    </p>
                    <p className="text-xs text-slate-500">
                      1.2 miles away
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  3 active ads
                </span>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Main offer
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    &quot;50% off first month&quot;
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Longest running ad
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    12 days (carousel)
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    Platforms
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    Instagram only
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-md bg-slate-50 p-3">
                <p className="text-xs font-medium text-slate-500">
                  Latest ad copy
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  &quot;Strength meets mindfulness. Get 50% off your first
                  month at Iron & Flow — classes include weightlifting,
                  yoga, and HIIT. DM us or tap the link!&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI analysis */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            AI-powered competitive analysis
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-center text-sm text-slate-600">
            Captivly.ai doesn&apos;t just show competitor ads — AI analyzes
            them and gives you actionable recommendations.
          </p>
          <div className="mt-12 space-y-4">
            <div className="rounded-lg border bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100">
                  <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Offer differentiation
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    &quot;Both competitors are offering free trials (7 and
                    14 days). Your &apos;free 7-day trial&apos; offer
                    doesn&apos;t stand out. Consider a different angle: a
                    &apos;bring a friend free week&apos; or &apos;free
                    personal training session&apos; to differentiate.&quot;
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100">
                  <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Creative gaps
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    &quot;PowerFit&apos;s longest-running ad (47 days) is a
                    video — video ads tend to perform best for fitness.
                    You&apos;re currently running static images only.
                    Consider testing a 15-second gym tour video.&quot;
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border bg-white p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100">
                  <svg className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Platform opportunity
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    &quot;Iron & Flow is only advertising on Instagram.
                    Facebook still has strong reach for the 35–55 age group
                    in your area. You could capture that audience with zero
                    competition from this competitor.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to set up */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Set up in 2 minutes
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Add competitors",
                description:
                  "Search by business name, category, or paste a Facebook Page URL. Add up to 10 competitors to monitor.",
              },
              {
                step: "2",
                title: "Review daily",
                description:
                  "Captivly.ai checks the Ad Library API daily and surfaces new or changed ads in your competitor dashboard.",
              },
              {
                step: "3",
                title: "Act on insights",
                description:
                  "Use AI recommendations to adjust your offers, creative, and targeting based on what the market is doing.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-lg font-bold text-teal-600">
                  {item.step}
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            Monitoring features
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                New ad alerts
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Get notified when a competitor launches a new ad. See it
                in your dashboard or receive an email alert — so you can
                react quickly if they&apos;re running a competing offer.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Ad longevity tracking
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Ads that run for weeks are likely profitable. Captivly.ai
                tracks how long each competitor ad has been active —
                long-running ads are worth studying closely.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Market trend detection
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                When multiple competitors shift their offers or creative
                style around the same time, Captivly.ai flags the trend.
                Stay aware of seasonal patterns and market shifts.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Category-based discovery
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Don&apos;t know who your ad competitors are? Search by
                business category and location to discover who&apos;s
                advertising in your area — you might find competitors
                you didn&apos;t even know existed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
