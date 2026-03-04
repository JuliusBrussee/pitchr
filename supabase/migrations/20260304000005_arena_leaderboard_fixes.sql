-- ============================================================
-- Fix leaderboard queries:
-- 1. Add FK from user_stats.user_id → profiles.id so PostgREST
--    can resolve the embedded join profiles:user_id(display_name)
-- 2. Allow public SELECT on user_stats for leaderboard display
-- ============================================================

-- 1. Foreign key so PostgREST can join user_stats → profiles
ALTER TABLE public.user_stats
  ADD CONSTRAINT user_stats_user_id_profiles_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Public read policy for leaderboard (currently only own-row)
CREATE POLICY "Anyone can read user_stats for leaderboard"
  ON public.user_stats FOR SELECT
  USING (true);
