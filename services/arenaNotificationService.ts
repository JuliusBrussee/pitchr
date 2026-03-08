import type { SupabaseClient } from '@supabase/supabase-js';
import type { Challenge } from '@/types/arena';
import type { LeagueTier } from '@/config/arena';
import {
  emailLayout,
  emailHeading,
  emailSubheading,
  emailParagraph,
  emailCta,
  emailHighlightBox,
  emailDivider,
  emailMutedText,
} from '@/lib/emailTemplate';

/* ——————————————————————————————————————————————————————————
 * Arena Notification Service
 *
 * Email notifications for arena events: challenge drops,
 * league promotions/demotions, and streak-at-risk warnings.
 * Uses the Resend API via fetch.
 * —————————————————————————————————————————————————————————— */

const RESEND_API_URL = 'https://api.resend.com/emails';

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

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  const apiKey = getEnv('RESEND_API_KEY');
  const from = getEnv('RESEND_FROM_EMAIL');

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
      tags: [{ name: 'app', value: 'pitchr' }, { name: 'category', value: 'arena' }],
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const message = (data as { error?: { message?: string } }).error?.message ?? 'Failed to send email';
    console.error('[arena-notify] send failed:', message);
  }
}

/* ——— Challenge Drop Notification ——— */

export async function sendChallengeDropNotification(
  supabase: SupabaseClient,
  challenge: Challenge,
): Promise<void> {
  const appUrl = getAppBaseUrl();
  const challengeUrl = `${appUrl}/arena/challenge/${challenge.id}`;

  const { data: subscriptions } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('plan_id', 'pro')
    .eq('status', 'active');

  if (!subscriptions?.length) return;

  const userIds = subscriptions.map((s: { user_id: string }) => s.user_id);

  const { data: users } = await supabase
    .auth.admin.listUsers({ perPage: 1000 });

  const proEmails = (users?.users ?? [])
    .filter((u) => userIds.includes(u.id) && u.email)
    .map((u) => u.email!);

  const subject = `New Challenge: ${challenge.title}`;

  const body = [
    emailHeading('New weekly challenge'),
    emailSubheading('A fresh challenge just dropped in the Arena.'),
    emailHighlightBox(
      `<p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#111827;letter-spacing:-0.2px;">${challenge.title}</p>` +
      (challenge.description
        ? `<p style="margin:6px 0 0;font-size:14px;color:#6b7280;line-height:1.5;">${challenge.description}</p>`
        : ''),
    ),
    emailCta(challengeUrl, 'Compete Now'),
    emailMutedText('Challenges reset weekly. Submit your best pitch before the timer runs out.'),
  ].join('\n');

  const html = emailLayout({
    preheader: `New challenge: ${challenge.title} — compete now in the Pitchr Arena`,
    body,
  });

  const text = [
    `New Weekly Challenge: ${challenge.title}`,
    '',
    challenge.description ?? '',
    '',
    `Compete: ${challengeUrl}`,
  ].join('\n');

  for (const email of proEmails) {
    await sendEmail({ to: email, subject, html, text });
  }
}

/* ——— League Results Notification ——— */

export async function sendLeagueResultsNotification(
  supabase: SupabaseClient,
  userId: string,
  result: 'promoted' | 'demoted' | 'stayed',
  newTier: LeagueTier,
): Promise<void> {
  const appUrl = getAppBaseUrl();

  const { data: userData } = await supabase
    .auth.admin.getUserById(userId);

  const email = userData?.user?.email;
  if (!email) return;

  const tierLabel = newTier.charAt(0).toUpperCase() + newTier.slice(1);

  const config = {
    promoted: {
      subject: `Promoted to ${tierLabel} League`,
      heading: 'You got promoted!',
      message: `Your pitches earned you a spot in <strong>${tierLabel} League</strong>. The competition is tougher here — bring your A-game.`,
      icon: '&#128640;',
      ctaLabel: 'View Your League',
    },
    demoted: {
      subject: `League update: ${tierLabel}`,
      heading: 'New week, fresh start',
      message: `You have moved to <strong>${tierLabel} League</strong>. A few strong pitches and you will climb right back.`,
      icon: '&#128170;',
      ctaLabel: 'Start Climbing',
    },
    stayed: {
      subject: `Week complete — ${tierLabel} League`,
      heading: 'Holding steady',
      message: `You held your ground in <strong>${tierLabel} League</strong>. One strong week is all it takes to move up.`,
      icon: '&#9878;&#65039;',
      ctaLabel: 'Keep Going',
    },
  };

  const c = config[result];

  const body = [
    emailHeading(c.heading),
    emailSubheading(`${tierLabel} League`),
    emailHighlightBox(
      `<table role="presentation" cellpadding="0" cellspacing="0"><tr>` +
      `<td style="padding-right:14px;vertical-align:top;font-size:28px;line-height:1;">${c.icon}</td>` +
      `<td style="font-size:15px;color:#111827;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${c.message}</td>` +
      `</tr></table>`,
    ),
    emailCta(`${appUrl}/arena`, c.ctaLabel),
  ].join('\n');

  const html = emailLayout({
    preheader: c.message.replace(/<[^>]*>/g, ''),
    body,
  });

  const text = [
    c.subject,
    '',
    c.message.replace(/<[^>]*>/g, ''),
    '',
    `View Arena: ${appUrl}/arena`,
  ].join('\n');

  await sendEmail({ to: email, subject: c.subject, html, text });
}

/* ——— Streak At-Risk Notification ——— */

export async function sendStreakRiskNotification(
  supabase: SupabaseClient,
  userId: string,
  currentStreak: number,
): Promise<void> {
  const appUrl = getAppBaseUrl();

  const { data: userData } = await supabase
    .auth.admin.getUserById(userId);

  const email = userData?.user?.email;
  if (!email) return;

  const subject = `Your ${currentStreak}-day streak is at risk`;

  const encouragement = currentStreak >= 7
    ? 'You are on an incredible run — do not let it slip.'
    : 'Every day counts. Keep the momentum going.';

  const body = [
    emailHeading("Don't break the chain"),
    emailSubheading(`${currentStreak}-day streak at risk`),
    emailHighlightBox(
      `<table role="presentation" cellpadding="0" cellspacing="0"><tr>` +
      `<td style="padding-right:14px;vertical-align:top;font-size:28px;line-height:1;">&#128293;</td>` +
      `<td style="font-size:15px;color:#111827;line-height:1.5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">` +
      `You have a <strong>${currentStreak}-day streak</strong>. Complete one pitch today to keep it alive.` +
      `<br><span style="color:#6b7280;font-size:14px;">${encouragement}</span>` +
      `</td>` +
      `</tr></table>`,
    ),
    emailCta(`${appUrl}/arena/game-mode`, 'Quick Practice'),
    emailMutedText('One pitch is all it takes.'),
  ].join('\n');

  const html = emailLayout({
    preheader: `Your ${currentStreak}-day streak is about to expire — pitch now to keep it alive`,
    body,
  });

  const text = [
    subject,
    '',
    `You have a ${currentStreak}-day streak. Complete one pitch today to keep it alive.`,
    encouragement,
    '',
    `Quick Practice: ${appUrl}/arena/game-mode`,
  ].join('\n');

  await sendEmail({ to: email, subject, html, text });
}
