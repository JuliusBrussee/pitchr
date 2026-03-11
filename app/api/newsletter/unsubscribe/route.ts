import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  checkPublicWriteRateLimit,
  getClientIpFallback,
  getRateLimitResetHeaders,
} from '@/lib/rateLimit';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

type UnsubscribeResult = 'unsubscribed' | 'already_unsubscribed' | 'not_found';
type UnsubscribeTokenStatus = 'active' | 'already_unsubscribed' | 'not_found';

interface WaitlistUnsubscribeRow {
  id: string;
  unsubscribed_at: string | null;
}

function getToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const token = value.trim();
  if (!UUID_REGEX.test(token)) return null;
  return token;
}

async function unsubscribeByToken(token: string): Promise<UnsubscribeResult> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('waitlist')
    .update({
      newsletter_opt_in: false,
      unsubscribed_at: nowIso,
    })
    .eq('unsubscribe_token', token)
    .is('unsubscribed_at', null)
    .select('id')
    .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (updated) {
    return 'unsubscribed';
  }

  const { data: existing, error: existingError } = await supabase
    .from('waitlist')
    .select('id, unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing) {
    return 'not_found';
  }

  const existingRow = existing as WaitlistUnsubscribeRow;
  return existingRow.unsubscribed_at ? 'already_unsubscribed' : 'not_found';
}

async function getUnsubscribeTokenStatus(token: string): Promise<UnsubscribeTokenStatus> {
  const supabase = createAdminClient();
  const { data: existing, error } = await supabase
    .from('waitlist')
    .select('id, unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!existing) {
    return 'not_found';
  }

  const existingRow = existing as WaitlistUnsubscribeRow;
  return existingRow.unsubscribed_at ? 'already_unsubscribed' : 'active';
}

async function checkUnsubscribeRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIpFallback(request);
  const rateLimit = await checkPublicWriteRateLimit(
    `newsletter-unsubscribe:ip:${ip ?? "unknown"}`,
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again shortly.' },
      {
        status: 429,
        headers: getRateLimitResetHeaders(rateLimit),
      },
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await checkUnsubscribeRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const token = getToken(body?.token);

    if (!token) {
      return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 400 });
    }

    const result = await unsubscribeByToken(token);

    if (result === 'not_found') {
      return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 404 });
    }

    if (result === 'already_unsubscribed') {
      return NextResponse.json({ message: 'You are already unsubscribed.' }, { status: 200 });
    }

    return NextResponse.json({ message: 'You have been unsubscribed.' }, { status: 200 });
  } catch (error) {
    console.error('[newsletter/unsubscribe] error:', error);
    return NextResponse.json(
      { error: 'Unable to process unsubscribe request.' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const rateLimitResponse = await checkUnsubscribeRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const token = getToken(request.nextUrl.searchParams.get('token'));
  if (!token) {
    return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 400 });
  }

  try {
    const status = await getUnsubscribeTokenStatus(token);

    if (status === 'not_found') {
      return NextResponse.json({ error: 'Invalid unsubscribe token' }, { status: 404 });
    }

    if (status === 'already_unsubscribed') {
      return NextResponse.json(
        {
          message: 'You are already unsubscribed.',
          canUnsubscribe: false,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        message: 'Please confirm unsubscribe to stop future waitlist emails.',
        canUnsubscribe: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[newsletter/unsubscribe] error:', error);
    return NextResponse.json(
      { error: 'Unable to process unsubscribe request.' },
      { status: 500 },
    );
  }
}
