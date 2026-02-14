// Break Requests Service — Drizzle ORM (Direct PostgreSQL, bypasses RLS)
// Uses: visit_break_requests + accounts tables
import { db } from '@/lib/db';
import { visitBreakRequests } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { cache } from 'react';

// ── Break Request (for pending tab) ──
export interface BreakRequest {
    id: string;
    userId: string;
    userName: string;
    userArabicName: string | null;
    requestedMinutes: number;
    status: string;
    createdAt: string;
}

// ── Break Request Row (for history table) ──
export interface BreakRequestRow {
    id: string;
    userId: string;
    userName: string;
    userArabicName: string | null;
    requestedMinutes: number;
    rejectionReason: string | null;
    status: string;
    approverName: string | null;
    approverArabicName: string | null;
    createdAt: string;
    updatedAt: string | null;
}

/** Helper: build sql`${id}::uuid, ...` for WHERE ... IN (...) */
function sqlUuidList(ids: string[]) {
    return sql.join(ids.map(id => sql`${id}::uuid`), sql`, `);
}

/**
 * Batch fetch account names by IDs
 */
async function getAccountNames(ids: string[]): Promise<Map<string, { fullName: string | null; arabicName: string | null }>> {
    const map = new Map<string, { fullName: string | null; arabicName: string | null }>();
    if (ids.length === 0) return map;

    const rows = await db.execute(sql`
        SELECT id, full_name, arabic_name FROM accounts WHERE id IN (${sqlUuidList(ids)})
    `) as unknown as { id: string; full_name: string | null; arabic_name: string | null }[];

    for (const row of rows) {
        map.set(row.id, { fullName: row.full_name, arabicName: row.arabic_name });
    }
    return map;
}

/**
 * Fetch pending break requests for a client
 */
export const getPendingBreakRequests = cache(async (clientId: string, divisionId?: string | null): Promise<BreakRequest[]> => {
    try {
        const conditions = [
            eq(visitBreakRequests.clientId, clientId),
            eq(visitBreakRequests.status, 'pending'),
        ];

        const rows = await db
            .select({
                id: visitBreakRequests.id,
                userId: visitBreakRequests.userId,
                requestedMinutes: visitBreakRequests.requestedMinutes,
                status: visitBreakRequests.status,
                createdAt: visitBreakRequests.createdAt,
            })
            .from(visitBreakRequests)
            .where(and(...conditions))
            .orderBy(desc(visitBreakRequests.createdAt))
            .limit(100);

        if (rows.length === 0) return [];

        // Batch fetch user names
        const userIds = [...new Set(rows.map(r => r.userId))];
        const accountMap = await getAccountNames(userIds);

        return rows.map((row) => {
            const user = accountMap.get(row.userId);
            return {
                id: row.id,
                userId: row.userId,
                userName: user?.fullName ?? 'Unknown',
                userArabicName: user?.arabicName ?? null,
                requestedMinutes: row.requestedMinutes ? parseInt(row.requestedMinutes, 10) : 0,
                status: row.status,
                createdAt: row.createdAt?.toISOString() ?? '',
            };
        });
    } catch (error) {
        console.error('Pending break requests service error:', error);
        return [];
    }
});

/**
 * Fetch ALL break requests for a client (history)
 */
export const getAllBreakRequests = cache(async (clientId: string, divisionId?: string | null): Promise<BreakRequestRow[]> => {
    try {
        const conditions = [eq(visitBreakRequests.clientId, clientId)];

        const rows = await db
            .select({
                id: visitBreakRequests.id,
                userId: visitBreakRequests.userId,
                requestedMinutes: visitBreakRequests.requestedMinutes,
                rejectionReason: visitBreakRequests.rejectionReason,
                status: visitBreakRequests.status,
                approverId: visitBreakRequests.approverId,
                createdAt: visitBreakRequests.createdAt,
                updatedAt: visitBreakRequests.updatedAt,
            })
            .from(visitBreakRequests)
            .where(and(...conditions))
            .orderBy(desc(visitBreakRequests.createdAt))
            .limit(300);

        if (rows.length === 0) return [];

        // Batch fetch account names (users + approvers)
        const accountIds = new Set<string>();
        for (const row of rows) {
            accountIds.add(row.userId);
            if (row.approverId) accountIds.add(row.approverId);
        }

        const accountMap = await getAccountNames(Array.from(accountIds));

        return rows.map((row) => {
            const user = accountMap.get(row.userId);
            const approver = row.approverId ? accountMap.get(row.approverId) : null;
            return {
                id: row.id,
                userId: row.userId,
                userName: user?.fullName ?? 'Unknown',
                userArabicName: user?.arabicName ?? null,
                requestedMinutes: row.requestedMinutes ? parseInt(row.requestedMinutes, 10) : 0,
                rejectionReason: row.rejectionReason,
                status: row.status,
                approverName: approver?.fullName ?? null,
                approverArabicName: approver?.arabicName ?? null,
                createdAt: row.createdAt?.toISOString() ?? '',
                updatedAt: row.updatedAt?.toISOString() ?? null,
            };
        });
    } catch (error) {
        console.error('All break requests service error:', error);
        return [];
    }
});
