-- ============================================================================
-- RPC FUNCTION: get_filtered_stats
-- Purpose: Get dashboard stats filtered by all filter parameters
-- Returns: JSON with team_members, active_markets, products, today_visits
-- ============================================================================

DROP FUNCTION IF EXISTS get_filtered_stats(UUID, UUID, UUID, UUID, UUID, UUID, UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION get_filtered_stats(
    p_client_id UUID,
    p_chain_id UUID DEFAULT NULL,
    p_region_id UUID DEFAULT NULL,
    p_branch_id UUID DEFAULT NULL,
    p_team_leader_id UUID DEFAULT NULL,
    p_field_staff_id UUID DEFAULT NULL,
    p_from_date DATE DEFAULT NULL,
    p_to_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_team_members INT;
    v_active_markets INT;
    v_products INT;
    v_today_visits INT;
BEGIN
    -- ========================================================================
    -- TEAM MEMBERS COUNT
    -- Filters: team_leader, field_staff
    -- ========================================================================
    SELECT COUNT(DISTINCT a.id) INTO v_team_members
    FROM public.accounts a
    JOIN public.client_users cu ON cu.account_id = a.id
    LEFT JOIN public.team_memberships tm ON tm.member_account_id = a.id
    WHERE cu.client_id = p_client_id
      AND (p_team_leader_id IS NULL OR tm.team_leader_account_id = p_team_leader_id)
      AND (p_field_staff_id IS NULL OR a.id = p_field_staff_id);

    -- ========================================================================
    -- ACTIVE MARKETS COUNT  
    -- Filters: chain, region, branch
    -- ========================================================================
    SELECT COUNT(DISTINCT m.id) INTO v_active_markets
    FROM public.markets m
    JOIN public.client_markets cm ON cm.market_id = m.id
    WHERE cm.client_id = p_client_id
      AND (p_chain_id IS NULL OR m.chain_id = p_chain_id)
      AND (p_region_id IS NULL OR m.region_id = p_region_id)
      AND (p_branch_id IS NULL OR m.id = p_branch_id);

    -- ========================================================================
    -- PRODUCTS COUNT
    -- Priority: market > chain > general (null, null)
    -- Filters: chain, branch (market), region
    -- ========================================================================
    SELECT COUNT(DISTINCT cp.id) INTO v_products
    FROM public.client_products cp
    LEFT JOIN public.product_client_availability_v2 pca ON pca.product_id = cp.product_id AND pca.client_id = p_client_id
    WHERE cp.client_id = p_client_id
      AND (
          -- If branch (market) selected, get market-specific products
          (p_branch_id IS NOT NULL AND pca.market_id = p_branch_id)
          -- If chain selected (no branch), get chain-specific products
          OR (p_branch_id IS NULL AND p_chain_id IS NOT NULL AND pca.chain_id = p_chain_id AND pca.market_id IS NULL)
          -- If no chain/branch selected, get all products (general + chain + market)
          OR (p_chain_id IS NULL AND p_branch_id IS NULL)
      );

    -- ========================================================================
    -- TODAY VISITS COUNT
    -- Filters: chain, region, branch, team_leader, field_staff, date_range
    -- ========================================================================
    SELECT COUNT(DISTINCT vc.id) INTO v_today_visits
    FROM public.visit_core vc
    LEFT JOIN public.markets m ON m.id = vc.market_id
    LEFT JOIN public.team_memberships tm ON tm.member_account_id = vc.account_id
    WHERE vc.client_id = p_client_id
      -- Date filter (defaults to today if not specified)
      AND vc.visit_date >= COALESCE(p_from_date, CURRENT_DATE)
      AND vc.visit_date <= COALESCE(p_to_date, CURRENT_DATE)
      -- Chain filter
      AND (p_chain_id IS NULL OR m.chain_id = p_chain_id)
      -- Region filter
      AND (p_region_id IS NULL OR m.region_id = p_region_id)
      -- Branch filter
      AND (p_branch_id IS NULL OR vc.market_id = p_branch_id)
      -- Team leader filter
      AND (p_team_leader_id IS NULL OR tm.team_leader_account_id = p_team_leader_id)
      -- Field staff filter
      AND (p_field_staff_id IS NULL OR vc.account_id = p_field_staff_id);

    -- ========================================================================
    -- RETURN JSON RESULT
    -- ========================================================================
    RETURN jsonb_build_object(
        'team_members', COALESCE(v_team_members, 0),
        'active_markets', COALESCE(v_active_markets, 0),
        'products', COALESCE(v_products, 0),
        'today_visits', COALESCE(v_today_visits, 0)
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_filtered_stats(UUID, UUID, UUID, UUID, UUID, UUID, DATE, DATE) TO authenticated;

-- ============================================================================
-- EXAMPLE USAGE:
-- SELECT get_filtered_stats('client-uuid');
-- SELECT get_filtered_stats('client-uuid', chain_id := 'chain-uuid');
-- SELECT get_filtered_stats('client-uuid', p_from_date := '2026-01-01', p_to_date := '2026-01-31');
-- ============================================================================
