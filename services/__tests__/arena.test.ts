import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { ScenarioRow, UserStatsRow } from '@/types/arena';
import {
  awardXp,
  calculateChallengeXp,
  calculateGameModeXp,
} from '@/services/xpService';
import { getApprovedScenarios, getRandomScenario } from '@/services/scenarioService';
import { calculateChallengeBonus } from '@/services/challengeBonusService';
import { getChallengeLeaderboard, submitChallenge } from '@/services/challengeService';
import { processWeekEnd } from '@/services/leagueService';
import { matchUsersIntoLeagues } from '@/services/matchmakingService';
import { updateStreak } from '@/models/userStats';
import { evaluateBadges } from '@/services/badgeService';
import * as xpService from '@/services/xpService';
import * as challengeBonusService from '@/services/challengeBonusService';
import * as userStatsModel from '@/models/userStats';

interface QueryResult {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  count?: number | null;
}

interface ChainConfig {
  selectAwaitResult?: QueryResult;
  insertAwaitResult?: QueryResult;
  updateAwaitResult?: QueryResult;
  singleResult?: QueryResult;
  maybeSingleResult?: QueryResult;
  onInsert?: (payload: unknown) => void;
  onUpdate?: (payload: unknown) => void;
}

function createChain(config: ChainConfig = {}) {
  let action: 'select' | 'insert' | 'update' | 'delete' = 'select';

  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => {
    action = 'select';
    return chain;
  });
  chain.insert = vi.fn((payload: unknown) => {
    action = 'insert';
    config.onInsert?.(payload);
    return chain;
  });
  chain.update = vi.fn((payload: unknown) => {
    action = 'update';
    config.onUpdate?.(payload);
    return chain;
  });
  chain.delete = vi.fn(() => {
    action = 'delete';
    return chain;
  });
  chain.eq = vi.fn(() => chain);
  chain.not = vi.fn(() => chain);
  chain.gt = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => {
    return config.maybeSingleResult ?? { data: null, error: null };
  });
  chain.single = vi.fn(async () => {
    return config.singleResult ?? { data: null, error: null };
  });

  // Support `await query` patterns in the services.
  (chain as { then: Promise<QueryResult>['then'] }).then = (onFulfilled, onRejected) => {
    const result =
      action === 'insert'
        ? (config.insertAwaitResult ?? { data: null, error: null })
        : action === 'update'
          ? (config.updateAwaitResult ?? { data: null, error: null })
          : (config.selectAwaitResult ?? { data: null, error: null });

    return Promise.resolve(result).then(onFulfilled, onRejected);
  };

  return chain;
}

function makeScenarioRow(overrides: Partial<ScenarioRow> = {}): ScenarioRow {
  return {
    id: 'scenario-1',
    title: 'AI sales coach',
    one_liner: 'Coaching for SaaS reps',
    industry: 'saas',
    stage: 'seed',
    difficulty: 'pro',
    brief: {
      companyName: 'Pitchr AI',
      oneLiner: 'A coaching platform',
      industry: 'saas',
      stage: 'seed',
      team: '2 founders',
      metrics: {
        revenue: '$120K ARR',
        users: '1200 users',
        growthRate: '20% MoM',
      },
      market: {
        tam: '$10B',
        sam: '$1B',
        som: '$100M',
      },
      ask: {
        amount: '$2M',
        useOfFunds: 'Hiring and GTM',
      },
      differentiator: 'Fast feedback loop',
      weakness: 'Early retention volatility',
    },
    pitch_type: 'vc_pitch',
    time_limit_sec: 120,
    read_time_sec: 60,
    challenge_eligible: true,
    source: 'seeded',
    status: 'approved',
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

function makeUserStatsRow(overrides: Partial<UserStatsRow> = {}): UserStatsRow {
  return {
    user_id: 'user-1',
    total_xp: 0,
    current_league_tier: 'bronze',
    current_streak: 1,
    longest_streak: 1,
    last_activity_date: '2026-03-03',
    streak_freezes_remaining: 1,
    streak_freeze_last_reset: null,
    challenges_completed: 0,
    challenge_wins: 0,
    game_mode_completed: 0,
    highest_score: 0,
    badges: [],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

function createUserStatsSupabase(initialRow: UserStatsRow | null) {
  let row = initialRow ? { ...initialRow } : null;
  let pendingMutation: 'insert' | 'update' | null = null;
  let payload: Record<string, unknown> = {};

  const supabase = {
    from: vi.fn((table: string) => {
      if (table !== 'user_stats') {
        throw new Error(`Unexpected table: ${table}`);
      }

      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => {
        return chain;
      });
      chain.eq = vi.fn(() => chain);
      chain.insert = vi.fn((insertPayload: Record<string, unknown>) => {
        pendingMutation = 'insert';
        payload = insertPayload;
        return chain;
      });
      chain.update = vi.fn((updatePayload: Record<string, unknown>) => {
        pendingMutation = 'update';
        payload = updatePayload;
        return chain;
      });
      chain.maybeSingle = vi.fn(async () => ({ data: row, error: null }));
      chain.single = vi.fn(async () => {
        if (pendingMutation === 'insert') {
          row = {
            ...(payload as unknown as UserStatsRow),
            created_at: (payload.created_at as string) ?? new Date().toISOString(),
            updated_at: (payload.updated_at as string) ?? new Date().toISOString(),
          };
          pendingMutation = null;
          return { data: row, error: null };
        }

        if (pendingMutation === 'update') {
          row = {
            ...(row as UserStatsRow),
            ...payload,
          };
          pendingMutation = null;
          return { data: row, error: null };
        }

        return { data: row, error: null };
      });
      (chain as { then: Promise<QueryResult>['then'] }).then = (onFulfilled, onRejected) => {
        return Promise.resolve({ data: row, error: null }).then(onFulfilled, onRejected);
      };

      return chain;
    }),
  };

  return {
    supabase,
    getRow: () => row,
  };
}

async function loadChallengeSubmitRoute(options: {
  planId: 'free' | 'pro' | 'day_pass';
  submissionCount?: number;
}) {
  vi.resetModules();

  const getAuthenticatedUser = vi.fn().mockResolvedValue({ user: { id: 'user-1' } });
  const submitChallengeMock = vi.fn().mockResolvedValue({
    id: 'submission-1',
    challengeId: 'challenge-1',
    userId: 'user-1',
    runId: 'run-1',
    bonusScore: 12,
    totalScore: 90,
    xpEarned: 70,
    submittedAt: '2026-03-04T12:00:00Z',
  });

  const subscriptionChain = createChain({
    singleResult: {
      data: {
        id: 'sub-1',
        user_id: 'user-1',
        plan_id: options.planId === 'pro' ? 'pro' : 'free',
        status: 'active',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        stripe_price_id: null,
        current_period_start: '2026-03-01T00:00:00Z',
        current_period_end: '2026-04-01T00:00:00Z',
        cancel_at_period_end: false,
        created_at: '2026-03-01T00:00:00Z',
        updated_at: '2026-03-01T00:00:00Z',
      },
      error: null,
    },
  });

  const dayPassChain = createChain({
    singleResult: {
      data: options.planId === 'day_pass'
        ? {
            id: 'pass-1',
            expires_at: '2026-03-05T00:00:00Z',
            runs_used: 0,
            runs_limit: 15,
            decks_used: 0,
            decks_limit: 5,
            qa_seconds_used: 0,
            qa_seconds_limit: 600,
            stripe_payment_intent_id: null,
            status: 'active',
            purchased_at: '2026-03-04T00:00:00Z',
          }
        : null,
      error: options.planId === 'day_pass' ? null : { code: 'PGRST116', message: 'No rows' },
    },
  });

  const submissionsChain = createChain({
    selectAwaitResult: {
      data: null,
      error: null,
      count: options.submissionCount ?? 0,
    },
  });

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'day_passes') return dayPassChain;
      if (table === 'subscriptions') return subscriptionChain;
      if (table === 'challenge_submissions') return submissionsChain;
      throw new Error(`Unexpected table in route test: ${table}`);
    }),
  };

  vi.doMock('@/lib/supabase/auth-helpers', () => ({
    getAuthenticatedUser,
  }));

  vi.doMock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn().mockReturnValue(supabase),
  }));

  vi.doMock('@/services/challengeService', () => ({
    submitChallenge: submitChallengeMock,
  }));

  const route = await import('@/app/api/arena/challenges/[id]/submit/route');

  return {
    route,
    submitChallengeMock,
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
  vi.doUnmock('@/lib/supabase/auth-helpers');
  vi.doUnmock('@/lib/supabase/admin');
  vi.doUnmock('@/services/challengeService');
});

describe('Arena Phase 4.3 E2E service coverage', () => {
  describe('XP service', () => {
    it('awards XP once and updates weekly league XP', async () => {
      const xpLookupChain = createChain({
        maybeSingleResult: { data: null, error: null },
      });
      const xpInsertChain = createChain({
        insertAwaitResult: { data: null, error: null },
      });
      const membershipLookupChain = createChain({
        maybeSingleResult: {
          data: { id: 'membership-1', weekly_xp: 10, league_id: 'league-1' },
          error: null,
        },
      });
      const membershipUpdateChain = createChain({
        updateAwaitResult: { data: null, error: null },
      });
      const leagueLookupChain = createChain({
        maybeSingleResult: {
          data: { id: 'league-1' },
          error: null,
        },
      });

      let xpEventsCalls = 0;
      let membershipCalls = 0;

      const supabase = {
        from: vi.fn((table: string) => {
          if (table === 'xp_events') {
            xpEventsCalls += 1;
            return xpEventsCalls === 1 ? xpLookupChain : xpInsertChain;
          }

          if (table === 'league_memberships') {
            membershipCalls += 1;
            return membershipCalls === 1 ? membershipLookupChain : membershipUpdateChain;
          }

          if (table === 'leagues') {
            return leagueLookupChain;
          }

          throw new Error(`Unexpected table: ${table}`);
        }),
        rpc: vi.fn().mockResolvedValue({ data: 120, error: null }),
      };

      const total = await awardXp(
        supabase as never,
        'user-1',
        'game_mode',
        20,
        'run-1',
        { score: 95 },
      );

      expect(total).toBe(120);
      expect(supabase.rpc).toHaveBeenCalledWith('increment_user_xp', {
        p_user_id: 'user-1',
        p_amount: 20,
      });
      expect((membershipUpdateChain.update as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith({
        weekly_xp: 30,
      });
    });

    it('prevents double-award via source_id idempotency', async () => {
      const xpLookupChain = createChain({
        maybeSingleResult: { data: { id: 'existing-event' }, error: null },
      });
      const userStatsChain = createChain({
        singleResult: { data: { total_xp: 88 }, error: null },
      });

      const supabase = {
        from: vi.fn((table: string) => {
          if (table === 'xp_events') return xpLookupChain;
          if (table === 'user_stats') return userStatsChain;
          throw new Error(`Unexpected table: ${table}`);
        }),
        rpc: vi.fn(),
      };

      const total = await awardXp(
        supabase as never,
        'user-1',
        'pitch_analysis',
        20,
        'run-1',
      );

      expect(total).toBe(88);
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('calculates game mode and challenge XP correctly', () => {
      expect(calculateGameModeXp(97, 'expert')).toBe(85);
      expect(calculateGameModeXp(86, 'pro')).toBe(55);
      expect(calculateChallengeXp(72, 8)).toBe(60);
    });
  });

  describe('Scenario service', () => {
    it('avoids repeats by excluding seen scenario IDs', async () => {
      const seenSessionsChain = createChain({
        selectAwaitResult: {
          data: [{ scenario_id: 'scenario-seen' }],
          error: null,
        },
      });

      const unseenScenarioRow = makeScenarioRow({ id: 'scenario-new' });
      const unseenScenariosChain = createChain({
        selectAwaitResult: {
          data: [unseenScenarioRow],
          error: null,
        },
      });

      const supabase = {
        from: vi.fn((table: string) => {
          if (table === 'game_mode_sessions') return seenSessionsChain;
          if (table === 'scenarios') return unseenScenariosChain;
          throw new Error(`Unexpected table: ${table}`);
        }),
      };

      vi.spyOn(Math, 'random').mockReturnValue(0);

      const scenario = await getRandomScenario(supabase as never, 'user-1', 'pro');

      expect(scenario.id).toBe('scenario-new');
      expect((unseenScenariosChain.not as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        'id',
        'in',
        '(scenario-seen)',
      );
    });

    it('applies difficulty filters to approved scenarios query', async () => {
      const scenarioRow = makeScenarioRow({ id: 'scenario-filtered' });
      const scenariosChain = createChain({
        selectAwaitResult: {
          data: [scenarioRow],
          error: null,
        },
      });

      const supabase = {
        from: vi.fn(() => scenariosChain),
      };

      const result = await getApprovedScenarios(supabase as never, {
        difficulty: 'pro',
        industry: 'saas',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('scenario-filtered');
      expect((scenariosChain.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('status', 'approved');
      expect((scenariosChain.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('difficulty', 'pro');
      expect((scenariosChain.eq as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('industry', 'saas');
    });
  });

  describe('Challenge service + bonus scoring', () => {
    it('submits a challenge, awards XP, and updates completion stats', async () => {
      const bonusSpy = vi.spyOn(challengeBonusService, 'calculateChallengeBonus').mockReturnValue({
        bonusScore: 12,
        breakdown: {
          addressedMetrics: { score: 4, max: 5, details: [] },
          withinTimeLimit: { score: 5, max: 5 },
          usedSpecificNumbers: { score: 2, max: 5, details: [] },
          clearAsk: { score: 1, max: 5 },
        },
      });
      const awardXpSpy = vi.spyOn(xpService, 'awardXp').mockResolvedValue(300);
      const updateStatsSpy = vi
        .spyOn(userStatsModel, 'updateUserStats')
        .mockResolvedValue({} as never);

      const challengeChain = createChain({
        singleResult: {
          data: {
            id: 'challenge-1',
            scenario_id: 'scenario-1',
            week_number: 10,
            year: 2026,
            title: 'Weekly VC showdown',
            description: null,
            challenge_type: 'vc_pitch',
            bonus_criteria: null,
            starts_at: '2026-03-01T00:00:00Z',
            ends_at: '2026-03-07T23:59:59Z',
            status: 'active',
            participant_count: 10,
            created_at: '2026-03-01T00:00:00Z',
            scenarios: makeScenarioRow(),
          },
          error: null,
        },
      });

      const runsChain = createChain({
        singleResult: {
          data: {
            overall_score: 78,
            transcript: 'We are at $120k arr with 20% MoM growth and raising $2M.',
            meta: { delivery_metrics: { duration_seconds: 90 } },
          },
          error: null,
        },
      });

      const insertSubmissionChain = createChain({
        singleResult: {
          data: {
            id: 'submission-1',
            challenge_id: 'challenge-1',
            user_id: 'user-1',
            run_id: 'run-1',
            base_score: 78,
            bonus_score: 12,
            total_score: 90,
            rank: null,
            xp_earned: 0,
            submitted_at: '2026-03-04T12:00:00Z',
          },
          error: null,
        },
      });

      const updateSubmissionChain = createChain({
        updateAwaitResult: { data: null, error: null },
      });

      const statsChain = createChain({
        singleResult: {
          data: { challenges_completed: 3 },
          error: null,
        },
      });

      let submissionCalls = 0;

      const supabase = {
        from: vi.fn((table: string) => {
          if (table === 'challenges') return challengeChain;
          if (table === 'runs') return runsChain;
          if (table === 'challenge_submissions') {
            submissionCalls += 1;
            return submissionCalls === 1 ? insertSubmissionChain : updateSubmissionChain;
          }
          if (table === 'user_stats') return statsChain;
          throw new Error(`Unexpected table: ${table}`);
        }),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      const result = await submitChallenge(
        supabase as never,
        'user-1',
        'challenge-1',
        'run-1',
      );

      expect(result.totalScore).toBe(90);
      expect(result.xpEarned).toBe(70);
      expect(bonusSpy).toHaveBeenCalled();
      expect(awardXpSpy).toHaveBeenCalledWith(
        supabase,
        'user-1',
        'challenge_submit',
        70,
        'submission-1',
        expect.objectContaining({ baseScore: 78, bonusScore: 12, totalScore: 90 }),
      );
      expect(updateStatsSpy).toHaveBeenCalledWith(
        supabase,
        'user-1',
        { challengesCompleted: 4 },
      );
    });

    it('enforces one submission per user/challenge via unique constraint', async () => {
      const awardXpSpy = vi.spyOn(xpService, 'awardXp').mockResolvedValue(300);

      const challengeChain = createChain({
        singleResult: {
          data: {
            id: 'challenge-1',
            scenario_id: 'scenario-1',
            week_number: 10,
            year: 2026,
            title: 'Weekly VC showdown',
            description: null,
            challenge_type: 'vc_pitch',
            bonus_criteria: null,
            starts_at: '2026-03-01T00:00:00Z',
            ends_at: '2026-03-07T23:59:59Z',
            status: 'active',
            participant_count: 10,
            created_at: '2026-03-01T00:00:00Z',
            scenarios: makeScenarioRow(),
          },
          error: null,
        },
      });

      const runsChain = createChain({
        singleResult: {
          data: {
            overall_score: 80,
            transcript: 'Pitch transcript',
            meta: { delivery_metrics: { duration_seconds: 100 } },
          },
          error: null,
        },
      });

      const duplicateSubmissionChain = createChain({
        singleResult: {
          data: null,
          error: { message: 'duplicate key value violates unique constraint' },
        },
      });

      const supabase = {
        from: vi.fn((table: string) => {
          if (table === 'challenges') return challengeChain;
          if (table === 'runs') return runsChain;
          if (table === 'challenge_submissions') return duplicateSubmissionChain;
          throw new Error(`Unexpected table: ${table}`);
        }),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      await expect(
        submitChallenge(supabase as never, 'user-1', 'challenge-1', 'run-1'),
      ).rejects.toThrow('Failed to submit challenge');

      expect(awardXpSpy).not.toHaveBeenCalled();
    });

    it('returns challenge leaderboard ordered by score', async () => {
      const leaderboardChain = createChain({
        selectAwaitResult: {
          data: [
            {
              id: 'submission-1',
              challenge_id: 'challenge-1',
              user_id: 'user-a',
              run_id: 'run-a',
              base_score: 90,
              bonus_score: 8,
              total_score: 98,
              rank: 1,
              xp_earned: 78,
              submitted_at: '2026-03-04T10:00:00Z',
            },
          ],
          error: null,
        },
      });

      const supabase = {
        from: vi.fn(() => leaderboardChain),
      };

      const rows = await getChallengeLeaderboard(supabase as never, 'challenge-1', 10);

      expect(rows).toHaveLength(1);
      expect(rows[0].totalScore).toBe(98);
      expect((leaderboardChain.order as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith('total_score', {
        ascending: false,
      });
    });

    it('computes bonus scoring with detailed 0-20 breakdown', () => {
      const scenario = {
        id: 'scenario-1',
        title: 'Health AI',
        oneLiner: 'AI assistant for clinics',
        industry: 'healthtech',
        stage: 'seed',
        difficulty: 'pro',
        brief: {
          companyName: 'ClinicFlow',
          oneLiner: 'AI assistant',
          industry: 'healthtech',
          stage: 'seed',
          team: '2 founders',
          metrics: { revenue: '$500K ARR', users: '1500 users', growthRate: '15% MoM' },
          market: { tam: '$8B', sam: '$800M', som: '$80M' },
          ask: { amount: '$3M', useOfFunds: 'sales and product' },
          differentiator: 'deep EHR integrations',
          weakness: 'small GTM team',
        },
        pitchType: 'vc_pitch',
        timeLimitSec: 120,
        readTimeSec: 60,
        challengeEligible: true,
        source: 'seeded',
        status: 'approved',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      } as const;

      const result = calculateChallengeBonus(
        'We are at 500k arr, serving 1500 users, growing 15% month over month, and raising 3m.',
        scenario,
        110,
        120,
      );

      expect(result.bonusScore).toBeGreaterThan(0);
      expect(result.bonusScore).toBeLessThanOrEqual(20);
      expect(result.breakdown.withinTimeLimit.score).toBe(5);
      expect(result.breakdown.usedSpecificNumbers.score).toBeGreaterThan(0);
    });
  });

  describe('League service + matchmaking', () => {
    it('processes week end with promotion/demotion updates', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-04T12:00:00Z'));

      const updateStatsSpy = vi
        .spyOn(userStatsModel, 'updateUserStats')
        .mockResolvedValue({} as never);

      const leaguesChain = createChain({
        selectAwaitResult: {
          data: [
            {
              id: 'league-1',
              tier: 'silver',
              week_number: 10,
              year: 2026,
              starts_at: '2026-03-02T00:00:00Z',
              ends_at: '2026-03-08T23:59:59Z',
              created_at: '2026-03-01T00:00:00Z',
            },
          ],
          error: null,
        },
      });

      const members = Array.from({ length: 12 }, (_, idx) => ({
        id: `member-${idx + 1}`,
        league_id: 'league-1',
        user_id: `user-${idx + 1}`,
        weekly_xp: 200 - idx,
        rank: null,
        promoted: false,
        demoted: false,
        created_at: '2026-03-01T00:00:00Z',
      }));

      const membershipsSelectChain = createChain({
        selectAwaitResult: {
          data: members,
          error: null,
        },
      });

      const membershipUpdateChain = createChain({
        updateAwaitResult: { data: null, error: null },
      });

      let membershipCalls = 0;

      const supabase = {
        from: vi.fn((table: string) => {
          if (table === 'leagues') return leaguesChain;
          if (table === 'league_memberships') {
            membershipCalls += 1;
            return membershipCalls === 1 ? membershipsSelectChain : membershipUpdateChain;
          }
          throw new Error(`Unexpected table: ${table}`);
        }),
      };

      await processWeekEnd(supabase as never);

      // 5 promoted + 5 demoted for a 12-user league.
      expect(updateStatsSpy).toHaveBeenCalledTimes(10);

      const calls = updateStatsSpy.mock.calls;
      expect(calls).toEqual(
        expect.arrayContaining([
          [supabase, 'user-1', { currentLeagueTier: 'gold' }],
          [supabase, 'user-12', { currentLeagueTier: 'bronze' }],
        ]),
      );
    });

    it('matchmaking creates valid tiered league groups', () => {
      const users = [
        ...Array.from({ length: 65 }, (_, i) => ({
          userId: `bronze-${i + 1}`,
          tier: 'bronze' as const,
          previousWeekXp: 100 - i,
        })),
        ...Array.from({ length: 12 }, (_, i) => ({
          userId: `silver-${i + 1}`,
          tier: 'silver' as const,
          previousWeekXp: 60 - i,
        })),
      ];

      const groups = matchUsersIntoLeagues(users, 30);

      expect(groups.length).toBeGreaterThan(0);
      expect(groups.every((g) => g.userIds.length >= 10)).toBe(true);
      expect(groups.every((g) => g.userIds.length <= 35)).toBe(true);

      // Tier ordering should follow bronze -> silver.
      const firstSilverIndex = groups.findIndex((g) => g.tier === 'silver');
      const hasBronzeAfterSilver = groups
        .slice(firstSilverIndex)
        .some((g) => g.tier === 'bronze');
      expect(hasBronzeAfterSilver).toBe(false);
    });
  });

  describe('Streak system', () => {
    it('increments streak on consecutive day and detects milestone', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-04T10:00:00Z'));

      const initial = makeUserStatsRow({
        current_streak: 2,
        longest_streak: 2,
        last_activity_date: '2026-03-03',
      });
      const { supabase } = createUserStatsSupabase(initial);

      const result = await updateStreak(supabase as never, 'user-1');

      expect(result).toEqual({
        currentStreak: 3,
        isNewMilestone: true,
        milestone: 3,
      });
    });

    it('uses streak freeze when a day is missed', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-04T10:00:00Z'));

      const initial = makeUserStatsRow({
        current_streak: 5,
        longest_streak: 5,
        last_activity_date: '2026-03-01',
        streak_freezes_remaining: 1,
      });
      const { supabase, getRow } = createUserStatsSupabase(initial);

      const result = await updateStreak(supabase as never, 'user-1');

      expect(result.currentStreak).toBe(5);
      expect(getRow()?.streak_freezes_remaining).toBe(0);
    });

    it('resets streak when no freeze remains after missed day', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-04T10:00:00Z'));

      const initial = makeUserStatsRow({
        current_streak: 9,
        longest_streak: 12,
        last_activity_date: '2026-03-01',
        streak_freezes_remaining: 0,
      });
      const { supabase, getRow } = createUserStatsSupabase(initial);

      const result = await updateStreak(supabase as never, 'user-1');

      expect(result.currentStreak).toBe(1);
      expect(getRow()?.longest_streak).toBe(12);
    });
  });

  describe('Badge system', () => {
    it('awards qualifying badges and remains idempotent', async () => {
      const getStatsSpy = vi.spyOn(userStatsModel, 'getOrCreateUserStats');
      const awardBadgeSpy = vi
        .spyOn(userStatsModel, 'awardBadge')
        .mockResolvedValue();

      getStatsSpy.mockResolvedValueOnce({
        userId: 'user-1',
        totalXp: 100,
        currentLeagueTier: 'bronze',
        currentStreak: 1,
        longestStreak: 1,
        streakFreezesRemaining: 0,
        challengesCompleted: 0,
        challengeWins: 0,
        gameModeCompleted: 0,
        highestScore: 100,
        badges: [],
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      });

      const supabase = {
        from: vi.fn(() =>
          createChain({
            selectAwaitResult: {
              data: [],
              error: null,
            },
          })),
      };

      const awarded = await evaluateBadges(supabase as never, 'user-1', {
        eventType: 'pitch_complete',
        latestScore: 100,
      });

      expect(awarded.map((b) => b.id).sort()).toEqual(['century_club', 'first_pitch']);
      expect(awardBadgeSpy).toHaveBeenCalledTimes(2);

      awardBadgeSpy.mockClear();
      getStatsSpy.mockResolvedValue({
        userId: 'user-1',
        totalXp: 100,
        currentLeagueTier: 'bronze',
        currentStreak: 1,
        longestStreak: 1,
        streakFreezesRemaining: 0,
        challengesCompleted: 0,
        challengeWins: 0,
        gameModeCompleted: 0,
        highestScore: 100,
        badges: [
          {
            id: 'first_pitch',
            name: 'First Pitch',
            description: 'Complete your first analysis',
            earnedAt: '2026-03-01T00:00:00Z',
            rarity: 'common',
          },
          {
            id: 'century_club',
            name: 'Century Club',
            description: 'Score 100 on any pitch',
            earnedAt: '2026-03-01T00:00:00Z',
            rarity: 'rare',
          },
        ],
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
      });

      const secondRun = await evaluateBadges(supabase as never, 'user-1', {
        eventType: 'pitch_complete',
        latestScore: 100,
      });

      expect(secondRun).toEqual([]);
      expect(awardBadgeSpy).not.toHaveBeenCalled();
    });
  });

  describe('Plan limits (challenge submission gate)', () => {
    it('blocks free users from challenge submissions', async () => {
      const { route, submitChallengeMock } = await loadChallengeSubmitRoute({ planId: 'free' });

      const request = new NextRequest('http://localhost/api/arena/challenges/challenge-1/submit', {
        method: 'POST',
        body: JSON.stringify({ runId: 'run-1' }),
      });

      const response = await route.POST(request, {
        params: Promise.resolve({ id: 'challenge-1' }),
      });
      const body = await response.json();

      expect(response.status).toBe(403);
      expect(body).toEqual(
        expect.objectContaining({
          upgrade: true,
          plan: 'free',
        }),
      );
      expect(submitChallengeMock).not.toHaveBeenCalled();
    });

    it('allows pro users to submit challenges', async () => {
      const { route, submitChallengeMock } = await loadChallengeSubmitRoute({ planId: 'pro' });

      const request = new NextRequest('http://localhost/api/arena/challenges/challenge-1/submit', {
        method: 'POST',
        body: JSON.stringify({ runId: 'run-1' }),
      });

      const response = await route.POST(request, {
        params: Promise.resolve({ id: 'challenge-1' }),
      });
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.id).toBe('submission-1');
      expect(submitChallengeMock).toHaveBeenCalledWith(
        expect.anything(),
        'user-1',
        'challenge-1',
        'run-1',
      );
    });
  });
});
