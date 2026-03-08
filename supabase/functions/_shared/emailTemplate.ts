/* ——————————————————————————————————————————————————————————
 * Shared Email Template System (Edge Function / Deno)
 *
 * Mirror of lib/emailTemplate.ts for Supabase Edge Functions.
 * Produces branded Pitchr email HTML with inline styles.
 * —————————————————————————————————————————————————————————— */

const BRAND = {
  coral: '#ff5941',
  coralDark: '#e63b26',
  amber: '#ffaa33',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  bgPage: '#f0f0f3',
  bgCard: '#ffffff',
  bgAccentSubtle: '#fff8f6',
  borderLight: 'rgba(0, 0, 0, 0.06)',
  fontStack:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
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
    `<span style="color:${BRAND.textMuted};font-size:12px;font-family:${BRAND.fontStack};">Pitchr &mdash; AI pitch coach</span>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style>
    * { box-sizing: border-box; }
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    @media only screen and (max-width: 520px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .email-card { border-radius: 12px !important; }
      .email-body { padding: 24px 20px !important; }
      .email-cta { padding: 14px 28px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.bgPage};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgPage};">
    <tr>
      <td align="center" style="padding:48px 16px;" class="email-container">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" class="email-card" style="background-color:${BRAND.bgCard};border-radius:20px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06);">
          <!-- Accent bar -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg, ${BRAND.coral}, ${BRAND.amber});font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Logo -->
          <tr>
            <td style="padding:32px 36px 0;text-align:center;">
              <div style="font-size:26px;font-weight:800;letter-spacing:-0.75px;color:${BRAND.textPrimary};font-family:${BRAND.fontStack};">pitchr</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 36px 36px;font-family:${BRAND.fontStack};color:${BRAND.textPrimary};line-height:1.65;font-size:15px;" class="email-body">
              ${options.body}
            </td>
          </tr>
          <!-- Footer divider + footer -->
          <tr>
            <td style="padding:0 36px;">
              <div style="height:1px;background:linear-gradient(90deg, transparent, ${BRAND.borderLight} 15%, ${BRAND.borderLight} 85%, transparent);"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 36px 24px;text-align:center;">
              ${footerHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailHighlightBox(content: string): string {
  return `<div style="margin:20px 0;padding:20px 24px;background:${BRAND.bgAccentSubtle};border-radius:14px;border-left:3px solid ${BRAND.coral};">
  ${content}
</div>`;
}

export function emailUnsubscribeFooter(unsubscribeUrl: string): string {
  return `<p style="margin:16px 0 0;font-size:12px;color:${BRAND.textMuted};text-align:center;line-height:1.5;">
  You signed up for Pitchr updates. <a href="${unsubscribeUrl}" style="color:${BRAND.textMuted};text-decoration:underline;">Unsubscribe</a>
</p>`;
}
