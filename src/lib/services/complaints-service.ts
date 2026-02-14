// Complaints Service — Drizzle ORM (Direct PostgreSQL, bypasses RLS)
// Uses: complaints + complaint_targets + complaint_timeline + accounts + markets + client_divisions + categories
import { db } from '@/lib/db';
import { complaints, complaintTimeline } from '@/lib/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { cache } from 'react';

// ── Complaint Row (for table display) ──
export interface ComplaintRow {
    id: string;
    requesterId: string;
    requesterName: string;
    requesterArabicName: string | null;
    currentAssigneeId: string | null;
    assigneeName: string | null;
    assigneeArabicName: string | null;
    divisionName: string | null;
    divisionNameAr: string | null;
    marketId: string | null;
    marketName: string | null;
    marketNameAr: string | null;
    categoryName: string | null;
    categoryNameAr: string | null;
    description: string;
    status: string | null;
    photos: string[] | null;
    slaDeadline: string;
    createdAt: string;
    updatedAt: string | null;
    targetCount: number;
    timelineCount: number;
    /** IDs of users this complaint is about (المشكو ضدهم) */
    targetAccountIds: string[];
}

// ── Timeline Entry ──
export interface TimelineEntry {
    id: string;
    actorName: string | null;
    actorArabicName: string | null;
    actionType: string;
    messageEn: string | null;
    messageAr: string | null;
    notes: string | null;
    evidencePhoto: string | null;
    createdAt: string;
}

/** Helper: build a sql`${id}::uuid, ...` fragment for use in WHERE ... IN (...) */
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
 * Batch fetch market names by IDs
 */
async function getMarketNames(ids: string[]): Promise<Map<string, { branch: string | null; branchAr: string | null }>> {
    const map = new Map<string, { branch: string | null; branchAr: string | null }>();
    if (ids.length === 0) return map;

    const rows = await db.execute(sql`
        SELECT id, branch, branch_ar FROM markets WHERE id IN (${sqlUuidList(ids)})
    `) as unknown as { id: string; branch: string | null; branch_ar: string | null }[];

    for (const row of rows) {
        map.set(row.id, { branch: row.branch, branchAr: row.branch_ar });
    }
    return map;
}

/**
 * Batch fetch division names by IDs
 */
async function getDivisionNames(ids: string[]): Promise<Map<string, { name: string | null; nameAr: string | null }>> {
    const map = new Map<string, { name: string | null; nameAr: string | null }>();
    if (ids.length === 0) return map;

    const rows = await db.execute(sql`
        SELECT id, name_en, name_ar FROM client_divisions WHERE id IN (${sqlUuidList(ids)})
    `) as unknown as { id: string; name_en: string | null; name_ar: string | null }[];

    for (const row of rows) {
        map.set(row.id, { name: row.name_en, nameAr: row.name_ar });
    }
    return map;
}

/**
 * Batch fetch category names by IDs
 */
async function getCategoryNames(ids: string[]): Promise<Map<string, { name: string | null; nameAr: string | null }>> {
    const map = new Map<string, { name: string | null; nameAr: string | null }>();
    if (ids.length === 0) return map;

    const rows = await db.execute(sql`
        SELECT id, name_en, name_ar FROM categories WHERE id IN (${sqlUuidList(ids)})
    `) as unknown as { id: string; name_en: string | null; name_ar: string | null }[];

    for (const row of rows) {
        map.set(row.id, { name: row.name_en, nameAr: row.name_ar });
    }
    return map;
}

/**
 * Fetch all complaints for a client
 */
export const getComplaints = cache(async (clientId: string, divisionId?: string | null): Promise<ComplaintRow[]> => {
    try {
        // Build WHERE conditions: always filter by client_id, optionally by division_id
        const conditions = [eq(complaints.clientId, clientId)];
        if (divisionId) {
            conditions.push(eq(complaints.divisionId, divisionId));
        }

        const rows = await db
            .select({
                id: complaints.id,
                requesterId: complaints.requesterId,
                currentAssigneeId: complaints.currentAssigneeId,
                divisionId: complaints.divisionId,
                marketId: complaints.marketId,
                category: complaints.category,
                description: complaints.description,
                status: complaints.status,
                photos: complaints.photos,
                slaDeadline: complaints.slaDeadline,
                createdAt: complaints.createdAt,
                updatedAt: complaints.updatedAt,
            })
            .from(complaints)
            .where(and(...conditions))
            .orderBy(desc(complaints.createdAt))
            .limit(300);

        if (rows.length === 0) return [];

        // Collect IDs for batch fetching
        const accountIds = new Set<string>();
        const marketIds = new Set<string>();
        const divisionIds = new Set<string>();
        const categoryIds = new Set<string>();
        const complaintIds = rows.map(r => r.id);

        for (const row of rows) {
            accountIds.add(row.requesterId);
            if (row.currentAssigneeId) accountIds.add(row.currentAssigneeId);
            if (row.marketId) marketIds.add(row.marketId);
            divisionIds.add(row.divisionId);
            if (row.category) categoryIds.add(row.category);
        }

        // Fetch all related data in parallel
        const [accountMap, marketMap, divisionMap, categoryMap, targets, timeline] = await Promise.all([
            getAccountNames(Array.from(accountIds)),
            getMarketNames(Array.from(marketIds)),
            getDivisionNames(Array.from(divisionIds)),
            getCategoryNames(Array.from(categoryIds)),
            db.execute(sql`
                SELECT complaint_id, account_id FROM complaint_targets WHERE complaint_id IN (${sqlUuidList(complaintIds)})
            `) as unknown as Promise<{ complaint_id: string; account_id: string }[]>,
            db.execute(sql`
                SELECT complaint_id FROM complaint_timeline WHERE complaint_id IN (${sqlUuidList(complaintIds)})
            `) as unknown as Promise<{ complaint_id: string }[]>,
        ]);

        // Count targets/timeline per complaint + collect target account IDs
        const targetCountMap = new Map<string, number>();
        const targetAccountIdsMap = new Map<string, string[]>();
        for (const t of targets) {
            targetCountMap.set(t.complaint_id, (targetCountMap.get(t.complaint_id) ?? 0) + 1);
            const existing = targetAccountIdsMap.get(t.complaint_id) ?? [];
            existing.push(t.account_id);
            targetAccountIdsMap.set(t.complaint_id, existing);
        }
        const timelineCountMap = new Map<string, number>();
        for (const t of timeline) {
            timelineCountMap.set(t.complaint_id, (timelineCountMap.get(t.complaint_id) ?? 0) + 1);
        }

        return rows.map((row) => {
            const requester = accountMap.get(row.requesterId);
            const assignee = row.currentAssigneeId ? accountMap.get(row.currentAssigneeId) : null;
            const market = row.marketId ? marketMap.get(row.marketId) : null;
            const division = divisionMap.get(row.divisionId);
            const cat = row.category ? categoryMap.get(row.category) : null;

            return {
                id: row.id,
                requesterId: row.requesterId,
                requesterName: requester?.fullName ?? 'Unknown',
                requesterArabicName: requester?.arabicName ?? null,
                currentAssigneeId: row.currentAssigneeId,
                assigneeName: assignee?.fullName ?? null,
                assigneeArabicName: assignee?.arabicName ?? null,
                divisionName: division?.name ?? null,
                divisionNameAr: division?.nameAr ?? null,
                marketId: row.marketId,
                marketName: market?.branch ?? null,
                marketNameAr: market?.branchAr ?? null,
                categoryName: cat?.name ?? null,
                categoryNameAr: cat?.nameAr ?? null,
                description: row.description,
                status: row.status,
                photos: row.photos,
                slaDeadline: row.slaDeadline?.toISOString() ?? '',
                createdAt: row.createdAt?.toISOString() ?? '',
                updatedAt: row.updatedAt?.toISOString() ?? null,
                targetCount: targetCountMap.get(row.id) ?? 0,
                timelineCount: timelineCountMap.get(row.id) ?? 0,
                targetAccountIds: targetAccountIdsMap.get(row.id) ?? [],
            };
        });
    } catch (error) {
        console.error('Complaints service error:', error);
        return [];
    }
});

/**
 * Fetch timeline entries for a specific complaint
 */
export const getComplaintTimeline = cache(async (complaintId: string): Promise<TimelineEntry[]> => {
    try {
        const rows = await db
            .select({
                id: complaintTimeline.id,
                actorId: complaintTimeline.actorId,
                actionType: complaintTimeline.actionType,
                messageEn: complaintTimeline.messageEn,
                messageAr: complaintTimeline.messageAr,
                notes: complaintTimeline.notes,
                evidencePhoto: complaintTimeline.evidencePhoto,
                createdAt: complaintTimeline.createdAt,
            })
            .from(complaintTimeline)
            .where(eq(complaintTimeline.complaintId, complaintId))
            .orderBy(desc(complaintTimeline.createdAt));

        if (rows.length === 0) return [];

        // Batch fetch actor names
        const actorIds = [...new Set(rows.map(r => r.actorId).filter(Boolean) as string[])];
        const accountMap = await getAccountNames(actorIds);

        return rows.map((row) => {
            const actor = row.actorId ? accountMap.get(row.actorId) : null;
            return {
                id: row.id,
                actorName: actor?.fullName ?? null,
                actorArabicName: actor?.arabicName ?? null,
                actionType: row.actionType,
                messageEn: row.messageEn,
                messageAr: row.messageAr,
                notes: row.notes,
                evidencePhoto: row.evidencePhoto,
                createdAt: row.createdAt?.toISOString() ?? '',
            };
        });
    } catch (error) {
        console.error('Complaint timeline service error:', error);
        return [];
    }
});
