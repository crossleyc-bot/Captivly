import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Captivly — Automated Lead Generation for Local Businesses",
  description:
    "Connect your Meta Lead Ads, score leads with AI, and fire personalized outreach sequences automatically.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
