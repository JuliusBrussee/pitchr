import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWaitlistWelcomeEmail } from '@/services/emailService';

const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_FIELD_LENGTH = 512;

interface WaitlistInsertRow {
  id?: string;
  email: string;
  unsubscribe_token?: string | null;
  welcome_email_sent_at?: string | null;
  unsubscribed_at?: string | null;
}

interface PostgrestLikeError {
  code?: string;
  message?: string;
}

function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as PostgrestLikeError;
  return value.code === '42703' || value.message?.includes('does not exist') === true;
}

async function sendWelcomeEmailIfNeeded(row: WaitlistInsertRow, canPersistSendState: boolean) {
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

  if (!canPersistSendState || !row.id) {
    return;
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from('waitlist')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', row.id);

    if (error && !isMissingColumnError(error)) {
      console.error('[waitlist] Failed to persist welcome_email_sent_at:', error);
    }
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

    const baseRow = {
      email,
      referrer: truncate(body.referrer),
      utm_source: truncate(body.utm_source),
      utm_medium: truncate(body.utm_medium),
      utm_campaign: truncate(body.utm_campaign),
      landing_page: truncate(body.landing_page),
      user_agent: request.headers.get('user-agent')?.slice(0, MAX_FIELD_LENGTH) ?? null,
      ip_address: ip,
    };

    const newsletterRow = {
      ...baseRow,
      newsletter_opt_in: body?.newsletter_opt_in !== false,
    };

    const supabase = createAdminClient();
    let canPersistSendState = true;
    let { data, error } = await supabase
      .from('waitlist')
      .insert(newsletterRow)
      .select('id, email, unsubscribe_token, welcome_email_sent_at, unsubscribed_at')
      .single();

    // Backward compatibility: some environments still have legacy waitlist schema.
    if (error && isMissingColumnError(error)) {
      canPersistSendState = false;
      const legacyInsert = await supabase
        .from('waitlist')
        .insert(baseRow)
        .select('id, email')
        .single();
      data = legacyInsert.data as WaitlistInsertRow | null;
      error = legacyInsert.error;
    }

    if (error) {
      // Unique constraint violation = already on waitlist
      if (error.code === '23505') {
        let existingResult = await supabase
          .from('waitlist')
          .select('id, email, unsubscribe_token, welcome_email_sent_at, unsubscribed_at')
          .eq('email', email)
          .maybeSingle();

        if (existingResult.error && isMissingColumnError(existingResult.error)) {
          canPersistSendState = false;
          existingResult = await supabase
            .from('waitlist')
            .select('id, email')
            .eq('email', email)
            .maybeSingle();
        }

        if (existingResult.data) {
          const existingRow = existingResult.data as WaitlistInsertRow;
          if (existingRow.unsubscribed_at && body?.newsletter_opt_in !== false) {
            await supabase
              .from('waitlist')
              .update({
                newsletter_opt_in: true,
                unsubscribed_at: null,
              })
              .eq('id', existingRow.id);
          }
          await sendWelcomeEmailIfNeeded(existingRow, canPersistSendState);
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

    await sendWelcomeEmailIfNeeded(data as WaitlistInsertRow, canPersistSendState);

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
