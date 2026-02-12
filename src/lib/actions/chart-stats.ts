// ============================================================================
// SERVER ACTION: getChartStats
// Purpose: Get analytics data for Circle Charts Dashboard
// Performance: Filters visits FIRST, then aggregates - avoids huge table scans
// ============================================================================
'use server';

import { getClient } from '@/lib/db';

// ============================================================================
// TYPES
// ============================================================================
export interface ChartStatsParams {
    clientId: string;
    divisionId?: string | null;
    chainId?: string | null;
    regionId?: string | null;
    branchId?: string | null;
    teamLeaderId?: string | null;
    fieldStaffId?: string | null;
    fromDate?: string | null;
    toDate?: string | null;
}

export interface ChartStatsResult {
    // Row 1: Visit Metrics
    total_visits: number;
    completed_visits: number;
    incomplete_visits: number;
    completed_percentage: number;
    incomplete_percentage: number;

    // Row 2: Product & Time Metrics
    total_products: number;
    available_percentage: number;
    unavailable_percentage: number;
    work_time_minutes: number;
    transit_time_minutes: number; // (total app time - visit work time)

    // Row 3: Notification Metrics (Mockup)
    total_notifications: number;
    read_percentage: number;
    action_percentage: number;
    avg_action_time_seconds: number; // Time in seconds for MM:SS display
    avg_pending_time_seconds: number; // Time in seconds for MM:SS display
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================
export async function getChartStats(params: ChartStatsParams): Promise<ChartStatsResult> {
    const clientId = params.clientId;
    const divisionId = params.divisionId ?? null;
    const chainId = params.chainId ?? null;
    const regionId = params.regionId ?? null;
    const branchId = params.branchId ?? null;
    const teamLeaderId = params.teamLeaderId ?? null;
    const fieldStaffId = params.fieldStaffId ?? null;
    const fromDate = params.fromDate ?? null;
    const toDate = params.toDate ?? null;

    try {
        const sql = getClient();

        console.log('📊 Chart Stats - Params:', {
            clientId, divisionId, chainId, regionId, branchId,
            teamLeaderId, fieldStaffId, fromDate, toDate,
        });

        // =====================================================================
        // PERFORMANCE-OPTIMIZED: Simplified query structure
        // - Reduced CTEs from 6 to 3
        // - Eliminated nested subqueries
        // - Direct aggregation where possible
        // =====================================================================
        const result = await sql`
            WITH 
            -- Step 1: Get filtered visits (respects all filters)
            filtered_visits AS (
                SELECT 
                    vc.id,
                    vc.status,
                    vc.actual_start,
                    vc.actual_end,
                    vc.visit_date,
                    vc.user_id
                FROM visit_core vc
                WHERE vc.client_id = ${clientId}::uuid
                  AND (${divisionId}::uuid IS NULL OR vc.division_id = ${divisionId}::uuid)
                  AND vc.visit_date >= COALESCE(${fromDate}::date, CURRENT_DATE - INTERVAL '30 days')
                  AND vc.visit_date <= COALESCE(${toDate}::date, CURRENT_DATE)
                  AND (
                      ${chainId}::uuid IS NULL 
                      OR EXISTS (
                          SELECT 1 FROM markets m 
                          WHERE m.id = vc.market_id AND m.chain_id = ${chainId}::uuid
                      )
                  )
                  AND (
                      ${regionId}::uuid IS NULL 
                      OR EXISTS (
                          SELECT 1 FROM markets m 
                          WHERE m.id = vc.market_id AND m.region_id = ${regionId}::uuid
                      )
                  )
                  AND (${branchId}::uuid IS NULL OR vc.market_id = ${branchId}::uuid)
                  AND (
                      ${teamLeaderId}::uuid IS NULL 
                      OR vc.user_id = ${teamLeaderId}::uuid
                      OR EXISTS (
                          SELECT 1 FROM team_memberships tm 
                          WHERE tm.member_account_id = vc.user_id 
                            AND tm.team_leader_account_id = ${teamLeaderId}::uuid
                      )
                  )
                  AND (${fieldStaffId}::uuid IS NULL OR vc.user_id = ${fieldStaffId}::uuid)
            ),
            -- Step 2: All visit aggregates in one pass
            visit_agg AS (
                SELECT 
                    COUNT(*)::int as total,
                    COUNT(*) FILTER (WHERE status = 'completed')::int as completed,
                    COUNT(*) FILTER (WHERE status != 'completed')::int as incomplete,
                    COALESCE(SUM(
                        CASE WHEN actual_start IS NOT NULL AND actual_end IS NOT NULL 
                        THEN EXTRACT(EPOCH FROM (actual_end - actual_start)) / 60 
                        ELSE 0 END
                    )::int, 0) as work_time
                FROM filtered_visits
            ),
            -- Step 3: Availability stats (simple join)
            avail_agg AS (
                SELECT 
                    COUNT(*)::int as total_records,
                    COUNT(*) FILTER (WHERE ma.is_available = true)::int as available_count,
                    COUNT(*) FILTER (WHERE ma.is_available = false)::int as unavailable_count
                FROM mch_availability ma
                WHERE ma.event_id IN (
                    SELECT me.id FROM mch_events me 
                    WHERE me.visit_id IN (SELECT id FROM filtered_visits)
                )
            )
            -- Final: Single row result
            SELECT 
                va.total as total_visits,
                va.completed as completed_visits,
                va.incomplete as incomplete_visits,
                CASE WHEN va.total > 0 
                    THEN ROUND((va.completed::numeric / va.total) * 100, 1)
                    ELSE 0 
                END as completed_percentage,
                CASE WHEN va.total > 0 
                    THEN ROUND((va.incomplete::numeric / va.total) * 100, 1)
                    ELSE 0 
                END as incomplete_percentage,
                (SELECT COUNT(DISTINCT product_id)::int FROM client_products WHERE client_id = ${clientId}::uuid AND is_active = true) as total_products,
                CASE WHEN aa.total_records > 0 
                    THEN ROUND((aa.available_count::numeric / aa.total_records) * 100, 1)
                    ELSE 0 
                END as available_percentage,
                CASE WHEN aa.total_records > 0 
                    THEN ROUND((aa.unavailable_count::numeric / aa.total_records) * 100, 1)
                    ELSE 0 
                END as unavailable_percentage,
                va.work_time as work_time_minutes,
                0 as transit_time_minutes  -- Simplified: transit calculation moved to separate optimized query
            FROM visit_agg va
            CROSS JOIN avail_agg aa
        `;

        const stats = result[0];

        console.log('📊 Chart Stats - Result:', stats);

        return {
            total_visits: stats?.total_visits ?? 0,
            completed_visits: stats?.completed_visits ?? 0,
            incomplete_visits: stats?.incomplete_visits ?? 0,
            completed_percentage: Number(stats?.completed_percentage ?? 0),
            incomplete_percentage: Number(stats?.incomplete_percentage ?? 0),
            total_products: stats?.total_products ?? 0,
            available_percentage: Number(stats?.available_percentage ?? 0),
            unavailable_percentage: Number(stats?.unavailable_percentage ?? 0),
            work_time_minutes: stats?.work_time_minutes ?? 0,
            transit_time_minutes: stats?.transit_time_minutes ?? 0,
            // Row 3: Notification Metrics (Mockup - will be replaced with real data)
            total_notifications: 150,
            read_percentage: 85.5,
            action_percentage: 72.3,
            avg_action_time_seconds: 2700, // 45 minutes = 45:00
            avg_pending_time_seconds: 7200, // 120 minutes = 120:00
        };
    } catch (error) {
        console.error('❌ Chart Stats - Error:', error);
        return {
            total_visits: 0,
            completed_visits: 0,
            incomplete_visits: 0,
            completed_percentage: 0,
            incomplete_percentage: 0,
            total_products: 0,
            available_percentage: 0,
            unavailable_percentage: 0,
            work_time_minutes: 0,
            transit_time_minutes: 0,
            // Row 3: Notification Metrics (error fallback)
            total_notifications: 0,
            read_percentage: 0,
            action_percentage: 0,
            avg_action_time_seconds: 0,
            avg_pending_time_seconds: 0,
        };
    }
}
