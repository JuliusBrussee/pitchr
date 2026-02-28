import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWaitlistWelcomeEmail } from '@/services/emailService';

const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_FIELD_LENGTH = 512;

interface WaitlistInsertRow {
  id: string;
  email: string;
  unsubscribe_token: string;
  welcome_email_sent_at: string | null;
  unsubscribed_at?: string | null;
}

async function sendWelcomeEmailIfNeeded(row: WaitlistInsertRow) {
  if (row.welcome_email_sent_at) return;

  try {
    await sendWaitlistWelcomeEmail({
      email: row.email,
      unsubscribeToken: row.unsubscribe_token,
    });
  } catch (error) {
    console.error('[waitlist] Failed to send welcome email:', error);
    return;
  }

  try {
    const supabase = createAdminClient();
    await supabase
      .from('waitlist')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', row.id);
  } catch (error) {
    console.error('[waitlist] Failed to persist welcome_email_sent_at:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // --- Validate email ---
    const rawEmail = body?.email;
    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const email = rawEmail.toLowerCase().trim();

    if (email.length > MAX_EMAIL_LENGTH) {
      return NextResponse.json({ error: 'Email is too long' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // --- Collect analytics metadata ---
    const truncate = (val: unknown): string | null => {
      if (typeof val !== 'string' || !val.trim()) return null;
      return val.trim().slice(0, MAX_FIELD_LENGTH);
    };

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      null;

    const row = {
      email,
      referrer: truncate(body.referrer),
      utm_source: truncate(body.utm_source),
      utm_medium: truncate(body.utm_medium),
      utm_campaign: truncate(body.utm_campaign),
      landing_page: truncate(body.landing_page),
      user_agent: request.headers.get('user-agent')?.slice(0, MAX_FIELD_LENGTH) ?? null,
      ip_address: ip,
      newsletter_opt_in: body?.newsletter_opt_in !== false,
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('waitlist')
      .insert(row)
      .select('id, email, unsubscribe_token, welcome_email_sent_at, unsubscribed_at')
      .single();

    if (error) {
      // Unique constraint violation = already on waitlist
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('waitlist')
          .select('id, email, unsubscribe_token, welcome_email_sent_at, unsubscribed_at')
          .eq('email', email)
          .maybeSingle();

        if (existing) {
          const existingRow = existing as WaitlistInsertRow;
          if (existingRow.unsubscribed_at && body?.newsletter_opt_in !== false) {
            await supabase
              .from('waitlist')
              .update({
                newsletter_opt_in: true,
                unsubscribed_at: null,
              })
              .eq('id', existingRow.id);
          }
          await sendWelcomeEmailIfNeeded(existingRow);
        }

        return NextResponse.json(
          { message: 'You\'re already on the waitlist!' },
          { status: 200 },
        );
      }
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 },
      );
    }

    await sendWelcomeEmailIfNeeded(data as WaitlistInsertRow);

    return NextResponse.json(
      { message: 'You\'re on the list! Check your inbox for a confirmation email.' },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
