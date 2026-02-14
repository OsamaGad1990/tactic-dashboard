'use server';

import { getComplaintTimeline } from '@/lib/services/complaints-service';
import type { TimelineEntry } from '@/lib/services/complaints-service';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getClient } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function fetchComplaintTimeline(complaintId: string): Promise<{ data: TimelineEntry[] | null; error: string | null }> {
    try {
        const timeline = await getComplaintTimeline(complaintId);
        return { data: timeline, error: null };
    } catch (error) {
        console.error('Failed to fetch complaint timeline:', error);
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

/**
 * Approve the resolution of a complaint (Manager confirms the fix)
 */
export async function approveComplaintResolution(complaintId: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const user = await getPortalUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const pgClient = getClient();

        // Update complaint status via raw postgres.js client
        await pgClient`
            UPDATE complaints
            SET status = 'closed', updated_at = NOW()
            WHERE id = ${complaintId}
        `;

        // Add timeline entry
        await pgClient`
            INSERT INTO complaint_timeline (id, complaint_id, actor_id, action_type, message_en, message_ar, created_at)
            VALUES (gen_random_uuid(), ${complaintId}, ${user.id}, 'APPROVED_BY_MANAGER', 'Resolution approved by manager', 'تم الموافقة على الحل من قبل المدير', NOW())
        `;

        revalidatePath('/[locale]/dashboard/company/complaints', 'page');
        return { success: true, error: null };
    } catch (error: unknown) {
        console.error('[COMPLAINT ACTION] ❌ Approve error:', error);
        const msg = error instanceof Error ? error.message : String(error);
        return { success: false, error: msg };
    }
}

/**
 * Resolve a complaint directly (for escalated complaints assigned to the current user)
 */
export async function resolveComplaint(complaintId: string, notes?: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const user = await getPortalUser();
        if (!user) return { success: false, error: 'Unauthorized' };

        const pgClient = getClient();

        // Update complaint status
        await pgClient`
            UPDATE complaints
            SET status = 'closed', current_assignee_id = ${user.id}, updated_at = NOW()
            WHERE id = ${complaintId}
        `;

        // Add timeline entry
        await pgClient`
            INSERT INTO complaint_timeline (id, complaint_id, actor_id, action_type, message_en, message_ar, notes, created_at)
            VALUES (gen_random_uuid(), ${complaintId}, ${user.id}, 'RESOLVED_BY_ASSIGNEE', 'Complaint resolved', 'تم حل الشكوى', ${notes || null}, NOW())
        `;

        revalidatePath('/[locale]/dashboard/company/complaints', 'page');
        return { success: true, error: null };
    } catch (error: unknown) {
        console.error('[COMPLAINT ACTION] ❌ Resolve error:', error);
        const msg = error instanceof Error ? error.message : String(error);
        return { success: false, error: msg };
    }
}
