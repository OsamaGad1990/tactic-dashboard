'use server';

import { db } from '@/lib/db';
import { notifications } from '@/lib/db/schema';
import { getUserClientId } from '@/lib/services/client';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { revalidatePath } from 'next/cache';

interface SendNotificationInput {
    titleEn: string;
    titleAr?: string;
    messageEn?: string;
    messageAr?: string;
    audienceType: 'all' | 'role' | 'single_user';
    forRoles?: string[];
    forUser?: string;
}

export async function sendNotification(input: SendNotificationInput) {
    try {
        const user = await getPortalUser();
        if (!user) {
            return { error: 'Unauthorized' };
        }

        const clientId = await getUserClientId(user.id);
        if (!clientId) {
            return { error: 'No client association' };
        }

        // Validate
        if (!input.titleEn.trim()) {
            return { error: 'Title (English) is required' };
        }

        // Build the notification record
        const forAll = input.audienceType === 'all';
        const forRoles = input.audienceType === 'role' ? (input.forRoles ?? []) : null;
        const forUser = input.audienceType === 'single_user' ? (input.forUser ?? null) : null;

        await db.insert(notifications).values({
            clientId,
            titleEn: input.titleEn.trim(),
            titleAr: input.titleAr?.trim() || null,
            messageEn: input.messageEn?.trim() || null,
            messageAr: input.messageAr?.trim() || null,
            audienceType: input.audienceType,
            forAll,
            forRoles,
            forUser,
            unifiedStatus: 'queued',
            createdAt: new Date(),
        });

        revalidatePath('/dashboard/company/notifications');
        return { success: true };
    } catch (error) {
        console.error('Failed to send notification:', error);
        return { error: 'Failed to send notification' };
    }
}

// ── Fetch notification detail (for analytics modal) ──
import { getNotificationDetails } from '@/lib/services/notifications-service';

export async function fetchNotificationDetails(notificationId: string) {
    try {
        const user = await getPortalUser();
        if (!user) {
            return { data: null, error: 'Unauthorized' };
        }

        const data = await getNotificationDetails(notificationId);
        return { data, error: null };
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('[fetchNotificationDetails] ERROR:', msg);
        return { data: null, error: msg };
    }
}

