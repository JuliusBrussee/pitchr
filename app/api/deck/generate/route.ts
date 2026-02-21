import { NextRequest, NextResponse } from 'next/server';
import { generateDeck } from '@/services/deckGenerationService';
import type { GenerateDeckRequest, TemplateId } from '@/types/deckGeneration';

export const runtime = 'nodejs';

const VALID_TEMPLATES = new Set<TemplateId>([
  'minimal-dark',
  'corporate-clean',
  'bold-gradient',
  'startup-fresh',
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<GenerateDeckRequest>;

    // Validate companyName
    if (!body.companyName || typeof body.companyName !== 'string') {
      return NextResponse.json(
        { error: 'companyName is required' },
        { status: 400 },
      );
    }
    if (body.companyName.length > 100) {
      return NextResponse.json(
        { error: 'companyName must be 100 characters or less' },
        { status: 400 },
      );
    }

    // Validate description
    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 },
      );
    }
    if (body.description.length < 10) {
      return NextResponse.json(
        { error: 'description must be at least 10 characters' },
        { status: 400 },
      );
    }
    if (body.description.length > 5000) {
      return NextResponse.json(
        { error: 'description must be 5000 characters or less' },
        { status: 400 },
      );
    }

    // Validate templateId
    if (!body.templateId || !VALID_TEMPLATES.has(body.templateId as TemplateId)) {
      return NextResponse.json(
        { error: 'templateId must be one of: minimal-dark, corporate-clean, bold-gradient, startup-fresh' },
        { status: 400 },
      );
    }

    const deck = await generateDeck({
      companyName: body.companyName.trim(),
      description: body.description.trim(),
      templateId: body.templateId as TemplateId,
    });

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
