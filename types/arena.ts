/* ——— Arena Types ——— */

import type {
  BadgeRarity,
  ChallengeType,
  Difficulty,
  LeagueTier,
} from '@/config/arena';

/* ——————————————————————————————————————————————————————————
 * Scenario
 * —————————————————————————————————————————————————————————— */

export interface ScenarioMetrics {
  revenue?: string;
  users?: string;
  growthRate?: string;
  foundedYear?: number;
  other?: Record<string, string>;
}

export interface ScenarioMarket {
  tam: string;
  sam?: string;
  som?: string;
}

export interface ScenarioAsk {
  amount: string;
  useOfFunds: string;
}

export interface ScenarioBrief {
  companyName: string;
  oneLiner: string;
  industry: string;
  stage: string;
  team: string;
  metrics: ScenarioMetrics;
  market: ScenarioMarket;
  ask: ScenarioAsk;
  differentiator: string;
  weakness: string;
}

export interface Scenario {
  id: string;
  title: string;
  oneLiner: string;
  industry: string;
  stage: string;
  difficulty: Difficulty;
  brief: ScenarioBrief;
  pitchType: string;
  timeLimitSec: number;
  readTimeSec: number;
  challengeEligible: boolean;
  source: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioRow {
  id: string;
  title: string;
  one_liner: string;
  industry: string;
  stage: string;
  difficulty: Difficulty;
  brief: ScenarioBrief;
  pitch_type: string;
  time_limit_sec: number;
  read_time_sec: number;
  challenge_eligible: boolean;
  source: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function mapScenarioRow(row: ScenarioRow): Scenario {
  return {
    id: row.id,
    title: row.title,
    oneLiner: row.one_liner,
    industry: row.industry,
    stage: row.stage,
    difficulty: row.difficulty,
    brief: row.brief,
    pitchType: row.pitch_type,
    timeLimitSec: row.time_limit_sec,
    readTimeSec: row.read_time_sec,
    challengeEligible: row.challenge_eligible,
    source: row.source,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ——————————————————————————————————————————————————————————
 * Challenge
 * —————————————————————————————————————————————————————————— */

export type ChallengeStatus = 'upcoming' | 'active' | 'completed';

export interface Challenge {
  id: string;
  scenarioId: string;
  weekNumber: number;
  year: number;
  title: string;
  description?: string;
  challengeType: ChallengeType;
  bonusCriteria?: Record<string, unknown>;
  startsAt: string;
  endsAt: string;
  status: ChallengeStatus;
  participantCount: number;
  createdAt: string;
}

export interface ChallengeRow {
  id: string;
  scenario_id: string;
  week_number: number;
  year: number;
  title: string;
  description: string | null;
  challenge_type: ChallengeType;
  bonus_criteria: Record<string, unknown> | null;
  starts_at: string;
  ends_at: string;
  status: ChallengeStatus;
  participant_count: number;
  created_at: string;
}

export function mapChallengeRow(row: ChallengeRow): Challenge {
  return {
    id: row.id,
    scenarioId: row.scenario_id,
    weekNumber: row.week_number,
    year: row.year,
    title: row.title,
    description: row.description ?? undefined,
    challengeType: row.challenge_type,
    bonusCriteria: row.bonus_criteria ?? undefined,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    participantCount: row.participant_count,
    createdAt: row.created_at,
  };
}

/* ——————————————————————————————————————————————————————————
 * Challenge Submission
 * —————————————————————————————————————————————————————————— */

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  runId?: string;
  baseScore?: number;
  bonusScore: number;
  totalScore?: number;
  rank?: number;
  xpEarned: number;
  submittedAt: string;
}

export interface ChallengeSubmissionRow {
  id: string;
  challenge_id: string;
  user_id: string;
  run_id: string | null;
  base_score: number | null;
  bonus_score: number;
  total_score: number | null;
  rank: number | null;
  xp_earned: number;
  submitted_at: string;
}

export function mapChallengeSubmissionRow(row: ChallengeSubmissionRow): ChallengeSubmission {
  return {
    id: row.id,
    challengeId: row.challenge_id,
    userId: row.user_id,
    runId: row.run_id ?? undefined,
    baseScore: row.base_score ?? undefined,
    bonusScore: row.bonus_score,
    totalScore: row.total_score ?? undefined,
    rank: row.rank ?? undefined,
    xpEarned: row.xp_earned,
    submittedAt: row.submitted_at,
  };
}

/* ——————————————————————————————————————————————————————————
 * Game Mode Session
 * —————————————————————————————————————————————————————————— */

export interface GameModeSession {
  id: string;
  userId: string;
  scenarioId: string;
  runId?: string;
  difficulty: Difficulty;
  score?: number;
  xpEarned: number;
  completedAt: string;
}

export interface GameModeSessionRow {
  id: string;
  user_id: string;
  scenario_id: string;
  run_id: string | null;
  difficulty: Difficulty;
  score: number | null;
  xp_earned: number;
  completed_at: string;
}

export function mapGameModeSessionRow(row: GameModeSessionRow): GameModeSession {
  return {
    id: row.id,
    userId: row.user_id,
    scenarioId: row.scenario_id,
    runId: row.run_id ?? undefined,
    difficulty: row.difficulty,
    score: row.score ?? undefined,
    xpEarned: row.xp_earned,
    completedAt: row.completed_at,
  };
}

/* ——————————————————————————————————————————————————————————
 * League
 * —————————————————————————————————————————————————————————— */

export interface League {
  id: string;
  tier: LeagueTier;
  weekNumber: number;
  year: number;
  startsAt: string;
  endsAt: string;
  createdAt: string;
}

export interface LeagueRow {
  id: string;
  tier: LeagueTier;
  week_number: number;
  year: number;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

export function mapLeagueRow(row: LeagueRow): League {
  return {
    id: row.id,
    tier: row.tier,
    weekNumber: row.week_number,
    year: row.year,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
  };
}

/* ——————————————————————————————————————————————————————————
 * League Membership
 * —————————————————————————————————————————————————————————— */

export interface LeagueMembership {
  id: string;
  leagueId: string;
  userId: string;
  weeklyXp: number;
  rank?: number;
  promoted: boolean;
  demoted: boolean;
  createdAt: string;
}

export interface LeagueMembershipRow {
  id: string;
  league_id: string;
  user_id: string;
  weekly_xp: number;
  rank: number | null;
  promoted: boolean;
  demoted: boolean;
  created_at: string;
}

export function mapLeagueMembershipRow(row: LeagueMembershipRow): LeagueMembership {
  return {
    id: row.id,
    leagueId: row.league_id,
    userId: row.user_id,
    weeklyXp: row.weekly_xp,
    rank: row.rank ?? undefined,
    promoted: row.promoted,
    demoted: row.demoted,
    createdAt: row.created_at,
  };
}

/* ——————————————————————————————————————————————————————————
 * Badge & User Stats
 * —————————————————————————————————————————————————————————— */

export interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
  rarity: BadgeRarity;
}

export interface UserStats {
  userId: string;
  totalXp: number;
  currentLeagueTier: LeagueTier;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: string;
  streakFreezesRemaining: number;
  streakFreezeLastReset?: string;
  challengesCompleted: number;
  challengeWins: number;
  gameModeCompleted: number;
  highestScore: number;
  badges: Badge[];
  createdAt: string;
  updatedAt: string;
}

export interface UserStatsRow {
  user_id: string;
  total_xp: number;
  current_league_tier: LeagueTier;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  streak_freezes_remaining: number;
  streak_freeze_last_reset: string | null;
  challenges_completed: number;
  challenge_wins: number;
  game_mode_completed: number;
  highest_score: number;
  badges: Badge[];
  created_at: string;
  updated_at: string;
}

export function mapUserStatsRow(row: UserStatsRow): UserStats {
  return {
    userId: row.user_id,
    totalXp: row.total_xp,
    currentLeagueTier: row.current_league_tier,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastActivityDate: row.last_activity_date ?? undefined,
    streakFreezesRemaining: row.streak_freezes_remaining,
    streakFreezeLastReset: row.streak_freeze_last_reset ?? undefined,
    challengesCompleted: row.challenges_completed,
    challengeWins: row.challenge_wins,
    gameModeCompleted: row.game_mode_completed,
    highestScore: row.highest_score,
    badges: row.badges,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* ——————————————————————————————————————————————————————————
 * XP Events
 * —————————————————————————————————————————————————————————— */

export type XpEventType =
  | 'challenge_submit'
  | 'game_mode'
  | 'pitch_analysis'
  | 'streak_bonus'
  | 'score_bonus'
  | 'improvement_bonus'
  | 'exploration_bonus';

export interface XpEvent {
  id: string;
  userId: string;
  eventType: XpEventType;
  xpAmount: number;
  sourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface XpEventRow {
  id: string;
  user_id: string;
  event_type: XpEventType;
  xp_amount: number;
  source_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function mapXpEventRow(row: XpEventRow): XpEvent {
  return {
    id: row.id,
    userId: row.user_id,
    eventType: row.event_type,
    xpAmount: row.xp_amount,
    sourceId: row.source_id ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
  };
}
