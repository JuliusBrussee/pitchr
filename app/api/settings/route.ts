import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/services/settingsService';

export async function GET(): Promise<NextResponse> {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get settings' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const updated = await updateSettings(body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 },
    );
  }
}
