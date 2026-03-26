/**
 * Branded HTML email templates for Captivly.ai
 *
 * All templates use inline CSS for email client compatibility.
 * Brand colors: primary #2563eb, dark #0f172a, text #475569, light bg #f8fafc
 */

interface EmailLayoutOptions {
  businessName: string;
  content: string;
  unsubscribeUrl?: string;
  hideCaptivlyBranding?: boolean;
  primaryColor?: string;
}

interface SequenceEmailOptions {
  businessName: string;
  subject: string;
  body: string;
  leadFirstName?: string;
  unsubscribeUrl?: string;
  primaryColor?: string;
}

interface ReportCardEmailOptions {
  businessName: string;
  ownerName: string;
  month: string;
  summary: string;
  topInsight: string;
  recommendation: string;
  metrics: {
    totalLeads: number;
    avgScore: string;
    conversions: number;
    conversionRate: string;
    emailsSent: number;
    smsSent: number;
  };
  dashboardUrl: string;
}

interface WelcomeEmailOptions {
  ownerName: string;
  businessName: string;
  planName: string;
  dashboardUrl: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function plainTextToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br>");
}

/**
 * Wraps any content in the base Captivly email layout.
 */
export function emailLayout(options: EmailLayoutOptions): string {
  const {
    businessName,
    content,
    unsubscribeUrl,
    hideCaptivlyBranding = false,
    primaryColor = "#2563eb",
  } = options;

  const unsubscribeLink = unsubscribeUrl
    ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>`
    : "";

  const poweredBy = hideCaptivlyBranding
    ? ""
    : `<span style="color: #94a3b8;">Powered by <a href="https://captivly.ai" style="color: #94a3b8; text-decoration: underline;">Captivly.ai</a></span>`;

  const separator =
    unsubscribeLink && poweredBy
      ? ' <span style="color: #cbd5e1;">&middot;</span> '
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(businessName)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #e2e8f0;">
              <span style="font-size: 18px; font-weight: 700; color: ${escapeHtml(primaryColor)};">${escapeHtml(businessName)}</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; line-height: 18px;">
              ${unsubscribeLink}${separator}${poweredBy}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sequence outreach email sent to leads.
 * Designed to look like a real email from the business, not overly designed.
 */
export function sequenceEmail(options: SequenceEmailOptions): string {
  const {
    businessName,
    body,
    leadFirstName,
    unsubscribeUrl,
    primaryColor = "#2563eb",
  } = options;

  const greeting = leadFirstName
    ? `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #0f172a;">Hi ${escapeHtml(leadFirstName)},</p>`
    : "";

  const content = `
    ${greeting}
    <div style="font-size: 15px; line-height: 24px; color: #475569;">
      ${plainTextToHtml(body)}
    </div>
  `;

  return emailLayout({
    businessName,
    content,
    unsubscribeUrl,
    primaryColor,
  });
}

/**
 * Monthly report card email for Pro users.
 */
export function reportCardEmail(options: ReportCardEmailOptions): string {
  const {
    businessName,
    ownerName,
    month,
    summary,
    topInsight,
    recommendation,
    metrics,
    dashboardUrl,
  } = options;

  const metricRow = (label: string, value: string | number): string =>
    `<tr>
      <td style="padding: 8px 12px; font-size: 14px; color: #475569; border-bottom: 1px solid #f1f5f9;">${escapeHtml(label)}</td>
      <td style="padding: 8px 12px; font-size: 14px; font-weight: 600; color: #0f172a; text-align: right; border-bottom: 1px solid #f1f5f9;">${escapeHtml(String(value))}</td>
    </tr>`;

  const content = `
    <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 24px; color: #0f172a;">Hi ${escapeHtml(ownerName)},</p>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #475569;">Here's your monthly report card for <strong>${escapeHtml(businessName)}</strong> (${escapeHtml(month)}).</p>

    <!-- Summary -->
    <h2 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #0f172a;">Summary</h2>
    <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #475569;">${escapeHtml(summary)}</p>

    <!-- Top Insight -->
    <div style="margin: 0 0 24px 0; padding: 16px; background-color: #eff6ff; border-radius: 6px; border-left: 4px solid #2563eb;">
      <h3 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 0.5px;">Top Insight</h3>
      <p style="margin: 0; font-size: 14px; line-height: 22px; color: #475569;">${escapeHtml(topInsight)}</p>
    </div>

    <!-- Recommendation -->
    <div style="margin: 0 0 24px 0; padding: 16px; background-color: #fff7ed; border-radius: 6px; border-left: 4px solid #f97316;">
      <h3 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #f97316; text-transform: uppercase; letter-spacing: 0.5px;">Recommendation</h3>
      <p style="margin: 0; font-size: 14px; line-height: 22px; color: #475569;">${escapeHtml(recommendation)}</p>
    </div>

    <!-- Metrics Table -->
    <h2 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #0f172a;">Key Numbers</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
      ${metricRow("Total Leads", metrics.totalLeads)}
      ${metricRow("Avg. AI Score", metrics.avgScore)}
      ${metricRow("Conversions", metrics.conversions)}
      ${metricRow("Conversion Rate", metrics.conversionRate)}
      ${metricRow("Emails Sent", metrics.emailsSent)}
      ${metricRow("SMS Sent", metrics.smsSent)}
    </table>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">View Full Report</a>
        </td>
      </tr>
    </table>
  `;

  return emailLayout({ businessName, content });
}

/**
 * Welcome email sent after signup.
 */
export function welcomeEmail(options: WelcomeEmailOptions): string {
  const { ownerName, businessName, planName, dashboardUrl } = options;

  const content = `
    <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 24px; color: #0f172a;">Hi ${escapeHtml(ownerName)},</p>
    <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 24px; color: #475569;">Welcome to Captivly! Your account for <strong>${escapeHtml(businessName)}</strong> is all set up on the <strong>${escapeHtml(planName)}</strong> plan.</p>

    <p style="margin: 0 0 8px 0; font-size: 15px; line-height: 24px; color: #475569;">Here's what happens next:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
      <tr>
        <td style="padding: 4px 12px 4px 0; vertical-align: top; font-size: 14px; color: #2563eb; font-weight: 700;">1.</td>
        <td style="padding: 4px 0; font-size: 14px; line-height: 22px; color: #475569;">Connect your Meta ad account to start receiving leads</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0; vertical-align: top; font-size: 14px; color: #2563eb; font-weight: 700;">2.</td>
        <td style="padding: 4px 0; font-size: 14px; line-height: 22px; color: #475569;">Review the AI-generated campaign and outreach sequence</td>
      </tr>
      <tr>
        <td style="padding: 4px 12px 4px 0; vertical-align: top; font-size: 14px; color: #2563eb; font-weight: 700;">3.</td>
        <td style="padding: 4px 0; font-size: 14px; line-height: 22px; color: #475569;">Activate your campaign and let Captivly handle the rest</td>
      </tr>
    </table>

    <!-- CTA -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 16px 0;">
      <tr>
        <td align="center">
          <a href="${escapeHtml(dashboardUrl)}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">Go to Dashboard</a>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #475569;">If you have any questions, just reply to this email. We're here to help.</p>
  `;

  return emailLayout({ businessName: "Captivly.ai", content });
}
