import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId, getUserDivisionId } from '@/lib/services/client';
import { getPendingRequests, getAllRequests } from '@/lib/services/visit-requests-service';
import { redirect } from 'next/navigation';
import { CalendarClock, MapPin } from 'lucide-react';
import { VisitRequestsPanel } from '@/components/visit-requests/VisitRequestsPanel';
import { DashboardFilters } from '@/components/filters/DashboardFilters';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    return {
        title: `${t('visit_requests')} | Tactic Portal`,
    };
}

export default async function VisitRequestsPage({
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
                        <CalendarClock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('visit_requests')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isArabic ? 'إدارة طلبات الزيارة خارج الخط' : 'Manage off-route visit requests'}
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
                    <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                        {isArabic ? 'غير مرتبط بشركة' : 'No Company Association'}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {isArabic
                            ? 'لا يمكن عرض الطلبات بدون ارتباط بشركة'
                            : 'Cannot display requests without a company association'}
                    </p>
                </div>
            </div>
        );
    }

    // Fetch pending + all requests in parallel — scoped by client_id + division_id
    const [pendingRequests, allRequests] = await Promise.all([
        getPendingRequests(clientId, divisionId),
        getAllRequests(clientId, divisionId),
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarClock className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('visit_requests')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isArabic ? 'إدارة طلبات الزيارة خارج الخط' : 'Manage off-route visit requests'}
                    </p>
                </div>
            </div>

            <DashboardFilters userAccountId={user.id} clientId={clientId} />

            <VisitRequestsPanel
                pendingRequests={pendingRequests}
                allRequests={allRequests}
            />
        </div>
    );
}
