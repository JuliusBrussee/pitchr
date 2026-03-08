/* ——————————————————————————————————————————————————————————
 * Shared Email Template System
 *
 * Branded Pitchr email layout used by all Resend emails.
 * Dark glassmorphic design: near-black bg, glass-bordered cards,
 * gradient coral accents, layered shadows. Email-safe simulation
 * (no backdrop-filter). MSO fallbacks for Outlook.
 * —————————————————————————————————————————————————————————— */

const BRAND = {
  coral: '#ff5941',
  coralEnd: '#ffaa33',
  coralDark: '#e63b26',
  textPrimary: '#ededec',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  bgPage: '#0f0f11',
  bgCard: '#1a1a1f',
  bgCardBorder: 'rgba(255,255,255,0.08)',
  bgSubtle: 'rgba(255,255,255,0.04)',
  bgCallout: 'rgba(255,89,65,0.06)',
  border: 'rgba(255,255,255,0.08)',
  cardShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
  ctaGlow: '0 4px 16px rgba(255,89,65,0.3)',
  serifStack:
    "'Helvetica Neue', Helvetica, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  sansStack:
    "'Helvetica Neue', Helvetica, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  monoStack:
    "'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace",
} as const;

interface EmailLayoutOptions {
  preheader?: string;
  body: string;
  footer?: string;
}

export function emailLayout(options: EmailLayoutOptions): string {
  const preheaderHtml = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:transparent;mso-hide:all;">${options.preheader}${'&zwnj;&nbsp;'.repeat(40)}</div>`
    : '';

  const footerHtml =
    options.footer ??
    `<span style="color:${BRAND.textMuted};font-size:12px;font-family:${BRAND.sansStack};">pitchr &mdash; ai pitch coach</span>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    * { box-sizing: border-box; }
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    @media only screen and (max-width: 520px) {
      .email-container { width: 100% !important; padding: 20px !important; }
      .email-card { border-radius: 12px !important; }
      .email-body { padding: 28px 24px 32px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bgPage};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgPage};">
    <tr>
      <td align="center" style="padding:48px 16px;" class="email-container">
        <!--[if mso]><table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background-color:#1a1a1f;"><tr><td><![endif]-->
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" class="email-card" style="background-color:${BRAND.bgCard};border-radius:16px;overflow:hidden;box-shadow:${BRAND.cardShadow};border:1px solid ${BRAND.bgCardBorder};">
          <!-- Gradient accent bar -->
          <tr>
            <td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,${BRAND.coral},${BRAND.coralEnd});">
              <!--[if mso]><v:rect style="width:520px;height:3px;" stroked="false"><v:fill type="gradient" color="${BRAND.coral}" color2="${BRAND.coralEnd}" angle="90"/></v:rect><![endif]-->
            </td>
          </tr>
          <!-- Logo -->
          <tr>
            <td style="padding:36px 40px 0;text-align:center;">
              <div style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:${BRAND.textPrimary};font-family:${BRAND.sansStack};">Pitchr<span style="color:${BRAND.coral};">.</span></div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px 40px 40px;font-family:${BRAND.sansStack};color:#d1d1cf;line-height:1.65;font-size:14px;" class="email-body">
              ${options.body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:linear-gradient(90deg, transparent, ${BRAND.border} 20%, ${BRAND.border} 80%, transparent);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 24px;text-align:center;">
              ${footerHtml}
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailHeading(text: string): string {
  return `<h2 style="margin:0 0 12px;font-size:28px;font-weight:600;letter-spacing:-0.03em;color:#ffffff;line-height:1.2;font-family:${BRAND.sansStack};">${text}</h2>`;
}

export function emailSubheading(text: string): string {
  return `<p style="margin:0 0 28px;font-size:14px;color:${BRAND.textSecondary};line-height:1.6;">${text}</p>`;
}

export function emailParagraph(text: string): string {
  return `<p style="margin:0 0 18px;font-size:14px;color:#d1d1cf;line-height:1.65;">${text}</p>`;
}

export function emailCta(href: string, label: string): string {
  return `<div style="text-align:center;margin:32px 0 12px;">
  <a href="${href}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,${BRAND.coral},${BRAND.coralDark});color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;font-family:${BRAND.sansStack};box-shadow:${BRAND.ctaGlow};">
    ${label}
  </a>
</div>`;
}

export function emailDivider(): string {
  return `<div style="height:1px;margin:28px 0;background:linear-gradient(90deg, transparent, ${BRAND.border} 20%, ${BRAND.border} 80%, transparent);"></div>`;
}

export function emailCallout(content: string): string {
  return `<div style="margin:24px 0;padding:20px 24px;background:${BRAND.bgCallout};border-radius:12px;border:1px solid ${BRAND.bgCardBorder};">
  ${content}
</div>`;
}

export function emailList(items: string[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
  <td style="padding:0 10px 10px 0;vertical-align:top;color:${BRAND.coral};font-size:8px;line-height:22px;" width="14">&bull;</td>
  <td style="padding:0 0 10px;font-size:14px;color:#d1d1cf;line-height:1.6;font-family:${BRAND.sansStack};">${item}</td>
</tr>`,
    )
    .join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0 24px;">
  ${rows}
</table>`;
}

export function emailMutedText(text: string): string {
  return `<p style="margin:0;color:${BRAND.textMuted};font-size:13px;text-align:center;line-height:1.6;">${text}</p>`;
}

export function emailSignoff(): string {
  return `<p style="margin:0;font-size:15px;color:${BRAND.textSecondary};font-family:${BRAND.sansStack};">&mdash; Team Pitchr</p>`;
}

export function emailUnsubscribeFooter(unsubscribeUrl: string | null): string {
  if (!unsubscribeUrl) return '';
  return `<p style="margin:20px 0 0;font-size:12px;color:${BRAND.textMuted};text-align:center;line-height:1.6;">
  You signed up for Pitchr updates. <a href="${unsubscribeUrl}" style="color:${BRAND.textMuted};text-decoration:underline;">Unsubscribe</a>
</p>`;
}
