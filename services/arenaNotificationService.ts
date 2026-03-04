import type { SupabaseClient } from '@supabase/supabase-js';
import type { Challenge } from '@/types/arena';
import type { LeagueTier } from '@/config/arena';

/* ——————————————————————————————————————————————————————————
 * Arena Notification Service
 *
 * Email notifications for arena events: challenge drops,
 * league promotions/demotions, and streak-at-risk warnings.
 * Uses the Resend API via fetch (same pattern as emailService).
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

  // Fetch all Pro users' emails
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

  for (const email of proEmails) {
    await sendEmail({
      to: email,
      subject,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin: 0 0 12px;">New Weekly Challenge</h2>
          <p style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">${challenge.title}</p>
          ${challenge.description ? `<p style="margin: 0 0 16px; color: #6b7280;">${challenge.description}</p>` : ''}
          <a href="${challengeUrl}" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #ff5941, #e63b26); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
            Compete Now
          </a>
        </div>
      `,
      text: `New Weekly Challenge: ${challenge.title}\n\n${challenge.description ?? ''}\n\nCompete: ${challengeUrl}`,
    });
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
  const resultMessages = {
    promoted: { subject: `Promoted to ${tierLabel} League!`, emoji: '', message: `Congratulations! You have been promoted to ${tierLabel} League.` },
    demoted: { subject: `League update: ${tierLabel}`, emoji: '', message: `You have moved to ${tierLabel} League. Keep pitching to climb back up!` },
    stayed: { subject: `Week complete — ${tierLabel} League`, emoji: '', message: `You held your ground in ${tierLabel} League. New week, new chance to climb!` },
  };

  const { subject, message } = resultMessages[result];

  await sendEmail({
    to: email,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 12px;">${subject}</h2>
        <p style="margin: 0 0 16px;">${message}</p>
        <a href="${appUrl}/arena" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #ff5941, #e63b26); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          View Arena
        </a>
      </div>
    `,
    text: `${subject}\n\n${message}\n\nView Arena: ${appUrl}/arena`,
  });
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

  const subject = `Your ${currentStreak}-day streak is at risk!`;

  await sendEmail({
    to: email,
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #111827;">
        <h2 style="margin: 0 0 12px;">Don't lose your streak!</h2>
        <p style="margin: 0 0 8px;">
          You have a <strong>${currentStreak}-day streak</strong> going. Complete a pitch today to keep it alive.
        </p>
        <p style="margin: 0 0 16px; color: #6b7280; font-size: 14px;">
          ${currentStreak >= 7 ? 'You are on an incredible run — don\'t let it slip!' : 'Every day counts. Keep the momentum going!'}
        </p>
        <a href="${appUrl}/arena/game-mode" style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #ff5941, #e63b26); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Quick Practice
        </a>
      </div>
    `,
    text: `Your ${currentStreak}-day streak is at risk!\n\nComplete a pitch today to keep it alive.\n\nQuick Practice: ${appUrl}/arena/game-mode`,
  });
}
