import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({
      enabled: false,
      message: 'Speech recording is unavailable — ASSEMBLYAI_API_KEY is not configured.',
    });
  }

  return NextResponse.json({ enabled: true });
}
