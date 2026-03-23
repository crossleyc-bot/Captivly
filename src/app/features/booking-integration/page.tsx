import type { Metadata } from "next";
import { FeatureLayout } from "@/components/feature-layout";

export const metadata: Metadata = {
  title: "Appointment & Booking Integration",
  description:
    "Connect Calendly, Acuity, or use our built-in scheduler so leads can book directly from your outreach messages.",
  openGraph: {
    title: "Appointment & Booking Integration - Captivly.ai",
    description:
      "Let leads book directly from your outreach messages with Calendly, Acuity, or built-in scheduling.",
    url: "https://captivly.ai/features/booking-integration",
  },
};

export default function BookingIntegrationPage() {
  return (
    <FeatureLayout
      title="Appointment & Booking Integration"
      description="Connect Calendly, Acuity, or use our built-in scheduler so leads can book directly from your outreach messages. Fewer steps means more conversions."
      ctaHeading="Let leads book themselves"
      ctaDescription="Remove friction from the conversion process. Connect your scheduler and start filling your calendar on autopilot."
    >
      {/* The problem */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            Every extra step loses leads
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-slate-600">
            A lead receives your email, they&apos;re interested — then what?
            If they have to call, visit a website, or fill out another form,
            many will drop off.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-red-500">67%</div>
              <p className="mt-2 text-sm text-slate-600">
                of leads drop off when booking requires more than 2 clicks
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">3x</div>
              <p className="mt-2 text-sm text-slate-600">
                higher conversion rate with inline booking links in outreach
                messages
              </p>
            </div>
            <div className="rounded-lg border p-6 text-center">
              <div className="text-3xl font-bold text-green-600">24/7</div>
              <p className="mt-2 text-sm text-slate-600">
                leads can self-book anytime without waiting for a callback
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="border-t bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-slate-900">
            Connect your scheduler
          </h2>
          <p className="mt-4 text-sm text-slate-600">
            Captivly.ai integrates with the tools you already use — or provides
            a built-in option if you don&apos;t have one.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Calendly
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Connect your Calendly account and Captivly.ai automatically
                inserts your booking link into outreach emails and SMS.
                When a lead books, the conversion is tracked automatically.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Acuity Scheduling
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Link your Acuity account for seamless appointment booking.
                Supports appointment types, availability windows, and
                automatic confirmation emails.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Built-in Scheduler
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Don&apos;t use a third-party tool? Captivly.ai includes a
                simple booking page where leads can pick a date and time
                from your availability. No extra subscriptions needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-4">
            {[
              {
                step: "1",
                title: "Connect",
                description:
                  "Link your Calendly, Acuity, or set up the built-in scheduler in Settings.",
              },
              {
                step: "2",
                title: "Generate",
                description:
                  "AI includes a booking link in your outreach sequences automatically.",
              },
              {
                step: "3",
                title: "Book",
                description:
                  "Leads click the link and pick a time — from email or SMS, one tap.",
              },
              {
                step: "4",
                title: "Convert",
                description:
                  "Booking confirmed. Lead status updates to \"converted\" in your dashboard.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">
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
            Booking features
          </h2>
          <div className="mt-8 space-y-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Smart link insertion
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                When AI generates your outreach sequences, it automatically
                includes your booking link with a clear call-to-action.
                &quot;Book your free consultation&quot; beats &quot;visit our
                website&quot; every time.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Automatic conversion tracking
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                When a lead books through your link, Captivly.ai receives a
                webhook and automatically marks them as converted. No manual
                status updates needed.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                Sequence pausing on booking
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Once a lead books, their outreach sequence stops
                automatically. No more &quot;Are you still interested?&quot;
                emails after someone already has an appointment.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-sm font-semibold text-slate-900">
                SMS-friendly booking
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Booking links work just as well in text messages. A lead
                taps the link in their SMS, picks a time, done. No app
                downloads or account creation required.
              </p>
            </div>
          </div>
        </div>
      </section>
    </FeatureLayout>
  );
}
