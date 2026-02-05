-- ============================================================================
-- RPC FUNCTION: get_org_subtree (FIXED v3)
-- Purpose: Fetch complete organizational hierarchy + team memberships
-- Returns: Flat JSON array with all subordinates (includes field staff)
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
    -- Combined query with hierarchy + team memberships
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
    ),
    -- ============================================================
    -- TEAM MEMBERSHIPS: Field staff under team leaders
    -- ============================================================
    team_members AS (
        SELECT 
            a.id AS account_id,
            a.full_name,
            a.field_role,
            a.account_status,
            ot.depth + 1 AS depth,
            ot.path || a.id::text AS path,
            'membership'::TEXT AS relationship_type,
            tm.team_leader_account_id AS parent_id
        FROM org_tree ot
        JOIN public.team_memberships tm ON tm.team_leader_account_id = ot.account_id
        JOIN public.accounts a ON a.id = tm.member_account_id
        WHERE ot.field_role = 'team_leader'
          AND NOT (a.id::text = ANY(ot.path))
          AND (tm.active_to IS NULL OR tm.active_to >= CURRENT_DATE)
    ),
    -- ============================================================
    -- COMBINED: All hierarchy + team members
    -- ============================================================
    all_subordinates AS (
        SELECT * FROM org_tree WHERE depth > 0
        UNION ALL
        SELECT * FROM team_members
    )
    -- ============================================================
    -- BUILD JSON RESULT with distinct nodes
    -- ============================================================
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'account_id', sub.account_id,
                'full_name', sub.full_name,
                'field_role', sub.field_role,
                'is_active', (sub.account_status = 'active'),
                'depth', sub.depth,
                'path', array_to_string(sub.path, '/'),
                'relationship_type', sub.relationship_type,
                'parent_id', sub.parent_id
            )
            ORDER BY sub.depth, sub.full_name
        ),
        '[]'::JSONB
    ) INTO result
    FROM (
        SELECT DISTINCT ON (account_id) *
        FROM all_subordinates
        ORDER BY account_id, depth
    ) sub;
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_org_subtree(UUID) TO authenticated;

-- ============================================================================
-- EXAMPLE USAGE:
-- SELECT get_org_subtree('user-uuid-here');
-- ============================================================================
