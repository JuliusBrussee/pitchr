-- Rate Limiting: table + RPCs for per-user request throttling
-- and atomic usage-event recording (fixes race condition).

-- ═══════════════════════════════════════════════════════════
-- A. rate_limits table
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS rate_limits (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  UNIQUE (user_id, endpoint, window_start)
);

CREATE INDEX idx_rate_limits_window_start ON rate_limits (window_start);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Service-role only — no user access
CREATE POLICY "service_role_only" ON rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════
-- B. check_rate_limit RPC (atomic check-and-increment)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id      UUID,
  p_endpoint     TEXT,
  p_window_seconds INT,
  p_max_requests  INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now         TIMESTAMPTZ := now();
  v_epoch       DOUBLE PRECISION := extract(epoch FROM v_now);
  v_window_start TIMESTAMPTZ;
  v_count       INT;
  v_retry_after INT;
BEGIN
  -- Compute deterministic window start
  v_window_start := to_timestamp(
    floor(v_epoch / p_window_seconds) * p_window_seconds
  );

  -- Atomic upsert: insert or increment
  INSERT INTO rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_count;

  -- If over limit, decrement back (denied requests don't inflate counter)
  IF v_count > p_max_requests THEN
    UPDATE rate_limits
    SET request_count = request_count - 1
    WHERE user_id = p_user_id
      AND endpoint = p_endpoint
      AND window_start = v_window_start;

    v_retry_after := p_window_seconds - (v_epoch - extract(epoch FROM v_window_start))::INT;

    RETURN jsonb_build_object(
      'allowed', false,
      'current', v_count - 1,
      'limit', p_max_requests,
      'retry_after', GREATEST(v_retry_after, 1)
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'current', v_count,
    'limit', p_max_requests,
    'retry_after', 0
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- C. cleanup_rate_limits RPC
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION cleanup_rate_limits(
  p_older_than_hours INT DEFAULT 24
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM rate_limits
  WHERE window_start < now() - (p_older_than_hours || ' hours')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ═══════════════════════════════════════════════════════════
-- D. check_and_record_usage RPC (fixes race condition)
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_and_record_usage(
  p_user_id      UUID,
  p_resource     TEXT,
  p_limit        INT,
  p_period_start TIMESTAMPTZ,
  p_period_end   TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used INT;
BEGIN
  -- Serialize per user+resource using advisory lock
  PERFORM pg_advisory_xact_lock(
    hashtext(p_user_id::TEXT || '::' || p_resource)
  );

  -- Count existing usage events in period
  SELECT COUNT(*) INTO v_used
  FROM usage_events
  WHERE user_id = p_user_id
    AND resource = p_resource
    AND period_start >= p_period_start
    AND period_end <= p_period_end;

  -- Check limit
  IF v_used >= p_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'used', v_used,
      'limit', p_limit,
      'recorded', false
    );
  END IF;

  -- Insert usage event atomically
  INSERT INTO usage_events (user_id, resource, period_start, period_end)
  VALUES (p_user_id, p_resource, p_period_start, p_period_end);

  RETURN jsonb_build_object(
    'allowed', true,
    'used', v_used + 1,
    'limit', p_limit,
    'recorded', true
  );
END;
$$;

