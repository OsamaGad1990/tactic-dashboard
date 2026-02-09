import { cache } from 'react';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// Re-export types and pure functions from shared file
export type { YesterdayVisit, YesterdayVisitsStats } from '@/lib/types/yesterday-visits';
export { computeYesterdayStats } from '@/lib/types/yesterday-visits';

// Import type for internal use
import type { YesterdayVisit } from '@/lib/types/yesterday-visits';

/**
 * Fetch yesterday's visits from the materialized view.
 * Scoped by client_id and optionally division_id.
 */
export const getYesterdayVisits = cache(async (
    clientId: string,
    divisionId?: string | null,
): Promise<YesterdayVisit[]> => {
    try {
        const divisionFilter = divisionId
            ? sql`AND division_id = ${divisionId}::uuid`
            : sql``;

        const rows = await db.execute(sql`
            SELECT
                visit_id,
                client_id,
                division_id,
                user_id,
                market_id,
                visit_date,
                status,
                actual_start,
                actual_end,
                planned_start,
                planned_end,
                source,
                is_out_of_range,
                trust_score,
                duration_minutes,
                user_name,
                user_arabic_name,
                user_role,
                branch_name,
                branch_name_ar,
                outcome_status,
                end_reason_custom,
                ended_at
            FROM mv_yesterday_visits
            WHERE client_id = ${clientId}::uuid
              ${divisionFilter}
            ORDER BY actual_start DESC NULLS LAST
        `);

        return (rows as unknown as Record<string, unknown>[]).map((r) => ({
            visitId: r.visit_id as string,
            clientId: r.client_id as string,
            divisionId: r.division_id as string | null,
            userId: r.user_id as string,
            marketId: r.market_id as string,
            visitDate: r.visit_date as string,
            status: r.status as string,
            actualStart: r.actual_start as string | null,
            actualEnd: r.actual_end as string | null,
            plannedStart: r.planned_start as string | null,
            plannedEnd: r.planned_end as string | null,
            source: r.source as string,
            isOutOfRange: r.is_out_of_range as boolean | null,
            trustScore: r.trust_score ? Number(r.trust_score) : null,
            durationMinutes: r.duration_minutes ? Number(r.duration_minutes) : null,
            userName: r.user_name as string | null,
            userArabicName: r.user_arabic_name as string | null,
            userRole: r.user_role as string | null,
            branchName: r.branch_name as string | null,
            branchNameAr: r.branch_name_ar as string | null,
            outcomeStatus: r.outcome_status as string | null,
            endReasonCustom: r.end_reason_custom as string | null,
            endedAt: r.ended_at as string | null,
        }));
    } catch (error) {
        console.error('Yesterday visits service error:', error);
        return [];
    }
});
