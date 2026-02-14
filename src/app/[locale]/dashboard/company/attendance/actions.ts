'use server';

import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId, getUserDivisionId } from '@/lib/services/client';
import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';

/**
 * Send a notification to a specific user.
 * Used from the attendance page for quick "nudge" notifications.
 */
export async function sendAttendanceNotification(input: {
    targetUserId: string;
    titleEn: string;
    titleAr: string;
    messageEn: string;
    messageAr: string;
}) {
    try {
        const user = await getPortalUser();
        if (!user) return { error: 'Unauthorized' };

        const clientId = await getUserClientId(user.id);
        if (!clientId) return { error: 'No client association' };

        const divisionId = await getUserDivisionId(user.id);

        await db.insert(notifications).values({
            clientId,
            divisionId,
            teamLeader: user.id,
            titleEn: input.titleEn.trim(),
            titleAr: input.titleAr.trim(),
            messageEn: input.messageEn.trim(),
            messageAr: input.messageAr.trim(),
            audienceType: 'single_user',
            forAll: false,
            forRoles: null,
            forUser: input.targetUserId,
            unifiedStatus: 'queued',
            createdAt: new Date(),
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to send attendance notification:', error);
        return { error: 'Failed to send notification' };
    }
}
