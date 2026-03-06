// Edge Function: miro-fix-board-markdown
// Replaces: app/api/miro/fix-board/markdown/route.ts
// Methods: POST (generate markdown fallback)

import { handleCors } from '../_shared/cors.ts';
import { getAuthenticatedUser, AuthenticationError } from '../_shared/supabase.ts';
import { jsonResponse, errorResponse } from '../_shared/response.ts';
import { checkRateLimit, RateLimitExceededError } from '../_shared/rate-limit.ts';
import { assertComplianceForEndpoint } from '../_shared/compliance-service.ts';
import type { MiroFixBoardRequest, MiroTopFixInput } from '../_shared/types.ts';

function isValidMarkdownPayload(body: unknown): body is MiroFixBoardRequest {
  if (!body || typeof body !== 'object') return false;
  const value = body as Record<string, unknown>;
  return (
    typeof value.runId === 'string' &&
    typeof value.mode === 'string' &&
    typeof value.oneLineVerdict === 'string' &&
    typeof value.rewriteScript === 'string' &&
    Array.isArray(value.topFixes)
  );
}

function toMarkdown(input: {
  runId: string;
  mode: string;
  oneLineVerdict: string;
  topFixes: MiroTopFixInput[];
  rewriteScript: string;
}) {
  const lines = [
    '# Pitchr Fix Board Export',
    '',
    `Run: ${input.runId}`,
    `Mode: ${input.mode}`,
    '',
    '## Verdict',
    input.oneLineVerdict,
    '',
    '## Top Fixes',
    ...input.topFixes.flatMap((fix) => [
      `### #${fix.rank} ${fix.category} (${fix.impact})`,
      `Issue: ${fix.issue}`,
      `Action: ${fix.fix}`,
      '',
    ]),
    '## Tightened Rewrite',
    input.rewriteScript,
  ];
  return lines.join('\n');
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    const { supabase, user } = await getAuthenticatedUser(req);
    const complianceResponse = await assertComplianceForEndpoint(supabase, req, user.id, 'miro-fix-board-markdown');
    if (complianceResponse) return complianceResponse;
    await checkRateLimit(user.id, 'miro-fix-board-markdown');
    const body: unknown = await req.json();
    if (!isValidMarkdownPayload(body)) {
      return errorResponse('Invalid request body for miro-fix-board-markdown', 400);
    }

    const markdown = toMarkdown({
      runId: body.runId,
      mode: body.mode,
      oneLineVerdict: body.oneLineVerdict,
      topFixes: body.topFixes,
      rewriteScript: body.rewriteScript,
    });

    return jsonResponse({
      markdown,
      filename: `pitchr-fix-board-${body.runId}.md`,
    }, 200);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      return errorResponse('Authentication required', 401);
    }
    if (error instanceof RateLimitExceededError) {
      return errorResponse(error.message, 429);
    }
    return errorResponse(
      error instanceof Error ? error.message : String(error),
      500,
    );
  }
});
