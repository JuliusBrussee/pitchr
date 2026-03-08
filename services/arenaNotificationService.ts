import type { SupabaseClient } from '@supabase/supabase-js';
import type { Challenge } from '@/types/arena';
import type { LeagueTier } from '@/config/arena';
import {
  emailLayout,
  emailHeading,
  emailSubheading,
  emailParagraph,
  emailCta,
  emailCallout,
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
    throw new Error(`[arena-notify] send failed: ${message}`);
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

  const subject = `New challenge: ${challenge.title}`;

  const body = [
    emailHeading('New weekly challenge'),
    emailSubheading('A new challenge is live in the Arena.'),
    emailCallout(
      `<p style="margin:0 0 4px;font-size:17px;font-weight:400;color:#111827;letter-spacing:-0.01em;font-family:Georgia,'Times New Roman',Times,serif;">${challenge.title}</p>` +
      (challenge.description
        ? `<p style="margin:8px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">${challenge.description}</p>`
        : ''),
    ),
    emailCta(challengeUrl, 'Compete Now'),
    emailMutedText('Challenges reset weekly. Submit before the window closes.'),
  ].join('\n');

  const html = emailLayout({
    preheader: `New challenge: ${challenge.title}`,
    body,
  });

  const text = [
    `New weekly challenge: ${challenge.title}`,
    '',
    challenge.description ?? '',
    '',
    `Compete: ${challengeUrl}`,
  ].join('\n');

  let failCount = 0;
  for (const email of proEmails) {
    try {
      await sendEmail({ to: email, subject, html, text });
    } catch (err) {
      failCount++;
      console.error('[arena-notify] Failed to send challenge drop to:', email, err instanceof Error ? err.message : err);
    }
  }
  if (failCount > 0) {
    console.warn(`[arena-notify] ${failCount}/${proEmails.length} challenge drop emails failed`);
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
      heading: `${tierLabel} League`,
      message: `Your pitches earned you a promotion. The competition is tougher here.`,
    },
    demoted: {
      subject: `League update: ${tierLabel}`,
      heading: 'New week, new start',
      message: `You moved to ${tierLabel} League. A few strong pitches and you are back.`,
    },
    stayed: {
      subject: `Week complete — ${tierLabel} League`,
      heading: 'Holding steady',
      message: `You held your ground in ${tierLabel} League. One strong week to move up.`,
    },
  };

  const c = config[result];

  const body = [
    emailHeading(c.heading),
    emailSubheading(c.subject),
    emailParagraph(c.message),
    emailCta(`${appUrl}/arena`, 'View Arena'),
  ].join('\n');

  const html = emailLayout({
    preheader: c.message,
    body,
  });

  const text = [
    c.subject,
    '',
    c.message,
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

  const subject = `${currentStreak}-day streak at risk`;

  const body = [
    emailHeading(`${currentStreak}-day streak`),
    emailSubheading('Your streak expires today.'),
    emailParagraph(
      `Complete one pitch to keep it alive.${currentStreak >= 7 ? ' You are on a serious run — do not let it slip.' : ''}`,
    ),
    emailCta(`${appUrl}/arena/game-mode`, 'Quick Practice'),
  ].join('\n');

  const html = emailLayout({
    preheader: `Your ${currentStreak}-day streak expires today — one pitch to save it`,
    body,
  });

  const text = [
    subject,
    '',
    `Complete one pitch today to keep your ${currentStreak}-day streak alive.`,
    '',
    `Quick Practice: ${appUrl}/arena/game-mode`,
  ].join('\n');

  await sendEmail({ to: email, subject, html, text });
}
