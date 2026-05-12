-- Admin Dashboard RPC
-- Wraps reporting views into a single function callable via supabase.rpc().
-- This avoids needing to expose the reporting schema via PostgREST.
-- Uses SECURITY DEFINER so it runs with the owner's privileges (can read reporting views).

CREATE OR REPLACE FUNCTION get_admin_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, reporting
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'kpis', COALESCE((
      SELECT jsonb_agg(row_to_json(k.*)::jsonb ORDER BY k.day DESC)
      FROM reporting.daily_kpis k
      WHERE k.day >= current_date - interval '30 days'
    ), '[]'::jsonb),
    'funnel', COALESCE((
      SELECT row_to_json(f.*)::jsonb
      FROM reporting.user_funnel f
      LIMIT 1
    ), 'null'::jsonb),
    'users', COALESCE((
      SELECT jsonb_agg(row_to_json(u.*)::jsonb ORDER BY u.total_runs DESC)
      FROM (
        SELECT * FROM reporting.user_engagement
        WHERE email NOT LIKE '%@pitchr.live'
        ORDER BY total_runs DESC
        LIMIT 200
      ) u
    ), '[]'::jsonb),
    'revenue', COALESCE((
      SELECT row_to_json(r.*)::jsonb
      FROM reporting.revenue_summary r
      LIMIT 1
    ), 'null'::jsonb),
    'retention', COALESCE((
      SELECT jsonb_agg(row_to_json(c.*)::jsonb ORDER BY c.cohort_week DESC)
      FROM reporting.cohort_retention c
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;
