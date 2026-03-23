import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Privacy Policy - Captivly",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/">
          <Logo size={24} />
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Get Started
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: March 23, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-600">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Introduction</h2>
            <p className="mt-3">
              Captivly.ai (&quot;Captivly&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the Captivly.ai platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Information We Collect</h2>
            <p className="mt-3">We collect information in the following ways:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <strong>Account Information:</strong> When you create an account, we collect your name, email address, and payment information via Stripe.
              </li>
              <li>
                <strong>Business Information:</strong> Business name, type, location, target audience details, and primary offer as provided during onboarding.
              </li>
              <li>
                <strong>Lead Data:</strong> Names, email addresses, phone numbers, and form responses collected through your Meta Lead Ads and Google Ads integrations.
              </li>
              <li>
                <strong>Usage Data:</strong> Information about how you interact with the platform, including pages visited, features used, and sequence performance.
              </li>
              <li>
                <strong>Third-Party Integrations:</strong> Access tokens and account identifiers for Meta, Google, Stripe, and other connected services.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. How We Use Your Information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Provide, maintain, and improve our lead generation and outreach services</li>
              <li>Process leads from your ad campaigns and score them using AI</li>
              <li>Send automated email and SMS outreach sequences on your behalf</li>
              <li>Process payments and manage your subscription</li>
              <li>Generate analytics, reports, and performance insights</li>
              <li>Communicate with you about your account, updates, and support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Third-Party Services</h2>
            <p className="mt-3">We use the following third-party services to operate Captivly:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong>Supabase:</strong> Database hosting and authentication</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Resend:</strong> Email delivery</li>
              <li><strong>Twilio:</strong> SMS delivery</li>
              <li><strong>Meta (Facebook/Instagram):</strong> Lead ad integrations</li>
              <li><strong>Google Ads:</strong> Lead ad integrations</li>
              <li><strong>Anthropic (Claude AI):</strong> Lead scoring and content generation</li>
              <li><strong>AWS:</strong> Application hosting</li>
            </ul>
            <p className="mt-3">
              Each third-party service has its own privacy policy governing their use of data. We recommend reviewing their policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Data Security</h2>
            <p className="mt-3">
              We implement appropriate technical and organizational security measures to protect your data, including encryption in transit and at rest, row-level security policies on our database, and secure authentication practices. However, no method of electronic transmission or storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">6. Data Retention</h2>
            <p className="mt-3">
              We retain your data for as long as your account is active or as needed to provide our services. When you delete your account, we will delete or anonymize your personal data within 30 days, except where we are required to retain it for legal or compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">7. Your Rights</h2>
            <p className="mt-3">Depending on your location, you may have the right to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Access, correct, or delete your personal data</li>
              <li>Object to or restrict processing of your data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at <a href="mailto:privacy@captivly.ai" className="font-medium text-teal-600 hover:text-teal-700">privacy@captivly.ai</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">8. Cookies</h2>
            <p className="mt-3">
              We use essential cookies for authentication and session management. We do not use advertising or third-party tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">9. Changes to This Policy</h2>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through a notice on the platform. Your continued use of Captivly after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">10. Contact Us</h2>
            <p className="mt-3">
              If you have questions about this Privacy Policy, contact us at{" "}
              <a href="mailto:privacy@captivly.ai" className="font-medium text-teal-600 hover:text-teal-700">privacy@captivly.ai</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t px-6 py-8 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} Captivly.ai. All rights reserved.
      </footer>
    </div>
  );
}
