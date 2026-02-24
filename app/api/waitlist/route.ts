import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_FIELD_LENGTH = 512;

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
    };

    // --- Insert (Supabase client uses parameterized queries — safe from SQL injection) ---
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { error } = await supabase.from('waitlist').insert(row);

    if (error) {
      // Unique constraint violation = already on waitlist
      if (error.code === '23505') {
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

    return NextResponse.json(
      { message: 'You\'re on the list! We\'ll be in touch soon.' },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
