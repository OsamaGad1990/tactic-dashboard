import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId, getUserDivisionId } from '@/lib/services/client';
import { isFeatureEnabled } from '@/lib/services/feature-service';
import { getPendingRequests, getAllRequests } from '@/lib/services/visit-requests-service';
import { getPendingBreakRequests, getAllBreakRequests } from '@/lib/services/break-requests-service';
import { redirect } from 'next/navigation';
import { CalendarClock, Lock, MapPin } from 'lucide-react';
import { VisitRequestsPanel } from '@/components/visit-requests/VisitRequestsPanel';
import { BreakRequestsPanel } from '@/components/visit-requests/BreakRequestsPanel';
import { RequestsPageTabs } from '@/components/visit-requests/RequestsPageTabs';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { ScopeProvider } from '@/lib/context/ScopeContext';

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
                            {isArabic ? 'إدارة طلبات الزيارة والاستراحة' : 'Manage visit & break requests'}
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

    // ========================================================================
    // FEATURE GATE: off_route_visit
    // ========================================================================
    const featureEnabled = await isFeatureEnabled(clientId, 'visit.offroute_approval_required', divisionId);
    if (!featureEnabled) {
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
                <div className="rounded-xl border border-border bg-card/50 p-12 text-center">
                    <Lock className="mx-auto h-16 w-16 text-muted-foreground/30" />
                    <h3 className="mt-4 text-xl font-semibold text-foreground">
                        {isArabic ? 'الميزة غير متاحة' : 'Feature Not Available'}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                        {isArabic
                            ? 'ميزة طلبات الزيارة خارج الخط غير مفعلة لحسابكم. تواصلوا مع الدعم لتفعيلها.'
                            : 'Off-route visit requests feature is not enabled for your account. Contact support to activate it.'}
                    </p>
                </div>
            </div>
        );
    }

    // Fetch all data in parallel
    const [pendingRequests, allRequests, pendingBreaks, allBreaks] = await Promise.all([
        getPendingRequests(clientId, divisionId),
        getAllRequests(clientId, divisionId),
        getPendingBreakRequests(clientId, divisionId),
        getAllBreakRequests(clientId, divisionId),
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
                        {isArabic ? 'إدارة طلبات الزيارة والاستراحة' : 'Manage visit & break requests'}
                    </p>
                </div>
            </div>

            <ScopeProvider clientId={clientId} divisionId={divisionId} managerAccountId={user.id}>
                <DashboardFilters userAccountId={user.id} clientId={clientId} showLocationFilters={false} showRequestFilters={true} />

                <RequestsPageTabs
                    pendingOffrouteCount={pendingRequests.length}
                    pendingBreaksCount={pendingBreaks.length}
                    offroutePanel={
                        <VisitRequestsPanel
                            pendingRequests={pendingRequests}
                            allRequests={allRequests}
                        />
                    }
                    breaksPanel={
                        <BreakRequestsPanel
                            pendingRequests={pendingBreaks}
                            allRequests={allBreaks}
                        />
                    }
                />
            </ScopeProvider>
        </div>
    );
}
