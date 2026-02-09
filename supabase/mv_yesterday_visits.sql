-- ============================================================================
-- MATERIALIZED VIEW: mv_yesterday_visits
-- Purpose: Pre-computed yesterday's visit summary for the portal dashboard
-- Refresh: Should be refreshed daily via pg_cron or manually
-- ============================================================================

-- Drop existing view if any
DROP MATERIALIZED VIEW IF EXISTS mv_yesterday_visits;

-- Create the materialized view
CREATE MATERIALIZED VIEW mv_yesterday_visits AS
SELECT
    vc.id              AS visit_id,
    vc.client_id,
    vc.division_id,
    vc.user_id,
    vc.market_id,
    vc.visit_date,
    vc.status,
    vc.actual_start,
    vc.actual_end,
    vc.planned_start,
    vc.planned_end,
    vc.source,
    vc.is_out_of_range,
    vc.trust_score,

    -- Duration in minutes
    CASE
        WHEN vc.actual_start IS NOT NULL AND vc.actual_end IS NOT NULL
        THEN ROUND(EXTRACT(EPOCH FROM (vc.actual_end - vc.actual_start)) / 60.0, 1)
        ELSE NULL
    END AS duration_minutes,

    -- User info
    a.full_name         AS user_name,
    a.arabic_name       AS user_arabic_name,
    a.field_role        AS user_role,

    -- Branch info
    m.branch            AS branch_name,
    m.branch_ar         AS branch_name_ar,

    -- Outcome info
    vo.outcome_status,
    vo.end_reason_custom,
    vo.ended_at

FROM visit_core vc
LEFT JOIN accounts a       ON a.id = vc.user_id
LEFT JOIN markets m        ON m.id = vc.market_id
LEFT JOIN visit_outcomes vo ON vo.visit_id = vc.id
WHERE vc.visit_date = (CURRENT_DATE - INTERVAL '1 day')::date
ORDER BY vc.actual_start DESC NULLS LAST;

-- Index for fast lookups by client_id + division_id
CREATE UNIQUE INDEX idx_mv_yesterday_visits_id ON mv_yesterday_visits (visit_id);
CREATE INDEX idx_mv_yesterday_visits_client ON mv_yesterday_visits (client_id);
CREATE INDEX idx_mv_yesterday_visits_client_div ON mv_yesterday_visits (client_id, division_id);

-- ============================================================================
-- REFRESH FUNCTION (call daily via pg_cron or Supabase Edge Function)
-- ============================================================================
CREATE OR REPLACE FUNCTION refresh_mv_yesterday_visits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_yesterday_visits;
END;
$$;

-- ============================================================================
-- OPTIONAL: pg_cron schedule (run daily at 00:15 UTC)
-- Uncomment if pg_cron is enabled in your Supabase project
-- ============================================================================
-- SELECT cron.schedule(
--     'refresh-yesterday-visits',
--     '15 0 * * *',
--     $$SELECT refresh_mv_yesterday_visits()$$
-- );

-- ============================================================================
-- TEST: Refresh now and verify
-- ============================================================================
REFRESH MATERIALIZED VIEW mv_yesterday_visits;
SELECT count(*) AS total_rows FROM mv_yesterday_visits;

-- ============================================================================
-- SECURITY: Revoke public API access (fix materialized_view_in_api warning)
-- ============================================================================
REVOKE SELECT ON mv_yesterday_visits FROM anon, authenticated;
GRANT SELECT ON mv_yesterday_visits TO postgres, service_role;
