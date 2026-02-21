import { describe, expect, it } from 'vitest';
import { getChecklistDefinitions, createInitialChecklistState } from '@/config/realtimeChecklist';
import { buildRealtimeChecklistPrompt } from '@/lib/prompts/realtimeChecklist';

describe('buildRealtimeChecklistPrompt', () => {
  it('injects mode, checklist ids, and transcript in prompt body', () => {
    const checklist = getChecklistDefinitions('vc_pitch');
    const previousItems = createInitialChecklistState('vc_pitch');
    const transcript = 'We are building a product and sharing traction metrics for investors.';

    const prompt = buildRealtimeChecklistPrompt({
      mode: 'vc_pitch',
      transcript,
      checklist,
      previousItems,
    });

    expect(prompt).toContain('Pitch mode: vc_pitch');
    expect(prompt).toContain('id: intro_hook');
    expect(prompt).toContain('id: ask');
    expect(prompt).toContain(transcript);
    expect(prompt).toContain('"items"');
    expect(prompt).toContain('"next_hint"');
  });
});
