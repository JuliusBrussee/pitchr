// POST /api/deck/generate — AI pitch deck generation
//
// This is the primary deck generation endpoint. Uses the Next.js route
// (not the edge function) because react-pdf rendering requires Node.js.
// The edge function at supabase/functions/deck-generate/ exists but is
// not used by the frontend.
//
// Billing: costs 2 credits (CREDIT_COSTS.deckGeneration). Credits are
// checked before generation and deducted only on success. Day pass users
// use day-pass deck quota instead of credits.

import { NextResponse } from 'next/server';
import { getAuthenticatedUser, AuthenticationError } from '@/lib/supabase/auth-helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkUsageLimit, recordUsage } from '@/services/billingService';
import { CREDIT_COSTS } from '@/config/billing';
import { generateDeck } from '@/services/deckGenerationService';
import type { TemplateId } from '@/types/deckGeneration';

const VALID_TEMPLATES = new Set<TemplateId>([
  'minimal-dark',
  'corporate-clean',
  'bold-gradient',
  'startup-fresh',
]);

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser();

    // Check credit/usage limit before doing any work
    const admin = createAdminClient();
    const usageCheck = await checkUsageLimit(admin, user.id, 'deck_generation');
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: `Deck generation requires ${CREDIT_COSTS.deckGeneration} credits. You have ${usageCheck.remaining ?? 0} available.`,
        },
        { status: 402 },
      );
    }

    const body = await request.json();
    const { companyName, description, templateId, projectId } = body;

    if (!companyName || typeof companyName !== 'string') {
      return NextResponse.json({ error: 'companyName is required' }, { status: 400 });
    }
    if (companyName.length > 100) {
      return NextResponse.json({ error: 'companyName must be 100 characters or less' }, { status: 400 });
    }
    if (!description || typeof description !== 'string') {
      return NextResponse.json({ error: 'description is required' }, { status: 400 });
    }
    if (description.length < 10) {
      return NextResponse.json({ error: 'description must be at least 10 characters' }, { status: 400 });
    }
    if (description.length > 5000) {
      return NextResponse.json({ error: 'description must be 5000 characters or less' }, { status: 400 });
    }
    if (!templateId || !VALID_TEMPLATES.has(templateId)) {
      return NextResponse.json(
        { error: 'templateId must be one of: minimal-dark, corporate-clean, bold-gradient, startup-fresh' },
        { status: 400 },
      );
    }

    const deck = await generateDeck(supabase, user.id, {
      companyName: companyName.trim(),
      description: description.trim(),
      templateId,
      projectId: typeof projectId === 'string' ? projectId : undefined,
    });

    // Record usage / deduct credits after successful generation
    await recordUsage(admin, user.id, 'deck_generation');

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.error('[deck/generate] error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 },
    );
  }
}
