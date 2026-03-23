import Link from "next/link";
import { Logo } from "@/components/logo";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <Logo size={20} />
            <p className="mt-3 text-sm text-slate-500">
              Automated lead generation for local businesses.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Product</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/#features" className="text-sm text-slate-500 hover:text-slate-700">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-slate-500 hover:text-slate-700">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="text-sm text-slate-500 hover:text-slate-700">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Resources</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/features/meta-lead-ads" className="text-sm text-slate-500 hover:text-slate-700">
                  Meta Lead Ads
                </Link>
              </li>
              <li>
                <Link href="/features/google-ads" className="text-sm text-slate-500 hover:text-slate-700">
                  Google Ads
                </Link>
              </li>
              <li>
                <Link href="/features/ai-lead-scoring" className="text-sm text-slate-500 hover:text-slate-700">
                  AI Lead Scoring
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Legal</h4>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/privacy" className="text-sm text-slate-500 hover:text-slate-700">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-700">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-sm text-slate-400">
          &copy; {new Date().getFullYear()} Captivly.ai. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
