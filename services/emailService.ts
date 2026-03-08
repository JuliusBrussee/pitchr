import {
  emailLayout,
  emailHeading,
  emailSubheading,
  emailParagraph,
  emailList,
  emailSignoff,
  emailUnsubscribeFooter,
} from '@/lib/emailTemplate';

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

  const subject = "You're on the list — Pitchr";

  const body = [
    emailHeading("You're on the list"),
    emailSubheading('We are opening early access in small waves. Waitlist members get in first.'),
    emailParagraph(
      'Pitchr scores your pitch out of 100, ranks your weakest points, and rewrites your script. We built it because rehearsing alone is a guessing game — and investors notice.',
    ),
    emailParagraph('<strong>What happens next</strong>'),
    emailList([
      'Short weekly updates on what shipped and what is coming',
      'Your invite link arrives by email when your cohort opens',
      'One-click unsubscribe at any time',
    ]),
    emailParagraph(
      'Want to shape the product? Reply to this email with your biggest pitch challenge in one sentence. We read every response.',
    ),
    emailSignoff(),
    emailUnsubscribeFooter(unsubscribeUrl),
  ].join('\n');

  const html = emailLayout({
    preheader: 'Early access is opening soon. Here is what happens next.',
    body,
  });

  const textParts = [
    "You're on the list",
    '',
    'We are opening early access in small waves. Waitlist members get in first.',
    '',
    'Pitchr scores your pitch out of 100, ranks your weakest points, and rewrites your script.',
    '',
    'What happens next:',
    '- Short weekly updates on what shipped and what is coming',
    '- Your invite link arrives by email when your cohort opens',
    '- One-click unsubscribe at any time',
    '',
    'Want to shape the product? Reply with your biggest pitch challenge in one sentence. We read every response.',
    '',
    '— Team Pitchr',
  ];

  if (unsubscribeUrl) {
    textParts.push('', `Unsubscribe: ${unsubscribeUrl}`);
  }

  const text = textParts.join('\n');

  return sendEmail({
    to: params.email,
    subject,
    html,
    text,
  });
}
