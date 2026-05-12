-- Pitchr Launch Reporting Queries
-- Paste any section into the Supabase SQL Editor to view reports.

-- 1. Daily KPIs (last 14 days)
SELECT * FROM reporting.daily_kpis ORDER BY day DESC LIMIT 14;

-- 2. User Funnel
-- SELECT * FROM reporting.user_funnel;

-- 3. Revenue by Day (last 14 days)
-- SELECT * FROM reporting.revenue_by_day ORDER BY day DESC LIMIT 14;

-- 4. Revenue Summary
-- SELECT * FROM reporting.revenue_summary;

-- 5. User Engagement (top 20 by runs)
-- SELECT * FROM reporting.user_engagement ORDER BY total_runs DESC LIMIT 20;

-- 6. Run Breakdown (by mode + input type)
-- SELECT * FROM reporting.run_breakdown;

-- 7. Referral Performance
-- SELECT * FROM reporting.referral_performance;

-- 8. Referrals by Day (last 14 days)
-- SELECT * FROM reporting.referrals_by_day ORDER BY day DESC LIMIT 14;

-- 9. Cohort Retention
-- SELECT * FROM reporting.cohort_retention ORDER BY cohort_week DESC, weeks_since_signup ASC;
