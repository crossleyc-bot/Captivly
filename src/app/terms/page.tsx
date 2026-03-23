import Link from "next/link";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";

export const metadata = {
  title: "Terms of Service",
  description:
    "Read the Terms of Service for Captivly.ai. Covers subscription plans, usage limits, acceptable use, AI-generated content, and more.",
  openGraph: {
    title: "Terms of Service - Captivly.ai",
    description:
      "Read the Terms of Service for Captivly.ai covering plans, usage limits, and acceptable use.",
    url: "https://captivly.ai/terms",
  },
};

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader showNav={false} />

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: March 23, 2026</p>

        <nav className="mt-4 flex gap-4 text-sm">
          <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700">
            Privacy Policy
          </Link>
          <span className="font-medium text-slate-900">Terms of Service</span>
        </nav>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-600">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">1. Agreement to Terms</h2>
            <p className="mt-3">
              By accessing or using Captivly.ai (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users, including business owners, team members, and any other authorized users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">2. Description of Service</h2>
            <p className="mt-3">
              Captivly is a lead generation and automated outreach platform for local businesses. The Service integrates with Meta Lead Ads and Google Ads to capture leads, uses AI to score and prioritize them, and sends automated email and SMS outreach sequences on your behalf.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">3. Account Registration</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>You must provide accurate and complete information when creating an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must be at least 18 years old to use the Service.</li>
              <li>One person or business may not maintain more than one account without prior written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">4. Subscription Plans and Billing</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>The Service is offered through monthly subscription plans: Starter ($49/mo), Growth ($99/mo), and Pro ($199/mo).</li>
              <li>All plans include a 14-day free trial. You will not be charged until the trial ends.</li>
              <li>Payments are processed securely via Stripe. By subscribing, you authorize recurring monthly charges.</li>
              <li>You may upgrade, downgrade, or cancel your plan at any time through the billing settings. Changes take effect at the next billing cycle.</li>
              <li>Refunds are not provided for partial months of service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">5. Usage Limits</h2>
            <p className="mt-3">
              Each plan includes specific limits for leads per month, SMS messages per month, campaigns, and sequence steps. Usage is tracked monthly and resets on the first of each month. If you exceed your plan limits, additional actions will be blocked until you upgrade or the next billing cycle begins.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">6. Acceptable Use</h2>
            <p className="mt-3">You agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Send spam, unsolicited messages, or messages that violate CAN-SPAM, TCPA, or other applicable laws</li>
              <li>Use the Service to collect or process data in violation of any privacy laws (GDPR, CCPA, etc.)</li>
              <li>Upload or transmit malicious content, viruses, or harmful code</li>
              <li>Attempt to gain unauthorized access to the Service or other users&apos; data</li>
              <li>Resell, sublicense, or redistribute the Service without authorization</li>
              <li>Use the AI features to generate misleading, fraudulent, or harmful content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">7. Third-Party Integrations</h2>
            <p className="mt-3">
              The Service integrates with third-party platforms including Meta, Google, Stripe, Resend, and Twilio. Your use of these integrations is also subject to their respective terms of service. Captivly is not responsible for the availability, accuracy, or policies of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">8. Lead Data and Communications</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>You are responsible for ensuring you have proper consent to contact leads captured through your ad campaigns.</li>
              <li>You are responsible for the content of messages sent through the Service, including AI-generated content you approve.</li>
              <li>You must comply with all applicable communication laws in your jurisdiction.</li>
              <li>Captivly provides tools for lead management but does not guarantee lead quality, response rates, or conversions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">9. AI-Generated Content</h2>
            <p className="mt-3">
              Captivly uses AI (powered by Anthropic&apos;s Claude) to score leads, generate outreach sequences, and create reports. AI-generated content is provided as suggestions. You are responsible for reviewing and approving all content before it is sent to your leads. Captivly does not guarantee the accuracy or effectiveness of AI-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">10. Intellectual Property</h2>
            <p className="mt-3">
              The Service, including its design, code, features, and branding, is owned by Captivly. You retain ownership of your business data and lead data. By using the Service, you grant Captivly a limited license to process your data solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">11. Limitation of Liability</h2>
            <p className="mt-3">
              To the maximum extent permitted by law, Captivly shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service. Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">12. Termination</h2>
            <p className="mt-3">
              We may suspend or terminate your access to the Service at any time for violation of these terms, with or without notice. Upon termination, your right to use the Service ceases immediately. You may export your data within 30 days of termination by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">13. Changes to Terms</h2>
            <p className="mt-3">
              We reserve the right to modify these terms at any time. We will notify you of material changes via email or a notice on the platform. Continued use of the Service after changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">14. Governing Law</h2>
            <p className="mt-3">
              These terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">15. Contact</h2>
            <p className="mt-3">
              For questions about these Terms of Service, contact us at{" "}
              <a href="mailto:legal@captivly.ai" className="font-medium text-blue-600 hover:text-blue-700">legal@captivly.ai</a>.
            </p>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
