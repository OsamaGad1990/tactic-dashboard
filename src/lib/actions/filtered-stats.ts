// ============================================================================
// SERVER ACTION: getFilteredStats
// Purpose: Get dashboard stats with FULL BI-DIRECTIONAL CASCADING
// Each filter affects ALL stats, ALL stats reflect ALL filters
// ============================================================================
'use server';

import { getClient } from '@/lib/db';

export interface FilteredStatsParams {
    clientId: string;
    chainId?: string | null;
    regionId?: string | null;
    branchId?: string | null;
    teamLeaderId?: string | null;
    fieldStaffId?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
}

export interface FilteredStatsResult {
    team_members: number;
    active_markets: number;
    products: number;
    today_visits: number;
}

export async function getFilteredStats(params: FilteredStatsParams): Promise<FilteredStatsResult> {
    // Ensure all values are string | null (not undefined)
    const clientId = params.clientId;
    const chainId = params.chainId ?? null;
    const regionId = params.regionId ?? null;
    const branchId = params.branchId ?? null;
    const teamLeaderId = params.teamLeaderId ?? null;
    const fieldStaffId = params.fieldStaffId ?? null;
    const fromDate = params.fromDate ?? null;
    const toDate = params.toDate ?? null;

    try {
        const sql = getClient();

        // DEBUG: Log params received
        console.log('🔍 Server Action - Params:', {
            clientId, chainId, regionId, branchId,
            teamLeaderId, fieldStaffId, fromDate, toDate,
        });

        // =====================================================================
        // FULL BI-DIRECTIONAL CASCADING SQL
        // Each stat is filtered by ALL dimensions
        // =====================================================================
        const result = await sql`
            WITH 
            -- Base: All markets for this client with chain/region filters
            filtered_markets AS (
                SELECT m.id as market_id, m.chain_id, m.region_id
                FROM markets m
                JOIN client_markets cm ON cm.market_id = m.id
                WHERE cm.client_id = ${clientId}::uuid
                  AND (${chainId}::uuid IS NULL OR m.chain_id = ${chainId}::uuid)
                  AND (${regionId}::uuid IS NULL OR m.region_id = ${regionId}::uuid)
                  AND (${branchId}::uuid IS NULL OR m.id = ${branchId}::uuid)
            ),
            -- Base: All users who have visited filtered markets (or all if no market filter)
            filtered_users AS (
                SELECT DISTINCT a.id as user_id
                FROM accounts a
                JOIN client_users cu ON cu.user_id = a.id
                LEFT JOIN team_memberships tm ON tm.member_account_id = a.id
                WHERE cu.client_id = ${clientId}::uuid
                  AND (${teamLeaderId}::uuid IS NULL OR tm.team_leader_account_id = ${teamLeaderId}::uuid)
                  AND (${fieldStaffId}::uuid IS NULL OR a.id = ${fieldStaffId}::uuid)
                  -- If any market filter is set, only include users who visited those markets
                  AND (
                      (${chainId}::uuid IS NULL AND ${regionId}::uuid IS NULL AND ${branchId}::uuid IS NULL)
                      OR EXISTS (
                          SELECT 1 FROM visit_core vc
                          JOIN filtered_markets fm ON fm.market_id = vc.market_id
                          WHERE vc.user_id = a.id AND vc.client_id = ${clientId}::uuid
                      )
                  )
            ),
            -- Markets filtered by user selection (if user selected, only their markets)
            user_filtered_markets AS (
                SELECT DISTINCT fm.market_id
                FROM filtered_markets fm
                WHERE (${teamLeaderId}::uuid IS NULL AND ${fieldStaffId}::uuid IS NULL)
                   OR EXISTS (
                       SELECT 1 FROM visit_core vc
                       JOIN filtered_users fu ON fu.user_id = vc.user_id
                       WHERE vc.market_id = fm.market_id AND vc.client_id = ${clientId}::uuid
                   )
            )
            SELECT 
                -- TEAM MEMBERS: Count users in filtered_users
                (SELECT COUNT(*) FROM filtered_users)::int as team_members,
                
                -- ACTIVE MARKETS: Count markets filtered by both location AND user filters
                (SELECT COUNT(*) FROM user_filtered_markets)::int as active_markets,
                
                -- PRODUCTS: Count products available in filtered markets
                (
                    SELECT COUNT(DISTINCT cp.id)
                    FROM client_products cp
                    WHERE cp.client_id = ${clientId}::uuid
                      -- If market filters are set, only count products for those markets
                      AND (
                          (${chainId}::uuid IS NULL AND ${regionId}::uuid IS NULL AND ${branchId}::uuid IS NULL)
                          OR EXISTS (
                              SELECT 1 FROM user_filtered_markets ufm
                          )
                      )
                )::int as products,
                
                -- TODAY VISITS: Count visits matching ALL filters
                (
                    SELECT COUNT(DISTINCT vc.id)
                    FROM visit_core vc
                    JOIN user_filtered_markets ufm ON ufm.market_id = vc.market_id
                    JOIN filtered_users fu ON fu.user_id = vc.user_id
                    WHERE vc.client_id = ${clientId}::uuid
                      AND vc.visit_date >= COALESCE(${fromDate}::date, CURRENT_DATE)
                      AND vc.visit_date <= COALESCE(${toDate}::date, CURRENT_DATE)
                )::int as today_visits
        `;

        const stats = result[0];

        // DEBUG: Log result
        console.log('📊 Server Action - Result:', stats);

        return {
            team_members: stats?.team_members ?? 0,
            active_markets: stats?.active_markets ?? 0,
            products: stats?.products ?? 0,
            today_visits: stats?.today_visits ?? 0,
        };
    } catch (error) {
        console.error('❌ Server Action - Error:', error);
        return {
            team_members: 0,
            active_markets: 0,
            products: 0,
            today_visits: 0,
        };
    }
}
