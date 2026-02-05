-- ============================================================================
-- RPC FUNCTION: get_dashboard_filters (CLIENT-SCOPED)
-- Purpose: Fetch filter options SCOPED TO THE CLIENT
-- Returns: Consolidated JSON with chains, regions, branches for THIS client only
-- ============================================================================

DROP FUNCTION IF EXISTS get_dashboard_filters(UUID, UUID, UUID, UUID);

CREATE OR REPLACE FUNCTION get_dashboard_filters(
    p_user_account_id UUID,
    p_client_id UUID,
    p_selected_chain_id UUID DEFAULT NULL,
    p_selected_region_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result JSONB;
    v_chains JSONB;
    v_regions JSONB;
    v_branches JSONB;
BEGIN
    -- ============================================================
    -- CHAINS: Get chains that have markets linked to THIS client
    -- ============================================================
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', c.id,
                'name', c.name_en,
                'name_ar', c.name_ar
            )
            ORDER BY c.name_en
        ),
        '[]'::JSONB
    ) INTO v_chains
    FROM public.chains c
    WHERE EXISTS (
        -- Only chains with markets that belong to this client
        SELECT 1 FROM public.markets m
        JOIN public.client_markets cm ON cm.market_id = m.id
        WHERE m.chain_id = c.id 
          AND cm.client_id = p_client_id
    )
    AND (
        -- If region selected, filter chains that have markets in that region
        p_selected_region_id IS NULL 
        OR EXISTS (
            SELECT 1 FROM public.markets m 
            JOIN public.client_markets cm ON cm.market_id = m.id
            WHERE m.chain_id = c.id 
              AND m.region_id = p_selected_region_id
              AND cm.client_id = p_client_id
        )
    );
    
    -- ============================================================
    -- REGIONS: Get regions that have markets linked to THIS client
    -- ============================================================
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', r.id,
                'name', r.name_en,
                'name_ar', r.name_ar
            )
            ORDER BY r.name_en
        ),
        '[]'::JSONB
    ) INTO v_regions
    FROM public.regions r
    WHERE EXISTS (
        -- Only regions with markets that belong to this client
        SELECT 1 FROM public.markets m
        JOIN public.client_markets cm ON cm.market_id = m.id
        WHERE m.region_id = r.id 
          AND cm.client_id = p_client_id
    )
    AND (
        -- If chain selected, filter regions that have markets for that chain
        p_selected_chain_id IS NULL 
        OR EXISTS (
            SELECT 1 FROM public.markets m 
            JOIN public.client_markets cm ON cm.market_id = m.id
            WHERE m.region_id = r.id 
              AND m.chain_id = p_selected_chain_id
              AND cm.client_id = p_client_id
        )
    );
    
    -- ============================================================
    -- BRANCHES (Markets): Get markets belonging to THIS client
    -- ============================================================
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', m.id,
                'name', m.branch,
                'name_ar', m.branch_ar,
                'chain_id', m.chain_id,
                'region_id', m.region_id
            )
            ORDER BY m.branch
        ),
        '[]'::JSONB
    ) INTO v_branches
    FROM public.markets m
    JOIN public.client_markets cm ON cm.market_id = m.id
    WHERE cm.client_id = p_client_id
      AND (p_selected_chain_id IS NULL OR m.chain_id = p_selected_chain_id)
      AND (p_selected_region_id IS NULL OR m.region_id = p_selected_region_id);
    
    -- ============================================================
    -- BUILD CONSOLIDATED RESULT
    -- ============================================================
    result := jsonb_build_object(
        'chains', v_chains,
        'regions', v_regions,
        'branches', v_branches
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_filters(UUID, UUID, UUID, UUID) TO authenticated;

-- ============================================================================
-- EXAMPLE USAGE:
-- SELECT get_dashboard_filters('user-uuid', 'client-uuid');
-- ============================================================================
