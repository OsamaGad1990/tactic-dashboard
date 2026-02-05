-- ============================================================================
-- RPC FUNCTION: get_org_subtree (FIXED v2)
-- Purpose: Fetch complete organizational hierarchy for dashboard filters
-- Returns: Flat JSON array with all subordinates
-- ============================================================================

DROP FUNCTION IF EXISTS get_org_subtree(UUID);

CREATE OR REPLACE FUNCTION get_org_subtree(root_account_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Use a single recursive CTE with UNION ALL
    WITH RECURSIVE org_tree AS (
        -- ============================================================
        -- BASE CASE: The root user
        -- ============================================================
        SELECT 
            a.id AS account_id,
            a.full_name,
            a.field_role,
            a.account_status,
            0 AS depth,
            ARRAY[a.id::text] AS path,
            'root'::TEXT AS relationship_type,
            NULL::UUID AS parent_id
        FROM public.accounts a
        WHERE a.id = root_account_id
        
        UNION ALL
        
        -- ============================================================
        -- RECURSIVE: Administrative Hierarchy (client_portal_hierarchy)
        -- ============================================================
        SELECT 
            a.id AS account_id,
            a.full_name,
            a.field_role,
            a.account_status,
            t.depth + 1,
            t.path || a.id::text,
            'hierarchy'::TEXT AS relationship_type,
            cph.parent_account_id AS parent_id
        FROM org_tree t
        JOIN public.client_portal_hierarchy cph ON cph.parent_account_id = t.account_id
        JOIN public.accounts a ON a.id = cph.child_account_id
        WHERE NOT (a.id::text = ANY(t.path))
          AND t.depth < 10  -- Prevent infinite loops
    )
    -- ============================================================
    -- BUILD JSON RESULT with distinct nodes
    -- ============================================================
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'account_id', ot.account_id,
                'full_name', ot.full_name,
                'field_role', ot.field_role,
                'is_active', (ot.account_status = 'active'),
                'depth', ot.depth,
                'path', array_to_string(ot.path, '/'),
                'relationship_type', ot.relationship_type,
                'parent_id', ot.parent_id
            )
            ORDER BY ot.depth, ot.full_name
        ),
        '[]'::JSONB
    ) INTO result
    FROM (
        SELECT DISTINCT ON (account_id) *
        FROM org_tree
        ORDER BY account_id, depth
    ) ot
    WHERE ot.depth > 0;
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_org_subtree(UUID) TO authenticated;

-- ============================================================================
-- EXAMPLE USAGE:
-- SELECT get_org_subtree('user-uuid-here');
-- ============================================================================
