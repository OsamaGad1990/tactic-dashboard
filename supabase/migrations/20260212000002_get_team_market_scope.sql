-- ============================================================
-- RPC: get_team_market_scope()
-- Purpose: The "Missing Adapter" — bridges the Army (hierarchy)
--          with the Land (markets). Returns the aggregated
--          market scope of the current user's entire downline.
--
-- Strategy:
--   1. get_coordinator_deep_team_ids() → all subordinate IDs
--   2. UNION markets from two sources:
--      a) visit_schedule_rules (assigned journey plan markets)
--      b) user_allowed_markets (explicit market whitelists)
--   3. Intersect with client_markets to prevent orphan market leaks
--
-- Performance: Uses existing recursive CTE from
--              get_coordinator_deep_team_ids(). Final DISTINCT
--              on uuid is index-friendly.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_team_market_scope()
RETURNS TABLE (market_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH army AS (
    -- Step 1: Get the full downline (recursive)
    SELECT account_id FROM public.get_coordinator_deep_team_ids()
  ),
  jp_markets AS (
    -- Step 2a: Markets from active journey plans
    SELECT DISTINCT vsr.market_id
    FROM public.visit_schedule_rules vsr
    INNER JOIN army a ON vsr.user_id = a.account_id
    WHERE vsr.is_active = true
  ),
  explicit_markets AS (
    -- Step 2b: Markets from explicit user whitelists
    SELECT DISTINCT uam.market_id
    FROM public.user_allowed_markets uam
    INNER JOIN army a ON uam.user_id = a.account_id
  ),
  combined AS (
    SELECT market_id FROM jp_markets
    UNION
    SELECT market_id FROM explicit_markets
  )
  -- Step 3: Only return markets that belong to the user's client
  SELECT DISTINCT c.market_id
  FROM combined c
  INNER JOIN public.client_markets cm ON cm.market_id = c.market_id
  INNER JOIN public.client_users cu ON cu.client_id = cm.client_id
  INNER JOIN public.accounts acc ON acc.id = cu.user_id
  WHERE acc.auth_user_id = auth.uid()
    AND cu.is_active = true;
$$;

-- Grant access to authenticated users only
GRANT EXECUTE ON FUNCTION public.get_team_market_scope() TO authenticated;

-- Revoke from anon for security
REVOKE EXECUTE ON FUNCTION public.get_team_market_scope() FROM anon;
