import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://captivly.ai";

  const featurePages = [
    "ai-lead-scoring",
    "automated-outreach",
    "best-time-to-send",
    "booking-integration",
    "competitor-monitoring",
    "compliance",
    "dashboard",
    "data-export",
    "email-deliverability",
    "google-ads",
    "google-reviews",
    "instagram-dm",
    "lead-assignment",
    "lead-source-comparison",
    "live-chat",
    "meta-lead-ads",
    "pricing",
    "re-engagement",
    "revenue-attribution",
    "team-accounts",
    "two-way-sms",
    "webhook-api",
    "whatsapp-outreach",
    "white-label",
  ];

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    ...featurePages.map((slug) => ({
      url: `${baseUrl}/features/${slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: slug === "pricing" ? 0.7 : 0.6,
    })),
  ];
}
