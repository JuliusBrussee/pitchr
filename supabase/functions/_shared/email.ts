const RESEND_API_URL = 'https://api.resend.com/emails';

interface SendResendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface ResendResponse {
  id?: string;
  error?: {
    message?: string;
  };
}

export async function sendResendEmail(
  params: SendResendEmailParams,
): Promise<{ id: string | null }> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('RESEND_FROM_EMAIL');
  const replyTo = Deno.env.get('RESEND_REPLY_TO');

  if (!apiKey || !from) {
    throw new Error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL');
  }

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
      reply_to: replyTo ?? undefined,
      tags: [{ name: 'app', value: 'pitchr' }],
    }),
  });

  let payload: ResendResponse = {};
  try {
    payload = (await response.json()) as ResendResponse;
  } catch {
    payload = {};
  }
  if (!response.ok) {
    throw new Error(payload.error?.message ?? 'Failed to send email');
  }

  return { id: payload.id ?? null };
}
