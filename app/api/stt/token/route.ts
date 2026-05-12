import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthenticationError } from '@/lib/supabase/auth-helpers';

const ASSEMBLYAI_TOKEN_URL = 'https://streaming.assemblyai.com/v3/token';
const TOKEN_EXPIRES_IN_SECONDS = 480;

export async function GET() {
  try {
    await getAuthenticatedUser();
  } catch (e) {
    if (e instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ error: 'ASSEMBLYAI_API_KEY not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(
      `${ASSEMBLYAI_TOKEN_URL}?expires_in_seconds=${TOKEN_EXPIRES_IN_SECONDS}`,
      {
        method: 'GET',
        headers: { Authorization: apiKey },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `AssemblyAI token request failed: ${response.status} ${text.slice(0, 200)}` },
        { status: 500 },
      );
    }

    const data = (await response.json()) as { token?: string };
    if (!data.token) {
      return NextResponse.json({ error: 'No token in AssemblyAI response' }, { status: 500 });
    }

    return NextResponse.json({
      token: data.token,
      expiresInSeconds: TOKEN_EXPIRES_IN_SECONDS,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Token request failed' },
      { status: 500 },
    );
  }
}
