import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId, getUserDivisionId } from '@/lib/services/client';
import { redirect } from 'next/navigation';
import { UserCheck, AlertTriangle } from 'lucide-react';
import { AttendancePanel } from '@/components/attendance/AttendancePanel';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { ScopeProvider } from '@/lib/context/ScopeContext';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    return {
        title: `${t('attendance')} | Tactic Portal`,
    };
}

/**
 * Fetch check-in times (first visit today per user) and live status.
 * User list comes from ScopeContext on the client side.
 */
async function getCheckInData(clientId: string, divisionId?: string | null) {
    try {
        // First visit today per user
        const checkIns = await db.execute(sql`
            SELECT
                user_id,
                MIN(actual_start) AS first_check_in
            FROM visit_core
            WHERE client_id = ${clientId}::uuid
              AND visit_date = CURRENT_DATE
              AND actual_start IS NOT NULL
              ${divisionId ? sql`AND division_id = ${divisionId}::uuid` : sql``}
            GROUP BY user_id
        `);

        return (checkIns as unknown as { user_id: string; first_check_in: string }[]).reduce(
            (map, row) => { map[row.user_id] = row.first_check_in; return map; },
            {} as Record<string, string>
        );
    } catch (error) {
        console.error('Check-in data error:', error);
        return {};
    }
}

async function getLiveStatusData(clientId: string) {
    try {
        const status = await db.execute(sql`
            SELECT user_id, MAX(created_at) AS last_seen
            FROM tracking_logs
            WHERE client_id = ${clientId}::uuid
              AND created_at >= CURRENT_DATE
            GROUP BY user_id
        `);

        return (status as unknown as { user_id: string; last_seen: string }[]).reduce(
            (map, row) => { map[row.user_id] = row.last_seen; return map; },
            {} as Record<string, string>
        );
    } catch (error) {
        console.error('Live status data error:', error);
        return {};
    }
}

export default async function AttendancePage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    const isArabic = locale === 'ar';

    const user = await getPortalUser();
    if (!user) {
        redirect(`/${locale}/login`);
    }

    const [clientId, divisionId] = await Promise.all([
        getUserClientId(user.id),
        getUserDivisionId(user.id),
    ]);

    if (!clientId) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('attendance')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isArabic ? 'متابعة حضور الفريق' : 'Track team attendance'}
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                        {isArabic ? 'غير مرتبط بشركة' : 'No Company Association'}
                    </h3>
                </div>
            </div>
        );
    }

    // Fetch check-in and live status data server-side
    const [checkInMap, liveStatusMap] = await Promise.all([
        getCheckInData(clientId, divisionId),
        getLiveStatusData(clientId),
    ]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <UserCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('attendance')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isArabic ? 'متابعة حضور الفريق اليوم' : "Track today's team attendance"}
                    </p>
                </div>
            </div>

            {/* Global Filters + Panel */}
            <ScopeProvider clientId={clientId} divisionId={divisionId} managerAccountId={user.id}>
                <DashboardFilters userAccountId={user.id} clientId={clientId} showLocationFilters={false} />
                <AttendancePanel checkInMap={checkInMap} liveStatusMap={liveStatusMap} />
            </ScopeProvider>
        </div>
    );
}
