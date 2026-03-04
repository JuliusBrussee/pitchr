import type { SupabaseClient } from '@supabase/supabase-js';
import type { Difficulty } from '@/config/arena';
import type { Scenario, ScenarioRow } from '@/types/arena';
import { mapScenarioRow } from '@/types/arena';

/* ——————————————————————————————————————————————————————————
 * Scenario Service
 *
 * CRUD + random selection for Arena game-mode scenarios.
 * —————————————————————————————————————————————————————————— */

export interface ScenarioFilters {
  industry?: string;
  difficulty?: Difficulty;
  stage?: string;
}

export type ScenarioInsert = Omit<Scenario, 'id' | 'createdAt' | 'updatedAt'>;

/* ——— List approved scenarios (with optional filters) ——— */

export async function getApprovedScenarios(
  supabase: SupabaseClient,
  filters?: ScenarioFilters,
): Promise<Scenario[]> {
  let query = supabase
    .from('scenarios')
    .select('*')
    .eq('status', 'approved');

  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }
  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }
  if (filters?.stage) {
    query = query.eq('stage', filters.stage);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[scenarios] Failed to list approved scenarios:', error.message);
    throw new Error(`Failed to list approved scenarios: ${error.message}`);
  }

  return (data as ScenarioRow[] ?? []).map(mapScenarioRow);
}

/* ——— Get a random unseen scenario for a user ——— */

export async function getRandomScenario(
  supabase: SupabaseClient,
  userId: string,
  difficulty: Difficulty,
): Promise<Scenario> {
  // 1. Get IDs of scenarios the user has already played
  const { data: seenRows, error: seenError } = await supabase
    .from('game_mode_sessions')
    .select('scenario_id')
    .eq('user_id', userId);

  if (seenError) {
    console.error('[scenarios] Failed to fetch seen scenarios:', seenError.message);
    throw new Error(`Failed to fetch seen scenarios: ${seenError.message}`);
  }

  const seenIds = (seenRows ?? []).map((r: { scenario_id: string }) => r.scenario_id);

  // 2. Query approved scenarios matching difficulty, excluding seen
  let query = supabase
    .from('scenarios')
    .select('*')
    .eq('status', 'approved')
    .eq('difficulty', difficulty);

  if (seenIds.length > 0) {
    query = query.not('id', 'in', `(${seenIds.join(',')})`);
  }

  const { data: unseenData, error: unseenError } = await query;

  if (unseenError) {
    console.error('[scenarios] Failed to query unseen scenarios:', unseenError.message);
    throw new Error(`Failed to query unseen scenarios: ${unseenError.message}`);
  }

  const unseenScenarios = (unseenData as ScenarioRow[]) ?? [];

  // 3. If unseen scenarios exist, pick one at random
  if (unseenScenarios.length > 0) {
    const randomIndex = Math.floor(Math.random() * unseenScenarios.length);
    return mapScenarioRow(unseenScenarios[randomIndex]);
  }

  // 4. All seen — allow repeats, prefer least-recently-seen
  //    Get the user's sessions ordered by oldest first, so we prefer
  //    scenarios they played longest ago.
  const { data: leastRecentRows, error: leastRecentError } = await supabase
    .from('game_mode_sessions')
    .select('scenario_id')
    .eq('user_id', userId)
    .order('completed_at', { ascending: true });

  if (leastRecentError) {
    console.error('[scenarios] Failed to fetch least-recent sessions:', leastRecentError.message);
    throw new Error(`Failed to fetch least-recent sessions: ${leastRecentError.message}`);
  }

  // Deduplicate: keep earliest occurrence (least recently seen)
  const orderedIds: string[] = [];
  const seen = new Set<string>();
  for (const row of (leastRecentRows ?? []) as { scenario_id: string }[]) {
    if (!seen.has(row.scenario_id)) {
      seen.add(row.scenario_id);
      orderedIds.push(row.scenario_id);
    }
  }

  // Try the least-recently-seen scenarios first (matching difficulty)
  for (const scenarioId of orderedIds) {
    const { data: candidate, error: candidateError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .eq('status', 'approved')
      .eq('difficulty', difficulty)
      .single();

    if (!candidateError && candidate) {
      return mapScenarioRow(candidate as ScenarioRow);
    }
  }

  // 5. No scenarios exist at all for this difficulty
  throw new Error(`No scenarios available for difficulty: ${difficulty}`);
}

/* ——— Get scenario by ID ——— */

export async function getScenarioById(
  supabase: SupabaseClient,
  id: string,
): Promise<Scenario | null> {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    // PGRST116 = row not found
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[scenarios] Failed to get scenario:', error.message);
    throw new Error(`Failed to get scenario: ${error.message}`);
  }

  return data ? mapScenarioRow(data as ScenarioRow) : null;
}

/* ——— Create a new scenario ——— */

export async function createScenario(
  supabase: SupabaseClient,
  data: ScenarioInsert,
): Promise<Scenario> {
  const insertPayload = {
    title: data.title,
    one_liner: data.oneLiner,
    industry: data.industry,
    stage: data.stage,
    difficulty: data.difficulty,
    brief: data.brief,
    pitch_type: data.pitchType,
    time_limit_sec: data.timeLimitSec,
    read_time_sec: data.readTimeSec,
    challenge_eligible: data.challengeEligible,
    source: data.source,
    status: data.status,
  };

  const { data: row, error } = await supabase
    .from('scenarios')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error || !row) {
    console.error('[scenarios] Failed to create scenario:', error?.message ?? 'unknown error');
    throw new Error(`Failed to create scenario: ${error?.message ?? 'unknown error'}`);
  }

  return mapScenarioRow(row as ScenarioRow);
}

/* ——— Approve a scenario ——— */

export async function approveScenario(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from('scenarios')
    .update({
      status: 'approved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[scenarios] Failed to approve scenario:', error.message);
    throw new Error(`Failed to approve scenario: ${error.message}`);
  }
}
