-- Pitch Arena Migration
-- Adds scenarios, challenges, challenge_submissions, game_mode_sessions,
-- leagues, league_memberships, user_stats, and xp_events tables
-- for the competitive pitch arena feature.

/* ====================================================================
   1. SCENARIOS — pitch scenario content
   ==================================================================== */

CREATE TABLE IF NOT EXISTS scenarios (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title               TEXT NOT NULL,
  one_liner           TEXT NOT NULL,
  industry            TEXT NOT NULL,
  stage               TEXT NOT NULL,
  difficulty          TEXT NOT NULL DEFAULT 'pro',
  brief               JSONB NOT NULL,
  pitch_type          TEXT NOT NULL DEFAULT 'elevator',
  time_limit_sec      INT NOT NULL DEFAULT 120,
  read_time_sec       INT NOT NULL DEFAULT 60,
  challenge_eligible  BOOLEAN DEFAULT true,
  source              TEXT NOT NULL DEFAULT 'synthetic',
  status              TEXT NOT NULL DEFAULT 'draft',
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

/* ====================================================================
   2. CHALLENGES — weekly competition instances
   ==================================================================== */

CREATE TABLE IF NOT EXISTS challenges (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scenario_id         UUID NOT NULL REFERENCES scenarios(id),
  week_number         INT NOT NULL,
  year                INT NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  challenge_type      TEXT NOT NULL DEFAULT 'elevator',
  bonus_criteria      JSONB,
  starts_at           TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'upcoming',
  participant_count   INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_number, year)
);

/* ====================================================================
   3. CHALLENGE_SUBMISSIONS — user entries
   ==================================================================== */

CREATE TABLE IF NOT EXISTS challenge_submissions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id        UUID NOT NULL REFERENCES challenges(id),
  user_id             UUID NOT NULL,
  run_id              UUID REFERENCES runs(id),
  base_score          NUMERIC(5,2),
  bonus_score         NUMERIC(5,2) DEFAULT 0,
  total_score         NUMERIC(5,2),
  rank                INT,
  xp_earned           INT DEFAULT 0,
  submitted_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

/* ====================================================================
   4. GAME_MODE_SESSIONS — practice attempts
   ==================================================================== */

CREATE TABLE IF NOT EXISTS game_mode_sessions (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL,
  scenario_id         UUID NOT NULL REFERENCES scenarios(id),
  run_id              UUID REFERENCES runs(id),
  difficulty          TEXT NOT NULL DEFAULT 'pro',
  score               NUMERIC(5,2),
  xp_earned           INT DEFAULT 0,
  completed_at        TIMESTAMPTZ DEFAULT now()
);

/* ====================================================================
   5. LEAGUES — weekly league instances
   ==================================================================== */

CREATE TABLE IF NOT EXISTS leagues (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier                TEXT NOT NULL,
  week_number         INT NOT NULL,
  year                INT NOT NULL,
  starts_at           TIMESTAMPTZ NOT NULL,
  ends_at             TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now()
);

/* ====================================================================
   6. LEAGUE_MEMBERSHIPS — user-league assignments
   ==================================================================== */

CREATE TABLE IF NOT EXISTS league_memberships (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id           UUID NOT NULL REFERENCES leagues(id),
  user_id             UUID NOT NULL,
  weekly_xp           INT DEFAULT 0,
  rank                INT,
  promoted            BOOLEAN DEFAULT false,
  demoted             BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(league_id, user_id)
);

/* ====================================================================
   7. USER_STATS — persistent progression (one row per user)
   ==================================================================== */

CREATE TABLE IF NOT EXISTS user_stats (
  user_id                   UUID PRIMARY KEY,
  total_xp                  INT DEFAULT 0,
  current_league_tier       TEXT DEFAULT 'bronze',
  current_streak            INT DEFAULT 0,
  longest_streak            INT DEFAULT 0,
  last_activity_date        DATE,
  streak_freezes_remaining  INT DEFAULT 1,
  streak_freeze_last_reset  DATE,
  challenges_completed      INT DEFAULT 0,
  challenge_wins            INT DEFAULT 0,
  game_mode_completed       INT DEFAULT 0,
  highest_score             NUMERIC(5,2) DEFAULT 0,
  badges                    JSONB DEFAULT '[]'::jsonb,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

/* ====================================================================
   8. XP_EVENTS — granular XP log
   ==================================================================== */

CREATE TABLE IF NOT EXISTS xp_events (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL,
  event_type          TEXT NOT NULL,
  xp_amount           INT NOT NULL,
  source_id           UUID,
  metadata            JSONB,
  created_at          TIMESTAMPTZ DEFAULT now()
);

/* ====================================================================
   INDEXES
   ==================================================================== */

CREATE INDEX idx_challenges_active ON challenges(status, starts_at);
CREATE INDEX idx_challenge_submissions_leaderboard ON challenge_submissions(challenge_id, total_score DESC);
CREATE INDEX idx_league_memberships_ranking ON league_memberships(league_id, weekly_xp DESC);
CREATE INDEX idx_xp_events_user_weekly ON xp_events(user_id, created_at);
CREATE INDEX idx_game_mode_user ON game_mode_sessions(user_id, completed_at);
CREATE INDEX idx_scenarios_approved ON scenarios(status, industry, difficulty);

/* ====================================================================
   ROW LEVEL SECURITY
   ==================================================================== */

ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_mode_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

/* --- scenarios: publicly readable, admin-only write --- */

CREATE POLICY scenarios_select ON scenarios
  FOR SELECT USING (true);

/* --- challenges: publicly readable, admin-only write --- */

CREATE POLICY challenges_select ON challenges
  FOR SELECT USING (true);

/* --- challenge_submissions: read all (leaderboard), insert own --- */

CREATE POLICY challenge_submissions_select ON challenge_submissions
  FOR SELECT USING (true);

do $$ begin
  CREATE POLICY challenge_submissions_insert_own ON challenge_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

/* --- game_mode_sessions: user can read/insert own only --- */

do $$ begin
  CREATE POLICY game_mode_sessions_select_own ON game_mode_sessions
    FOR SELECT USING (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

do $$ begin
  CREATE POLICY game_mode_sessions_insert_own ON game_mode_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

/* --- leagues: publicly readable --- */

CREATE POLICY leagues_select ON leagues
  FOR SELECT USING (true);

/* --- league_memberships: publicly readable (leaderboard), admin-only write --- */

CREATE POLICY league_memberships_select ON league_memberships
  FOR SELECT USING (true);

/* --- user_stats: user can read own, admin-only write (services use admin client) --- */

do $$ begin
  CREATE POLICY user_stats_select_own ON user_stats
    FOR SELECT USING (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;

/* --- xp_events: user can read own, admin-only write --- */

do $$ begin
  CREATE POLICY xp_events_select_own ON xp_events
    FOR SELECT USING (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
