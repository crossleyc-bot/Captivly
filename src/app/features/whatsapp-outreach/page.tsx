import Link from "next/link";
import { Logo } from "@/components/logo";

export default function WhatsAppOutreachPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/">
          <Logo size={24} />
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-indigo-50 via-white to-white px-6 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="mb-4 inline-block rounded-full bg-indigo-100 px-4 py-1.5 text-xs font-semibold text-indigo-700">
              Channels & Reach
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              WhatsApp Outreach
            </h1>
            <p className="mt-6 text-lg text-zinc-600">
              Reach leads on the messaging app they use most. WhatsApp boasts
              98% open rates — making it the highest-engagement channel for
              lead follow-up, especially in international markets.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link
                href="/signup"
                className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
              >
                Start Free Trial
              </Link>
              <Link
                href="/#features"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                All Features
              </Link>
            </div>
          </div>
        </section>

        {/* Why WhatsApp */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              The world&apos;s most popular messaging app
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-[#25D366]">2B+</div>
                <p className="mt-2 text-sm text-zinc-600">
                  monthly active users worldwide. WhatsApp is the default
                  messaging app in most countries.
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-[#25D366]">98%</div>
                <p className="mt-2 text-sm text-zinc-600">
                  open rate for WhatsApp messages vs 20% for email and 45%
                  for SMS. Your message actually gets read.
                </p>
              </div>
              <div className="rounded-lg border p-6 text-center">
                <div className="text-3xl font-bold text-[#25D366]">45%</div>
                <p className="mt-2 text-sm text-zinc-600">
                  response rate on WhatsApp outreach — 3x higher than email
                  and 2x higher than SMS.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Channel comparison */}
        <section className="border-t bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              Channel comparison
            </h2>
            <div className="mt-12 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-zinc-500">
                    <th className="pb-3 pr-4">Metric</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">SMS</th>
                    <th className="pb-3 pr-4 text-[#25D366]">WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      metric: "Open rate",
                      email: "20%",
                      sms: "45%",
                      whatsapp: "98%",
                    },
                    {
                      metric: "Response rate",
                      email: "6%",
                      sms: "15%",
                      whatsapp: "45%",
                    },
                    {
                      metric: "Rich media",
                      email: "Yes",
                      sms: "No",
                      whatsapp: "Yes",
                    },
                    {
                      metric: "International",
                      email: "Yes",
                      sms: "Expensive",
                      whatsapp: "Free*",
                    },
                    {
                      metric: "Conversation feel",
                      email: "Formal",
                      sms: "Brief",
                      whatsapp: "Natural",
                    },
                  ].map((row) => (
                    <tr key={row.metric} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium text-zinc-900">
                        {row.metric}
                      </td>
                      <td className="py-3 pr-4 text-zinc-600">{row.email}</td>
                      <td className="py-3 pr-4 text-zinc-600">{row.sms}</td>
                      <td className="py-3 pr-4 font-medium text-[#25D366]">
                        {row.whatsapp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-xs text-zinc-400">
                * WhatsApp Business API charges per conversation, not per
                message. Significantly cheaper than international SMS.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              How it works
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-4">
              {[
                {
                  step: "1",
                  title: "Connect WhatsApp",
                  description:
                    "Link your WhatsApp Business account via the Meta Business API. Same OAuth flow you already know.",
                },
                {
                  step: "2",
                  title: "Add to sequences",
                  description:
                    "Include WhatsApp as a channel in your outreach sequences alongside email and SMS.",
                },
                {
                  step: "3",
                  title: "AI sends messages",
                  description:
                    "Personalized WhatsApp messages fire on schedule. Rich media supported — send images, buttons, and links.",
                },
                {
                  step: "4",
                  title: "Two-way chat",
                  description:
                    "When leads reply, see it in your dashboard. Continue the conversation or let AI handle it.",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/10 text-lg font-bold text-[#25D366]">
                    {item.step}
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-zinc-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-zinc-50 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-zinc-900">
              WhatsApp features
            </h2>
            <div className="mt-8 space-y-6">
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Template messages
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  WhatsApp Business API requires pre-approved message
                  templates for outbound messages. Captivly generates and
                  submits templates for approval automatically — you just
                  review and confirm.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Rich media support
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Send images, PDFs, and interactive buttons in your WhatsApp
                  messages. Attach a menu, a booking link button, or a
                  promotional image — far more engaging than plain text SMS.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  International reach
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Reach leads in countries where SMS is unreliable or
                  expensive. WhatsApp works over internet, so international
                  outreach costs a fraction of traditional SMS.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Conversation window
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Once a lead replies, you get a 24-hour free-form messaging
                  window. Captivly maximizes this window for natural
                  back-and-forth conversation without template restrictions.
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Unified inbox
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  WhatsApp messages appear in the same lead timeline as email,
                  SMS, and Instagram DMs. One conversation view across all
                  channels — no app switching.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="border-t bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-zinc-900">
              Perfect for
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  International businesses
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  If you serve customers in Latin America, Europe, Asia, or
                  Africa, WhatsApp is likely their primary messaging app.
                  Meet them where they already are.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  High-touch services
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Salons, spas, and personal trainers benefit from the
                  conversational feel of WhatsApp. It feels personal, not
                  promotional — which builds trust faster.
                </p>
              </div>
              <div className="rounded-lg border p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Multi-channel strategies
                </h3>
                <p className="mt-2 text-sm text-zinc-600">
                  Add WhatsApp as a third channel in your sequences. Email
                  → WhatsApp → SMS gives leads three chances to engage
                  on their preferred platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-zinc-50 px-6 py-20 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-zinc-900">
              Reach leads on their favorite app
            </h2>
            <p className="mt-4 text-zinc-600">
              98% open rates. 45% response rates. WhatsApp outreach is the
              highest-engagement channel available — and Captivly makes it
              automatic.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-block rounded-full bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-200 hover:bg-indigo-700"
            >
              Get Started Free
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-zinc-500">
        &copy; {new Date().getFullYear()} Captivly. All rights reserved.
      </footer>
    </div>
  );
}
