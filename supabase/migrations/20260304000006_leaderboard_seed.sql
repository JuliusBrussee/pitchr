-- ============================================================
-- Leaderboard seed data: fake users with realistic stats
-- for development & demo. Safe to skip in production.
-- ============================================================

/* ====================================================================
   1. FAKE AUTH USERS
   (The on_auth_user_created trigger auto-creates profiles)
   ==================================================================== */

INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token
)
VALUES
  ('aaaaaaaa-0001-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alexc92@demo.pitchr.com',         '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '45 days', '{"full_name": "alexc92"}'::jsonb,            now() - interval '45 days', now(), '', ''),
  ('aaaaaaaa-0002-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sarahk.vc@demo.pitchr.com',        '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '38 days', '{"full_name": "sarahk.vc"}'::jsonb,          now() - interval '38 days', now(), '', ''),
  ('aaaaaaaa-0003-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marcusj@demo.pitchr.com',          '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '32 days', '{"full_name": "marcusj"}'::jsonb,            now() - interval '32 days', now(), '', ''),
  ('aaaaaaaa-0004-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'priya.builds@demo.pitchr.com',     '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '30 days', '{"full_name": "priya.builds"}'::jsonb,       now() - interval '30 days', now(), '', ''),
  ('aaaaaaaa-0005-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jamesriv@demo.pitchr.com',         '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '28 days', '{"full_name": "jamesriv"}'::jsonb,           now() - interval '28 days', now(), '', ''),
  ('aaaaaaaa-0006-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'em_watts@demo.pitchr.com',         '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '25 days', '{"full_name": "em_watts"}'::jsonb,           now() - interval '25 days', now(), '', ''),
  ('aaaaaaaa-0007-4000-8000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'dlee.founder@demo.pitchr.com',     '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '22 days', '{"full_name": "dlee.founder"}'::jsonb,       now() - interval '22 days', now(), '', ''),
  ('aaaaaaaa-0008-4000-8000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'olivia.mtz@demo.pitchr.com',       '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '20 days', '{"full_name": "olivia.mtz"}'::jsonb,         now() - interval '20 days', now(), '', ''),
  ('aaaaaaaa-0009-4000-8000-000000000009', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'raj_p@demo.pitchr.com',            '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '18 days', '{"full_name": "raj_p"}'::jsonb,              now() - interval '18 days', now(), '', ''),
  ('aaaaaaaa-0010-4000-8000-000000000010', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ninavlk@demo.pitchr.com',          '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '16 days', '{"full_name": "ninavlk"}'::jsonb,            now() - interval '16 days', now(), '', ''),
  ('aaaaaaaa-0011-4000-8000-000000000011', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'tomhdev@demo.pitchr.com',          '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '14 days', '{"full_name": "tomhdev"}'::jsonb,            now() - interval '14 days', now(), '', ''),
  ('aaaaaaaa-0012-4000-8000-000000000012', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lisnakam@demo.pitchr.com',         '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '12 days', '{"full_name": "lisnakam"}'::jsonb,           now() - interval '12 days', now(), '', ''),
  ('aaaaaaaa-0013-4000-8000-000000000013', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cburke_pitch@demo.pitchr.com',     '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '10 days', '{"full_name": "cburke_pitch"}'::jsonb,       now() - interval '10 days', now(), '', ''),
  ('aaaaaaaa-0014-4000-8000-000000000014', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mayadesai@demo.pitchr.com',        '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '8 days',  '{"full_name": "mayadesai"}'::jsonb,          now() - interval '8 days',  now(), '', ''),
  ('aaaaaaaa-0015-4000-8000-000000000015', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ben.ok@demo.pitchr.com',           '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '6 days',  '{"full_name": "ben.ok"}'::jsonb,             now() - interval '6 days',  now(), '', ''),
  ('aaaaaaaa-0016-4000-8000-000000000016', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sophief_@demo.pitchr.com',         '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '5 days',  '{"full_name": "sophief_"}'::jsonb,           now() - interval '5 days',  now(), '', ''),
  ('aaaaaaaa-0017-4000-8000-000000000017', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'kzhang23@demo.pitchr.com',         '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '4 days',  '{"full_name": "kzhang23"}'::jsonb,           now() - interval '4 days',  now(), '', ''),
  ('aaaaaaaa-0018-4000-8000-000000000018', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'anna.kow@demo.pitchr.com',         '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '3 days',  '{"full_name": "anna.kow"}'::jsonb,           now() - interval '3 days',  now(), '', ''),
  ('aaaaaaaa-0019-4000-8000-000000000019', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'diego.m@demo.pitchr.com',          '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '2 days',  '{"full_name": "diego.m"}'::jsonb,            now() - interval '2 days',  now(), '', ''),
  ('aaaaaaaa-0020-4000-8000-000000000020', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rachtorr@demo.pitchr.com',         '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012', now() - interval '1 day',   '{"full_name": "rachtorr"}'::jsonb,           now() - interval '1 day',   now(), '', '')
ON CONFLICT (id) DO NOTHING;


/* ====================================================================
   2. USER STATS — all-time leaderboard
   Spread across tiers with realistic XP, scores, streaks, and badges
   ==================================================================== */

INSERT INTO user_stats (
  user_id, total_xp, current_league_tier,
  current_streak, longest_streak, last_activity_date,
  streak_freezes_remaining, challenges_completed, challenge_wins,
  game_mode_completed, highest_score, badges, updated_at
)
VALUES
  -- #1 Alex Chen — diamond grinder, top earner
  ('aaaaaaaa-0001-4000-8000-000000000001', 14820, 'diamond', 18, 24, CURRENT_DATE,     1, 9, 4, 47, 94.50,
   '[{"id":"streak_7","name":"Week Warrior","tier":"silver","awardedAt":"2026-02-14T12:00:00Z"},{"id":"streak_30","name":"Monthly Machine","tier":"gold","awardedAt":"2026-03-01T10:00:00Z"},{"id":"first_win","name":"First Blood","tier":"bronze","awardedAt":"2026-01-22T09:00:00Z"},{"id":"score_90","name":"Pitch Perfect","tier":"gold","awardedAt":"2026-02-18T14:30:00Z"}]'::jsonb, now()),

  -- #2 Sarah Kim — gold power user
  ('aaaaaaaa-0002-4000-8000-000000000002', 11450, 'gold', 12, 16, CURRENT_DATE,        1, 8, 3, 38, 92.00,
   '[{"id":"streak_7","name":"Week Warrior","tier":"silver","awardedAt":"2026-02-10T08:00:00Z"},{"id":"first_win","name":"First Blood","tier":"bronze","awardedAt":"2026-01-28T11:00:00Z"},{"id":"score_90","name":"Pitch Perfect","tier":"gold","awardedAt":"2026-02-22T16:00:00Z"}]'::jsonb, now()),

  -- #3 Marcus Johnson — gold, consistent
  ('aaaaaaaa-0003-4000-8000-000000000003', 9870, 'gold', 9, 14, CURRENT_DATE - 1,      1, 7, 2, 34, 89.75,
   '[{"id":"streak_7","name":"Week Warrior","tier":"silver","awardedAt":"2026-02-08T10:00:00Z"},{"id":"first_win","name":"First Blood","tier":"bronze","awardedAt":"2026-02-01T13:00:00Z"}]'::jsonb, now()),

  -- #4 Priya Sharma — gold, rising fast
  ('aaaaaaaa-0004-4000-8000-000000000004', 8340, 'gold', 14, 14, CURRENT_DATE,         0, 6, 2, 29, 91.25,
   '[{"id":"streak_7","name":"Week Warrior","tier":"silver","awardedAt":"2026-02-20T09:00:00Z"},{"id":"score_90","name":"Pitch Perfect","tier":"gold","awardedAt":"2026-03-01T15:00:00Z"}]'::jsonb, now()),

  -- #5 James Rivera — silver veteran
  ('aaaaaaaa-0005-4000-8000-000000000005', 7120, 'silver', 3, 11, CURRENT_DATE - 2,    1, 6, 1, 26, 87.50,
   '[{"id":"streak_7","name":"Week Warrior","tier":"silver","awardedAt":"2026-02-15T12:00:00Z"}]'::jsonb, now()),

  -- #6 Emma Watson — silver, challenge focused
  ('aaaaaaaa-0006-4000-8000-000000000006', 6580, 'silver', 5, 8, CURRENT_DATE,         1, 5, 2, 22, 88.00,
   '[{"id":"first_win","name":"First Blood","tier":"bronze","awardedAt":"2026-02-05T10:00:00Z"}]'::jsonb, now()),

  -- #7 Daniel Lee — silver, steady
  ('aaaaaaaa-0007-4000-8000-000000000007', 5940, 'silver', 7, 10, CURRENT_DATE - 1,    1, 4, 1, 20, 85.25,
   '[{"id":"streak_7","name":"Week Warrior","tier":"silver","awardedAt":"2026-02-25T08:00:00Z"}]'::jsonb, now()),

  -- #8 Olivia Martinez — silver
  ('aaaaaaaa-0008-4000-8000-000000000008', 5210, 'silver', 2, 7, CURRENT_DATE - 3,     1, 4, 1, 18, 86.75,
   '[{"id":"first_win","name":"First Blood","tier":"bronze","awardedAt":"2026-02-12T14:00:00Z"}]'::jsonb, now()),

  -- #9 Raj Patel — bronze, climbing
  ('aaaaaaaa-0009-4000-8000-000000000009', 4650, 'bronze', 6, 6, CURRENT_DATE,         1, 3, 0, 16, 83.50,
   '[]'::jsonb, now()),

  -- #10 Nina Volkov — bronze
  ('aaaaaaaa-0010-4000-8000-000000000010', 3980, 'bronze', 4, 5, CURRENT_DATE - 1,     1, 3, 1, 14, 84.00,
   '[{"id":"first_win","name":"First Blood","tier":"bronze","awardedAt":"2026-02-28T16:00:00Z"}]'::jsonb, now()),

  -- #11 Tom Huang — bronze
  ('aaaaaaaa-0011-4000-8000-000000000011', 3420, 'bronze', 0, 4, CURRENT_DATE - 5,     0, 2, 0, 12, 81.25,
   '[]'::jsonb, now()),

  -- #12 Lisa Nakamura — bronze
  ('aaaaaaaa-0012-4000-8000-000000000012', 2890, 'bronze', 3, 3, CURRENT_DATE,         1, 2, 0, 10, 79.50,
   '[]'::jsonb, now()),

  -- #13 Chris Burke — bronze
  ('aaaaaaaa-0013-4000-8000-000000000013', 2340, 'bronze', 1, 3, CURRENT_DATE - 2,     1, 2, 0, 9,  80.00,
   '[]'::jsonb, now()),

  -- #14 Maya Desai — bronze, new
  ('aaaaaaaa-0014-4000-8000-000000000014', 1780, 'bronze', 2, 2, CURRENT_DATE - 1,     1, 1, 0, 7,  77.25,
   '[]'::jsonb, now()),

  -- #15 Ben Okafor — bronze, new
  ('aaaaaaaa-0015-4000-8000-000000000015', 1250, 'bronze', 1, 2, CURRENT_DATE,         1, 1, 0, 5,  75.00,
   '[]'::jsonb, now()),

  -- #16 Sophie Fischer — bronze, new
  ('aaaaaaaa-0016-4000-8000-000000000016', 920,  'bronze', 0, 1, CURRENT_DATE - 3,     1, 1, 0, 4,  73.50,
   '[]'::jsonb, now()),

  -- #17 Kevin Zhang — bronze, just started
  ('aaaaaaaa-0017-4000-8000-000000000017', 640,  'bronze', 1, 1, CURRENT_DATE - 1,     1, 0, 0, 3,  71.00,
   '[]'::jsonb, now()),

  -- #18 Anna Kowalski — bronze, just started
  ('aaaaaaaa-0018-4000-8000-000000000018', 380,  'bronze', 0, 1, CURRENT_DATE - 4,     1, 0, 0, 2,  68.50,
   '[]'::jsonb, now()),

  -- #19 Diego Morales — bronze, brand new
  ('aaaaaaaa-0019-4000-8000-000000000019', 210,  'bronze', 1, 1, CURRENT_DATE,         1, 0, 0, 1,  65.00,
   '[]'::jsonb, now()),

  -- #20 Rachel Torres — bronze, brand new
  ('aaaaaaaa-0020-4000-8000-000000000020', 90,   'bronze', 0, 0, CURRENT_DATE - 1,     1, 0, 0, 1,  62.25,
   '[]'::jsonb, now())

ON CONFLICT (user_id) DO UPDATE SET
  total_xp = EXCLUDED.total_xp,
  current_league_tier = EXCLUDED.current_league_tier,
  current_streak = EXCLUDED.current_streak,
  longest_streak = EXCLUDED.longest_streak,
  last_activity_date = EXCLUDED.last_activity_date,
  challenges_completed = EXCLUDED.challenges_completed,
  challenge_wins = EXCLUDED.challenge_wins,
  game_mode_completed = EXCLUDED.game_mode_completed,
  highest_score = EXCLUDED.highest_score,
  badges = EXCLUDED.badges,
  updated_at = now();


/* ====================================================================
   3. LEAGUE — current week (week 10, 2026) gold league
   ==================================================================== */

INSERT INTO leagues (id, tier, week_number, year, starts_at, ends_at)
VALUES
  ('bbbbbbbb-0001-4000-8000-000000000001', 'gold',   10, 2026, '2026-03-02T00:00:00Z', '2026-03-08T23:59:59Z'),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'silver', 10, 2026, '2026-03-02T00:00:00Z', '2026-03-08T23:59:59Z'),
  ('bbbbbbbb-0003-4000-8000-000000000003', 'bronze', 10, 2026, '2026-03-02T00:00:00Z', '2026-03-08T23:59:59Z')
ON CONFLICT DO NOTHING;


/* ====================================================================
   4. LEAGUE MEMBERSHIPS — spread across leagues
   ==================================================================== */

INSERT INTO league_memberships (league_id, user_id, weekly_xp, rank, promoted, demoted)
VALUES
  -- Gold league (top performers)
  ('bbbbbbbb-0001-4000-8000-000000000001', 'aaaaaaaa-0001-4000-8000-000000000001', 1240, 1, false, false),
  ('bbbbbbbb-0001-4000-8000-000000000001', 'aaaaaaaa-0002-4000-8000-000000000002', 980,  2, false, false),
  ('bbbbbbbb-0001-4000-8000-000000000001', 'aaaaaaaa-0003-4000-8000-000000000003', 870,  3, false, false),
  ('bbbbbbbb-0001-4000-8000-000000000001', 'aaaaaaaa-0004-4000-8000-000000000004', 720,  4, false, false),
  ('bbbbbbbb-0001-4000-8000-000000000001', 'aaaaaaaa-0005-4000-8000-000000000005', 540,  5, false, false),
  ('bbbbbbbb-0001-4000-8000-000000000001', 'aaaaaaaa-0006-4000-8000-000000000006', 410,  6, false, false),
  ('bbbbbbbb-0001-4000-8000-000000000001', 'aaaaaaaa-0007-4000-8000-000000000007', 280,  7, false, false),

  -- Silver league
  ('bbbbbbbb-0002-4000-8000-000000000002', 'aaaaaaaa-0008-4000-8000-000000000008', 650,  1, false, false),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'aaaaaaaa-0009-4000-8000-000000000009', 520,  2, false, false),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'aaaaaaaa-0010-4000-8000-000000000010', 440,  3, false, false),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'aaaaaaaa-0011-4000-8000-000000000011', 310,  4, false, false),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'aaaaaaaa-0012-4000-8000-000000000012', 220,  5, false, false),
  ('bbbbbbbb-0002-4000-8000-000000000002', 'aaaaaaaa-0013-4000-8000-000000000013', 160,  6, false, false),

  -- Bronze league
  ('bbbbbbbb-0003-4000-8000-000000000003', 'aaaaaaaa-0014-4000-8000-000000000014', 380,  1, false, false),
  ('bbbbbbbb-0003-4000-8000-000000000003', 'aaaaaaaa-0015-4000-8000-000000000015', 290,  2, false, false),
  ('bbbbbbbb-0003-4000-8000-000000000003', 'aaaaaaaa-0016-4000-8000-000000000016', 180,  3, false, false),
  ('bbbbbbbb-0003-4000-8000-000000000003', 'aaaaaaaa-0017-4000-8000-000000000017', 120,  4, false, false),
  ('bbbbbbbb-0003-4000-8000-000000000003', 'aaaaaaaa-0018-4000-8000-000000000018', 70,   5, false, false),
  ('bbbbbbbb-0003-4000-8000-000000000003', 'aaaaaaaa-0019-4000-8000-000000000019', 40,   6, false, false),
  ('bbbbbbbb-0003-4000-8000-000000000003', 'aaaaaaaa-0020-4000-8000-000000000020', 15,   7, false, false)
ON CONFLICT (league_id, user_id) DO UPDATE SET
  weekly_xp = EXCLUDED.weekly_xp,
  rank = EXCLUDED.rank;


/* ====================================================================
   5. CHALLENGE SUBMISSIONS — Week 10 challenge (active)
   Need the challenge ID first; grab it by week_number.
   ==================================================================== */

DO $$
DECLARE
  v_challenge_id uuid;
BEGIN
  SELECT id INTO v_challenge_id
  FROM challenges
  WHERE week_number = 10 AND year = 2026
  LIMIT 1;

  IF v_challenge_id IS NULL THEN
    RAISE NOTICE 'No week 10 challenge found — skipping submissions seed';
    RETURN;
  END IF;

  -- Update participant count
  UPDATE challenges SET participant_count = 12 WHERE id = v_challenge_id;

  -- Insert submissions (top performers first)
  INSERT INTO challenge_submissions (challenge_id, user_id, base_score, bonus_score, total_score, rank, xp_earned, submitted_at)
  VALUES
    (v_challenge_id, 'aaaaaaaa-0001-4000-8000-000000000001', 87.50, 8.00, 95.50, 1,  200, now() - interval '4 hours'),
    (v_challenge_id, 'aaaaaaaa-0004-4000-8000-000000000004', 85.00, 7.00, 92.00, 2,  150, now() - interval '6 hours'),
    (v_challenge_id, 'aaaaaaaa-0002-4000-8000-000000000002', 84.25, 6.00, 90.25, 3,  120, now() - interval '2 hours'),
    (v_challenge_id, 'aaaaaaaa-0006-4000-8000-000000000006', 82.00, 5.00, 87.00, 4,  100, now() - interval '8 hours'),
    (v_challenge_id, 'aaaaaaaa-0003-4000-8000-000000000003', 80.75, 4.00, 84.75, 5,  80,  now() - interval '12 hours'),
    (v_challenge_id, 'aaaaaaaa-0010-4000-8000-000000000010', 79.50, 4.00, 83.50, 6,  70,  now() - interval '1 day'),
    (v_challenge_id, 'aaaaaaaa-0008-4000-8000-000000000008', 78.00, 3.00, 81.00, 7,  60,  now() - interval '18 hours'),
    (v_challenge_id, 'aaaaaaaa-0005-4000-8000-000000000005', 76.25, 4.00, 80.25, 8,  50,  now() - interval '1 day 4 hours'),
    (v_challenge_id, 'aaaaaaaa-0009-4000-8000-000000000009', 74.50, 3.00, 77.50, 9,  40,  now() - interval '2 days'),
    (v_challenge_id, 'aaaaaaaa-0007-4000-8000-000000000007', 72.00, 2.00, 74.00, 10, 35,  now() - interval '1 day 8 hours'),
    (v_challenge_id, 'aaaaaaaa-0012-4000-8000-000000000012', 68.50, 2.00, 70.50, 11, 30,  now() - interval '2 days 6 hours'),
    (v_challenge_id, 'aaaaaaaa-0015-4000-8000-000000000015', 65.00, 1.00, 66.00, 12, 25,  now() - interval '3 days')
  ON CONFLICT (challenge_id, user_id) DO UPDATE SET
    base_score = EXCLUDED.base_score,
    bonus_score = EXCLUDED.bonus_score,
    total_score = EXCLUDED.total_score,
    rank = EXCLUDED.rank,
    xp_earned = EXCLUDED.xp_earned;
END $$;
