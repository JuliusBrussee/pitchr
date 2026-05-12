-- Launch Reporting Views
-- Creates a reporting schema with 9 views for monitoring launch health.
-- Query from Supabase SQL Editor: SELECT * FROM reporting.daily_kpis;

CREATE SCHEMA IF NOT EXISTS reporting;

-- ============================================================================
-- 1. reporting.daily_kpis — at-a-glance daily metrics (1 row/day)
-- ============================================================================

CREATE OR REPLACE VIEW reporting.daily_kpis AS
WITH days AS (
  SELECT d::date AS day
  FROM generate_series('2026-03-01'::date, current_date, '1 day') AS d
),
signups AS (
  SELECT created_at::date AS day, count(*) AS cnt
  FROM auth.users
  GROUP BY 1
),
confirmed AS (
  SELECT email_confirmed_at::date AS day, count(*) AS cnt
  FROM auth.users
  WHERE email_confirmed_at IS NOT NULL
  GROUP BY 1
),
active AS (
  SELECT created_at::date AS day, count(DISTINCT user_id) AS cnt
  FROM runs
  WHERE status = 'complete'
  GROUP BY 1
),
run_stats AS (
  SELECT
    created_at::date AS day,
    count(*) AS total_runs,
    count(*) FILTER (WHERE status = 'complete') AS completed_runs,
    count(*) FILTER (WHERE is_fallback) AS fallback_runs
  FROM runs
  GROUP BY 1
),
referral_claims AS (
  SELECT created_at::date AS day, count(*) AS cnt
  FROM referrals
  GROUP BY 1
),
credit_purchases AS (
  SELECT created_at::date AS day, count(*) AS cnt
  FROM credit_transactions
  WHERE credit_type = 'purchased' AND amount > 0
  GROUP BY 1
),
day_pass_sales AS (
  SELECT purchased_at::date AS day, count(*) AS cnt
  FROM day_passes
  GROUP BY 1
)
SELECT
  d.day,
  coalesce(s.cnt, 0)            AS signups,
  coalesce(c.cnt, 0)            AS confirmed,
  coalesce(a.cnt, 0)            AS active_users,
  coalesce(r.total_runs, 0)     AS total_runs,
  coalesce(r.completed_runs, 0) AS completed_runs,
  coalesce(r.fallback_runs, 0)  AS fallback_runs,
  coalesce(ref.cnt, 0)          AS referral_claims,
  coalesce(cp.cnt, 0)           AS credit_purchases,
  coalesce(dp.cnt, 0)           AS day_passes_sold
FROM days d
LEFT JOIN signups s ON s.day = d.day
LEFT JOIN confirmed c ON c.day = d.day
LEFT JOIN active a ON a.day = d.day
LEFT JOIN run_stats r ON r.day = d.day
LEFT JOIN referral_claims ref ON ref.day = d.day
LEFT JOIN credit_purchases cp ON cp.day = d.day
LEFT JOIN day_pass_sales dp ON dp.day = d.day;

-- ============================================================================
-- 2. reporting.user_funnel — signup-to-paid conversion (1 summary row)
-- ============================================================================

CREATE OR REPLACE VIEW reporting.user_funnel AS
WITH base AS (
  SELECT
    count(*) AS total_signups,
    count(*) FILTER (WHERE email_confirmed_at IS NOT NULL) AS confirmed,
    count(*) FILTER (WHERE last_sign_in_at IS NOT NULL) AS logged_in
  FROM auth.users
),
run_milestones AS (
  SELECT
    count(DISTINCT user_id) FILTER (WHERE run_count >= 1) AS ran_1,
    count(DISTINCT user_id) FILTER (WHERE run_count >= 2) AS ran_2,
    count(DISTINCT user_id) FILTER (WHERE run_count >= 5) AS ran_5
  FROM (
    SELECT user_id, count(*) AS run_count
    FROM runs WHERE status = 'complete'
    GROUP BY user_id
  ) u
),
paid AS (
  SELECT count(DISTINCT user_id) AS cnt
  FROM subscriptions
  WHERE plan_id IN ('day_pass', 'pro') AND status = 'active'
)
SELECT
  b.total_signups,
  b.confirmed,
  round(b.confirmed * 100.0 / nullif(b.total_signups, 0), 1) AS confirmed_pct,
  b.logged_in,
  round(b.logged_in * 100.0 / nullif(b.total_signups, 0), 1) AS logged_in_pct,
  rm.ran_1 AS first_run,
  round(rm.ran_1 * 100.0 / nullif(b.total_signups, 0), 1) AS first_run_pct,
  rm.ran_2 AS second_run,
  round(rm.ran_2 * 100.0 / nullif(b.total_signups, 0), 1) AS second_run_pct,
  rm.ran_5 AS five_runs,
  round(rm.ran_5 * 100.0 / nullif(b.total_signups, 0), 1) AS five_runs_pct,
  p.cnt AS paid_users,
  round(p.cnt * 100.0 / nullif(b.total_signups, 0), 1) AS paid_pct
FROM base b, run_milestones rm, paid p;

-- ============================================================================
-- 3. reporting.revenue_by_day — revenue events per day (1 row/day)
-- ============================================================================

CREATE OR REPLACE VIEW reporting.revenue_by_day AS
WITH days AS (
  SELECT d::date AS day
  FROM generate_series('2026-03-01'::date, current_date, '1 day') AS d
),
credit_buys AS (
  SELECT created_at::date AS day,
    count(*) AS credit_purchases,
    sum(amount) AS credits_sold
  FROM credit_transactions
  WHERE credit_type = 'purchased' AND amount > 0
  GROUP BY 1
),
dp AS (
  SELECT purchased_at::date AS day, count(*) AS day_passes_sold
  FROM day_passes
  GROUP BY 1
),
new_subs AS (
  SELECT created_at::date AS day,
    count(*) FILTER (WHERE plan_id = 'pro') AS new_pro,
    count(*) FILTER (WHERE plan_id = 'day_pass') AS new_day_pass
  FROM subscriptions
  GROUP BY 1
)
SELECT
  d.day,
  coalesce(cb.credit_purchases, 0) AS credit_purchases,
  coalesce(cb.credits_sold, 0)     AS credits_sold,
  coalesce(dp.day_passes_sold, 0)  AS day_passes_sold,
  coalesce(ns.new_pro, 0)          AS new_pro_subs,
  coalesce(ns.new_day_pass, 0)     AS new_day_pass_subs
FROM days d
LEFT JOIN credit_buys cb ON cb.day = d.day
LEFT JOIN dp ON dp.day = d.day
LEFT JOIN new_subs ns ON ns.day = d.day;

-- ============================================================================
-- 4. reporting.revenue_summary — current revenue snapshot (1 summary row)
-- ============================================================================

CREATE OR REPLACE VIEW reporting.revenue_summary AS
SELECT
  (SELECT count(*) FROM subscriptions WHERE plan_id = 'pro' AND status = 'active') AS active_pro_subs,
  (SELECT count(*) FROM subscriptions WHERE plan_id = 'pro' AND status = 'active') * 29 AS estimated_mrr,
  (SELECT count(*) FROM day_passes) AS total_day_passes,
  (SELECT coalesce(sum(amount), 0) FROM credit_transactions WHERE credit_type = 'purchased' AND amount > 0) AS total_credits_purchased,
  (SELECT count(DISTINCT user_id) FROM credit_transactions WHERE credit_type = 'purchased' AND amount > 0) AS unique_credit_buyers;

-- ============================================================================
-- 5. reporting.user_engagement — per-user engagement stats (1 row/user)
-- ============================================================================

CREATE OR REPLACE VIEW reporting.user_engagement AS
SELECT
  u.id AS user_id,
  u.email,
  u.created_at AS signed_up_at,
  coalesce(r.total_runs, 0) AS total_runs,
  r.avg_score,
  r.best_score,
  r.score_improvement,
  r.days_active,
  coalesce(s.plan_id, 'free') AS plan
FROM auth.users u
LEFT JOIN (
  SELECT
    user_id,
    count(*) AS total_runs,
    round(avg(overall_score), 1) AS avg_score,
    max(overall_score) AS best_score,
    (
      -- last score minus first score (among completed runs)
      (array_agg(overall_score ORDER BY created_at DESC))[1] -
      (array_agg(overall_score ORDER BY created_at ASC))[1]
    ) AS score_improvement,
    count(DISTINCT created_at::date) AS days_active
  FROM runs
  WHERE status = 'complete'
  GROUP BY user_id
) r ON r.user_id = u.id
LEFT JOIN subscriptions s ON s.user_id = u.id;

-- ============================================================================
-- 6. reporting.run_breakdown — runs by mode + input type (~8 rows)
-- ============================================================================

CREATE OR REPLACE VIEW reporting.run_breakdown AS
SELECT
  mode,
  input_type,
  count(*) AS total_runs,
  count(DISTINCT user_id) AS unique_users,
  round(avg(overall_score), 1) AS avg_score,
  round(avg(extract(epoch FROM (completed_at - started_at))), 1) AS avg_duration_secs
FROM runs
WHERE status = 'complete'
GROUP BY mode, input_type;

-- ============================================================================
-- 7. reporting.referral_performance — referral program summary (1 summary row)
-- ============================================================================

CREATE OR REPLACE VIEW reporting.referral_performance AS
SELECT
  (SELECT count(*) FROM referral_codes) AS codes_created,
  (SELECT count(*) FROM referrals) AS total_referrals,
  (SELECT count(*) FROM referrals WHERE status = 'pending') AS pending,
  (SELECT count(*) FROM referrals WHERE status = 'completed') AS completed,
  (SELECT count(*) FROM referrals WHERE status = 'rewarded') AS rewarded,
  (SELECT round(count(*)::numeric / nullif((SELECT count(*) FROM referral_codes), 0), 1) FROM referrals) AS avg_referrals_per_referrer,
  (SELECT round(count(*) FILTER (WHERE status IN ('completed', 'rewarded')) * 100.0 / nullif(count(*), 0), 1) FROM referrals) AS conversion_pct,
  (SELECT coalesce(sum(amount), 0) FROM credit_transactions WHERE source IN ('referral_referrer', 'referral_referred')) AS total_referral_credits_granted;

-- ============================================================================
-- 8. reporting.referrals_by_day — daily referral activity (1 row/day)
-- ============================================================================

CREATE OR REPLACE VIEW reporting.referrals_by_day AS
WITH days AS (
  SELECT d::date AS day
  FROM generate_series('2026-03-01'::date, current_date, '1 day') AS d
),
new_refs AS (
  SELECT created_at::date AS day, count(*) AS cnt
  FROM referrals
  GROUP BY 1
),
rewarded AS (
  SELECT rewarded_at::date AS day, count(*) AS cnt
  FROM referrals
  WHERE rewarded_at IS NOT NULL
  GROUP BY 1
),
active_referrers AS (
  SELECT created_at::date AS day, count(DISTINCT referrer_id) AS cnt
  FROM referrals
  GROUP BY 1
)
SELECT
  d.day,
  coalesce(nr.cnt, 0) AS new_referrals,
  coalesce(rw.cnt, 0) AS rewarded,
  coalesce(ar.cnt, 0) AS active_referrers
FROM days d
LEFT JOIN new_refs nr ON nr.day = d.day
LEFT JOIN rewarded rw ON rw.day = d.day
LEFT JOIN active_referrers ar ON ar.day = d.day;

-- ============================================================================
-- 9. reporting.cohort_retention — weekly cohort return rates (cohorts x 12 wk)
-- ============================================================================

CREATE OR REPLACE VIEW reporting.cohort_retention AS
WITH user_cohorts AS (
  SELECT
    id AS user_id,
    date_trunc('week', created_at)::date AS cohort_week
  FROM auth.users
),
cohort_sizes AS (
  SELECT cohort_week, count(*) AS cohort_size
  FROM user_cohorts
  GROUP BY 1
),
user_activity AS (
  SELECT DISTINCT user_id, created_at::date AS active_date
  FROM runs
  WHERE status = 'complete'
),
retention AS (
  SELECT
    uc.cohort_week,
    w.weeks_since_signup,
    count(DISTINCT ua.user_id) AS active_users
  FROM user_cohorts uc
  CROSS JOIN generate_series(0, 12) AS w(weeks_since_signup)
  LEFT JOIN user_activity ua
    ON ua.user_id = uc.user_id
    AND ua.active_date >= uc.cohort_week + (w.weeks_since_signup * 7)
    AND ua.active_date < uc.cohort_week + ((w.weeks_since_signup + 1) * 7)
  GROUP BY uc.cohort_week, w.weeks_since_signup
)
SELECT
  r.cohort_week,
  cs.cohort_size,
  r.weeks_since_signup,
  r.active_users,
  round(r.active_users * 100.0 / nullif(cs.cohort_size, 0), 1) AS retention_pct
FROM retention r
JOIN cohort_sizes cs ON cs.cohort_week = r.cohort_week;
