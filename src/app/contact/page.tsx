import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing-header";
import { MarketingFooter } from "@/components/marketing-footer";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Captivly.ai team. We're here to help.",
};

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />
      <main id="main-content" className="flex-1 px-6 py-20">
        <div className="mx-auto max-w-lg">
          <h1 className="text-3xl font-bold text-slate-900">Contact Us</h1>
          <p className="mt-2 text-sm text-slate-500">
            Have a question or need help? Fill out the form below and we&apos;ll
            get back to you as soon as possible.
          </p>

          <div className="mt-8">
            <ContactForm />
          </div>

          <div className="mt-10 rounded-lg border border-dashed border-slate-300 px-6 py-6 text-center">
            <p className="text-sm text-slate-500">
              Already a customer?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-700 hover:underline"
              >
                Log in
              </a>{" "}
              to submit a support ticket from your dashboard.
            </p>
          </div>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
