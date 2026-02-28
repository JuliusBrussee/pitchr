const RESEND_API_URL = 'https://api.resend.com/emails';

interface ResendSendResponse {
  id?: string;
  error?: {
    message?: string;
  };
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailSendResult {
  provider: 'resend';
  messageId: string | null;
}

export interface WaitlistWelcomeEmailParams {
  email: string;
  unsubscribeToken?: string | null;
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAppBaseUrl(): string {
  const value =
    process.env.APP_BASE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';
  return value.replace(/\/$/, '');
}

async function sendEmail(params: SendEmailParams): Promise<EmailSendResult> {
  const apiKey = getEnv('RESEND_API_KEY');
  const from = getEnv('RESEND_FROM_EMAIL');
  const replyTo = process.env.RESEND_REPLY_TO;

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
      reply_to: replyTo,
      tags: [{ name: 'app', value: 'pitchr' }],
    }),
  });

  let data: ResendSendResponse = {};
  try {
    data = (await response.json()) as ResendSendResponse;
  } catch {
    data = {};
  }

  if (!response.ok) {
    const message = data.error?.message ?? 'Failed to send email';
    throw new Error(message);
  }

  return {
    provider: 'resend',
    messageId: data.id ?? null,
  };
}

export async function sendWaitlistWelcomeEmail(
  params: WaitlistWelcomeEmailParams,
): Promise<EmailSendResult> {
  const appBaseUrl = getAppBaseUrl();
  const unsubscribeUrl = params.unsubscribeToken
    ? `${appBaseUrl}/api/newsletter/unsubscribe?token=${params.unsubscribeToken}`
    : null;

  const subject = 'You are on the Pitchr waitlist';
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin: 0 0 12px;">Thanks for joining Pitchr</h2>
      <p style="margin: 0 0 12px;">
        You are officially on the waitlist. We will email you first when early access opens.
      </p>
      <p style="margin: 0 0 12px;">
        You will also get a weekly product update with progress on features, releases, and launch timing.
      </p>
      ${unsubscribeUrl
        ? `<p style="margin: 24px 0 0; font-size: 12px; color: #6b7280;">
            Don&apos;t want updates? <a href="${unsubscribeUrl}" style="color: #6b7280;">Unsubscribe</a>
          </p>`
        : ''}
    </div>
  `;

  const textParts = [
    'Thanks for joining Pitchr.',
    'You are officially on the waitlist.',
    'We will email you first when early access opens.',
    'You will also get a weekly product update with development progress.',
  ];

  if (unsubscribeUrl) {
    textParts.push(`Unsubscribe: ${unsubscribeUrl}`);
  }

  const text = textParts.join('\n\n');

  return sendEmail({
    to: params.email,
    subject,
    html,
    text,
  });
}
