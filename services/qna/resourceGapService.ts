import { supabase } from '@/lib/supabase';

export interface ResourceGapRecord {
  id: number;
  run_id: string | null;
  qa_session_id: string | null;
  topic: string;
  query_text: string | null;
  reason: string | null;
  status: 'queued' | 'processing' | 'done' | 'failed';
  attempts: number;
  last_error: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export async function queueResourceGap(input: {
  runId?: string;
  qaSessionId?: string;
  topic: string;
  queryText?: string;
  reason?: string;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const payload = {
    run_id: input.runId ?? null,
    qa_session_id: input.qaSessionId ?? null,
    topic: input.topic,
    query_text: input.queryText ?? null,
    reason: input.reason ?? null,
    status: 'queued' as const,
    meta: input.meta ?? {},
  };

  const { error } = await supabase.from('qa_resource_gaps').insert(payload);
  if (error) {
    throw new Error(`Failed to queue knowledge gap: ${error.message}`);
  }
}

export async function listQueuedResourceGaps(limit = 5): Promise<ResourceGapRecord[]> {
  const { data, error } = await supabase
    .from('qa_resource_gaps')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to list queued resource gaps: ${error.message}`);
  }
  return (data ?? []) as ResourceGapRecord[];
}

export async function markResourceGapProcessing(id: number): Promise<void> {
  const { error } = await supabase
    .from('qa_resource_gaps')
    .update({
      status: 'processing',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) {
    throw new Error(`Failed to mark resource gap processing: ${error.message}`);
  }

  // PostgREST update above cannot atomically increment attempts without RPC.
  const { data, error: fetchError } = await supabase
    .from('qa_resource_gaps')
    .select('attempts')
    .eq('id', id)
    .single();
  if (fetchError || !data) return;
  const nextAttempts = (data.attempts ?? 0) + 1;
  await supabase
    .from('qa_resource_gaps')
    .update({ attempts: nextAttempts, updated_at: new Date().toISOString() })
    .eq('id', id);
}

export async function markResourceGapDone(id: number): Promise<void> {
  const { error } = await supabase
    .from('qa_resource_gaps')
    .update({
      status: 'done',
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) {
    throw new Error(`Failed to mark resource gap done: ${error.message}`);
  }
}

export async function markResourceGapFailed(id: number, message: string): Promise<void> {
  const { error } = await supabase
    .from('qa_resource_gaps')
    .update({
      status: 'failed',
      last_error: message,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) {
    throw new Error(`Failed to mark resource gap failed: ${error.message}`);
  }
}
