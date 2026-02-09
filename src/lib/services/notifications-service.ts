// Notifications Service — Raw SQL (Direct PostgreSQL, bypasses RLS)
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { cache } from 'react';

export interface NotificationRow {
    id: string;
    titleEn: string;
    titleAr: string | null;
    messageEn: string | null;
    messageAr: string | null;
    audienceType: string | null;
    forAll: boolean | null;
    forRoles: string[] | null;
    forUser: string | null;
    unifiedStatus: string | null;
    createdAt: string;
    readCount: number;
    actionCount: number;
    teamLeader: string | null;
    senderName: string | null;
    senderArabicName: string | null;
}

/**
 * Fetch sent notifications for a client (history table)
 * LEFT JOINs accounts to get sender name from team_leader UUID
 */
export const getSentNotifications = cache(async (clientId: string, divisionId?: string | null): Promise<NotificationRow[]> => {
    try {
        const rows = await db.execute(sql`
            SELECT
                n.id,
                n.title_en,
                n.title_ar,
                n.message_en,
                n.message_ar,
                n.audience_type,
                n.for_all,
                n.for_roles,
                n.for_user,
                n.unified_status,
                n.team_leader,
                n.created_at,
                a.full_name   AS sender_name,
                a.arabic_name AS sender_arabic_name,
                (SELECT COUNT(*)::int FROM notification_reads  nr WHERE nr.notification_id = n.id) AS read_count,
                (SELECT COUNT(*)::int FROM notification_actions na WHERE na.notification_id = n.id) AS action_count
            FROM notifications n
            LEFT JOIN accounts a ON a.id = n.team_leader
            WHERE n.client_id = ${clientId}::uuid
              ${divisionId ? sql`AND n.division_id = ${divisionId}::uuid` : sql``}
            ORDER BY n.created_at DESC
            LIMIT 200
        `);

        // PostgreSQL text[] from raw SQL may come as "{mch,promoter}" string
        const parseTextArray = (val: unknown): string[] | null => {
            if (val == null) return null;
            if (Array.isArray(val)) return val;
            if (typeof val === 'string') {
                const trimmed = val.replace(/^\{|\}$/g, '');
                return trimmed ? trimmed.split(',').map(s => s.trim().replace(/^"|"$/g, '')) : null;
            }
            return null;
        };

        return (rows as unknown as Array<{
            id: string;
            title_en: string;
            title_ar: string | null;
            message_en: string | null;
            message_ar: string | null;
            audience_type: string | null;
            for_all: boolean | null;
            for_roles: unknown;
            for_user: string | null;
            unified_status: string | null;
            team_leader: string | null;
            created_at: string;
            sender_name: string | null;
            sender_arabic_name: string | null;
            read_count: number;
            action_count: number;
        }>).map((r) => ({
            id: r.id,
            titleEn: r.title_en,
            titleAr: r.title_ar,
            messageEn: r.message_en,
            messageAr: r.message_ar,
            audienceType: r.audience_type,
            forAll: r.for_all,
            forRoles: parseTextArray(r.for_roles),
            forUser: r.for_user,
            unifiedStatus: r.unified_status,
            createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
            readCount: r.read_count ?? 0,
            actionCount: r.action_count ?? 0,
            teamLeader: r.team_leader,
            senderName: r.sender_name,
            senderArabicName: r.sender_arabic_name,
        }));
    } catch (error) {
        console.error('Notifications service error:', error);
        return [];
    }
});

export interface FieldUser {
    id: string;
    fullName: string | null;
    arabicName: string | null;
    fieldRole: string | null;
}

/**
 * Fetch all field users under this client (for audience dropdowns)
 */
export const getFieldUsers = cache(async (clientId: string, _divisionId?: string | null): Promise<FieldUser[]> => {
    try {
        // client_users only has: id, client_id, user_id
        // First get all user IDs for this client, then fetch account details
        const userRows = await db.execute(sql`
            SELECT cu.user_id
            FROM client_users cu
            WHERE cu.client_id = ${clientId}::uuid
        `) as unknown as { user_id: string }[];

        if (userRows.length === 0) return [];

        const userIdsLiteral = `{${userRows.map(r => r.user_id).join(',')}}`;
        const rows = await db.execute(sql`
            SELECT id, full_name, arabic_name, field_role
            FROM accounts
            WHERE id = ANY(${userIdsLiteral}::uuid[])
              AND account_status = 'active'
              AND field_role IS NOT NULL
              AND field_role != 'none'
            ORDER BY field_role, full_name
        `) as unknown as { id: string; full_name: string | null; arabic_name: string | null; field_role: string | null }[];

        return rows.map((r) => ({
            id: r.id,
            fullName: r.full_name,
            arabicName: r.arabic_name,
            fieldRole: r.field_role,
        }));
    } catch (error) {
        console.error('getFieldUsers error:', error);
        return [];
    }
});

// ── Detail Analytics ──

export interface RecipientDetail {
    userId: string;
    fullName: string | null;
    arabicName: string | null;
    fieldRole: string | null;
    readAt: string | null;
    readDeltaSeconds: number | null;
    actionType: string | null;
    actionAt: string | null;
    actionDeltaSeconds: number | null;
}

export interface NotificationDetail {
    id: string;
    titleEn: string;
    titleAr: string | null;
    messageEn: string | null;
    messageAr: string | null;
    audienceType: string | null;
    createdAt: string;
    unifiedStatus: string | null;
    recipients: RecipientDetail[];
    totalRecipients: number;
    totalReads: number;
    totalActions: number;
}

/**
 * Fetch full analytics for a specific notification
 * Uses raw SQL exclusively to avoid Drizzle UUID comparison issues
 */
export async function getNotificationDetails(notificationId: string): Promise<NotificationDetail | null> {
    try {
        // 1. Fetch notification
        const notifRows = await db.execute(
            sql`SELECT id, title_en, title_ar, message_en, message_ar,
                       audience_type, created_at, unified_status
                FROM notifications
                WHERE id = ${notificationId}::uuid
                LIMIT 1`
        );

        type NotifRow = {
            id: string; title_en: string; title_ar: string | null;
            message_en: string | null; message_ar: string | null;
            audience_type: string | null; created_at: string; unified_status: string | null;
        };
        const notif = (notifRows as unknown as NotifRow[])[0];
        if (!notif) return null;

        // 2. Fetch reads with user info
        const readRows = await db.execute(
            sql`SELECT nr.user_id, a.full_name, a.arabic_name, a.field_role,
                       nr.read_at,
                       EXTRACT(EPOCH FROM (nr.read_at - ${notif.created_at}::timestamptz))::int AS read_delta_seconds
                FROM notification_reads nr
                JOIN accounts a ON a.id = nr.user_id
                WHERE nr.notification_id = ${notificationId}::uuid
                ORDER BY nr.read_at ASC`
        );

        // 3. Fetch actions
        const actionRows = await db.execute(
            sql`SELECT na.user_id, na.action_type, na.performed_at,
                       EXTRACT(EPOCH FROM (na.performed_at - ${notif.created_at}::timestamptz))::int AS action_delta_seconds
                FROM notification_actions na
                WHERE na.notification_id = ${notificationId}::uuid
                ORDER BY na.performed_at ASC`
        );

        type ReadRow = { user_id: string; full_name: string | null; arabic_name: string | null; field_role: string | null; read_at: string | null; read_delta_seconds: number | null };
        type ActionRow = { user_id: string; action_type: string; performed_at: string | null; action_delta_seconds: number | null };

        // Build action map
        const actionMap = new Map<string, ActionRow>();
        for (const a of actionRows as unknown as ActionRow[]) {
            if (!actionMap.has(a.user_id)) actionMap.set(a.user_id, a);
        }

        // Build recipients
        const recipients: RecipientDetail[] = (readRows as unknown as ReadRow[]).map((r) => {
            const action = actionMap.get(r.user_id);
            return {
                userId: r.user_id,
                fullName: r.full_name,
                arabicName: r.arabic_name,
                fieldRole: r.field_role,
                readAt: r.read_at,
                readDeltaSeconds: r.read_delta_seconds,
                actionType: action?.action_type ?? null,
                actionAt: action?.performed_at ?? null,
                actionDeltaSeconds: action?.action_delta_seconds ?? null,
            };
        });

        return {
            id: notif.id,
            titleEn: notif.title_en,
            titleAr: notif.title_ar,
            messageEn: notif.message_en,
            messageAr: notif.message_ar,
            audienceType: notif.audience_type,
            createdAt: notif.created_at,
            unifiedStatus: notif.unified_status,
            recipients,
            totalRecipients: recipients.length,
            totalReads: recipients.filter((r) => r.readAt).length,
            totalActions: recipients.filter((r) => r.actionAt).length,
        };
    } catch (error) {
        console.error('getNotificationDetails error:', error);
        return null;
    }
}

