import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId, getUserDivisionId } from '@/lib/services/client';
import { redirect } from 'next/navigation';
import { Bell } from 'lucide-react';
import { getSentNotifications, getFieldUsers } from '@/lib/services/notifications-service';
import { NotificationsPanel } from '@/components/notifications/NotificationsPanel';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    return {
        title: `${t('notifications')} | Tactic Portal`,
    };
}

export default async function NotificationsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });

    // Get current user
    const user = await getPortalUser();
    if (!user) {
        redirect(`/${locale}/login`);
    }

    const [clientId, divisionId] = await Promise.all([
        getUserClientId(user.id),
        getUserDivisionId(user.id),
    ]);
    if (!clientId) {
        redirect(`/${locale}/login`);
    }

    // Fetch data in parallel — scoped by client_id + division_id
    const [sentNotifications, fieldUsers] = await Promise.all([
        getSentNotifications(clientId, divisionId),
        getFieldUsers(clientId, divisionId),
    ]);

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('notifications')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'إدارة الإشعارات والتنبيهات' : 'Manage notifications and alerts'}
                    </p>
                </div>
            </div>

            {/* Notifications Panel */}
            <NotificationsPanel sentNotifications={sentNotifications} fieldUsers={fieldUsers} />
        </div>
    );
}
