import {
  emailLayout,
  emailHeading,
  emailSubheading,
  emailParagraph,
  emailCta,
  emailHighlightBox,
  emailIconList,
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

  const subject = "You're in — welcome to Pitchr";

  const body = [
    emailHeading("You're on the list."),
    emailSubheading('Early access is opening in small waves — you will be first to know.'),
    emailParagraph(
      'Pitchr is an AI pitch coach that scores your pitch out of 100, gives you ranked fixes, and rewrites your script. We built it because practicing pitches alone is a guessing game — and investors notice.',
    ),
    emailHighlightBox(
      emailIconList([
        { icon: '&#128232;', text: '<strong>Weekly updates</strong> — what shipped, what is next' },
        { icon: '&#127919;', text: '<strong>Priority invite</strong> — waitlist gets access first' },
        { icon: '&#9889;', text: '<strong>One-click out</strong> — unsubscribe any time' },
      ]),
    ),
    emailParagraph(
      'Want to shape the product? Hit <strong>reply</strong> and tell us your biggest pitch challenge in one sentence. We read every response.',
    ),
    emailSignoff(),
    emailUnsubscribeFooter(unsubscribeUrl),
  ].join('\n');

  const html = emailLayout({
    preheader: 'Early access is opening soon. Here is what happens next.',
    body,
  });

  const textParts = [
    "You're in — welcome to Pitchr",
    '',
    'Early access is opening in small waves — you will be first to know.',
    '',
    'Pitchr is an AI pitch coach that scores your pitch out of 100, gives you ranked fixes, and rewrites your script.',
    '',
    'What happens next:',
    '- Weekly updates on what shipped and what is next',
    '- Priority invite — waitlist gets access first',
    '- One-click out — unsubscribe any time',
    '',
    'Want to shape the product? Hit reply and tell us your biggest pitch challenge in one sentence. We read every response.',
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
