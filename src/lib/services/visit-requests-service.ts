// Visit Requests Service — Drizzle ORM (Direct PostgreSQL, bypasses RLS)
// Uses: visit_offroute_requests + accounts tables
import { db } from '@/lib/db';
import { visitOffrouteRequests } from '@/lib/db/schema';
import { eq, and, desc, sql, type SQL } from 'drizzle-orm';
import { cache } from 'react';

// ── Pending Requests (for action tab) ──
export interface VisitRequest {
    id: string;
    requesterAccountId: string;
    requesterName: string;
    requesterArabicName: string | null;
    reasonCustom: string | null;
    status: string;
    autoApproved: boolean;
    requestedAt: string;
    source: string | null;
}

// ── All Requests (for history table) ──
export interface VisitRequestRow {
    id: string;
    requesterAccountId: string;
    requesterName: string;
    requesterArabicName: string | null;
    approverAccountId: string | null;
    approverName: string | null;
    approverArabicName: string | null;
    marketName: string | null;
    marketNameAr: string | null;
    reasonCustom: string | null;
    status: string;
    autoApproved: boolean;
    requestedAt: string;
    decidedAt: string | null;
    waitSeconds: number | null;
    source: string | null;
}

/**
 * Batch fetch account names by IDs
 */
async function getAccountNames(ids: string[]): Promise<Map<string, { fullName: string | null; arabicName: string | null }>> {
    const map = new Map<string, { fullName: string | null; arabicName: string | null }>();
    if (ids.length === 0) return map;

    const idsLiteral = `{${ids.join(',')}}`;
    const result = await db.execute(sql`
        SELECT id, full_name, arabic_name FROM accounts WHERE id = ANY(${idsLiteral}::uuid[])
    `) as unknown as { id: string; full_name: string | null; arabic_name: string | null }[];

    for (const row of result) {
        map.set(row.id, { fullName: row.full_name, arabicName: row.arabic_name });
    }
    return map;
}

/**
 * Batch fetch market (branch) names by IDs
 */
async function getMarketNames(ids: string[]): Promise<Map<string, { branch: string | null; branchAr: string | null }>> {
    const map = new Map<string, { branch: string | null; branchAr: string | null }>();
    if (ids.length === 0) return map;

    const idsLiteral = `{${ids.join(',')}}`;
    const result = await db.execute(sql`
        SELECT id, branch, branch_ar FROM markets WHERE id = ANY(${idsLiteral}::uuid[])
    `) as unknown as { id: string; branch: string | null; branch_ar: string | null }[];

    for (const row of result) {
        map.set(row.id, { branch: row.branch, branchAr: row.branch_ar });
    }
    return map;
}

/**
 * Fetch pending off-route visit requests for a client (action tab)
 */
export const getPendingRequests = cache(async (clientId: string, divisionId?: string | null): Promise<VisitRequest[]> => {
    try {
        const conditions: SQL[] = [
            eq(visitOffrouteRequests.clientId, clientId),
            eq(visitOffrouteRequests.status, 'pending'),
        ];
        if (divisionId) {
            conditions.push(eq(visitOffrouteRequests.divisionId, divisionId));
        }

        const rows = await db
            .select({
                id: visitOffrouteRequests.id,
                requesterAccountId: visitOffrouteRequests.requesterAccountId,
                reasonCustom: visitOffrouteRequests.reasonCustom,
                status: visitOffrouteRequests.status,
                autoApproved: visitOffrouteRequests.autoApproved,
                requestedAt: visitOffrouteRequests.requestedAt,
                source: visitOffrouteRequests.source,
            })
            .from(visitOffrouteRequests)
            .where(and(...conditions))
            .orderBy(desc(visitOffrouteRequests.requestedAt));

        if (rows.length === 0) return [];

        // Batch fetch requester names
        const requesterIds = [...new Set(rows.map(r => r.requesterAccountId))];
        const accountMap = await getAccountNames(requesterIds);

        return rows.map((row) => {
            const requester = accountMap.get(row.requesterAccountId);
            return {
                id: row.id,
                requesterAccountId: row.requesterAccountId,
                requesterName: requester?.fullName ?? 'Unknown',
                requesterArabicName: requester?.arabicName ?? null,
                reasonCustom: row.reasonCustom,
                status: row.status,
                autoApproved: row.autoApproved,
                requestedAt: row.requestedAt?.toISOString() ?? '',
                source: row.source,
            };
        });
    } catch (error) {
        console.error('Pending requests service error:', error);
        return [];
    }
});

/**
 * Fetch ALL off-route visit requests for a client (history table)
 * Shows all statuses with requester + approver names
 */
export const getAllRequests = cache(async (clientId: string, divisionId?: string | null): Promise<VisitRequestRow[]> => {
    try {
        const conditions: SQL[] = [eq(visitOffrouteRequests.clientId, clientId)];
        if (divisionId) {
            conditions.push(eq(visitOffrouteRequests.divisionId, divisionId));
        }

        const rows = await db
            .select({
                id: visitOffrouteRequests.id,
                requesterAccountId: visitOffrouteRequests.requesterAccountId,
                approverAccountId: visitOffrouteRequests.approverAccountId,
                marketId: visitOffrouteRequests.marketId,
                reasonCustom: visitOffrouteRequests.reasonCustom,
                status: visitOffrouteRequests.status,
                autoApproved: visitOffrouteRequests.autoApproved,
                requestedAt: visitOffrouteRequests.requestedAt,
                decidedAt: visitOffrouteRequests.decidedAt,
                waitSeconds: visitOffrouteRequests.waitSeconds,
                source: visitOffrouteRequests.source,
            })
            .from(visitOffrouteRequests)
            .where(and(...conditions))
            .orderBy(desc(visitOffrouteRequests.requestedAt))
            .limit(200);

        console.log('[DEBUG] getAllRequests via Drizzle: count=' + rows.length);

        if (rows.length === 0) return [];

        // Batch fetch account names + market names
        const accountIds = new Set<string>();
        const marketIds = new Set<string>();
        for (const row of rows) {
            accountIds.add(row.requesterAccountId);
            if (row.approverAccountId) accountIds.add(row.approverAccountId);
            if (row.marketId) marketIds.add(row.marketId);
        }

        const [accountMap, marketMap] = await Promise.all([
            getAccountNames(Array.from(accountIds)),
            getMarketNames(Array.from(marketIds)),
        ]);

        return rows.map((row) => {
            const requester = accountMap.get(row.requesterAccountId);
            const approver = row.approverAccountId ? accountMap.get(row.approverAccountId) : null;
            const market = row.marketId ? marketMap.get(row.marketId) : null;

            return {
                id: row.id,
                requesterAccountId: row.requesterAccountId,
                requesterName: requester?.fullName ?? 'Unknown',
                requesterArabicName: requester?.arabicName ?? null,
                approverAccountId: row.approverAccountId,
                approverName: approver?.fullName ?? null,
                approverArabicName: approver?.arabicName ?? null,
                marketName: market?.branch ?? null,
                marketNameAr: market?.branchAr ?? null,
                reasonCustom: row.reasonCustom,
                status: row.status,
                autoApproved: row.autoApproved,
                requestedAt: row.requestedAt?.toISOString() ?? '',
                decidedAt: row.decidedAt?.toISOString() ?? null,
                waitSeconds: row.waitSeconds,
                source: row.source,
            };
        });
    } catch (error) {
        console.error('All requests service error:', error);
        return [];
    }
});
