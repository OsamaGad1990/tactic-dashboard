import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { LiveMapContainer } from '@/components/tracking/LiveMapContainer';
import { ScopeProvider } from '@/lib/context/ScopeContext';
import { getUserClientId, getUserDivisionId } from '@/lib/services/client';
import { isFeatureEnabled } from '@/lib/services/feature-service';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { Lock, MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    return {
        title: `${t('live_tracking')} | Tactic Portal`,
    };
}

export default async function LiveTrackingPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    const isArabic = locale === 'ar';

    // Get current user
    const user = await getPortalUser();
    if (!user) {
        redirect(`/${locale}/login`);
    }

    // Get user's client ID
    const [clientId, divisionId] = await Promise.all([
        getUserClientId(user.id),
        getUserDivisionId(user.id),
    ]);

    if (!clientId) {
        return (
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('live_tracking')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isArabic ? 'تتبع تحركات الفريق لحظياً' : 'Track team movements in real-time'}
                        </p>
                    </div>
                </div>

                {/* No Client Error */}
                <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
                    <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                        {isArabic ? 'غير مرتبط بشركة' : 'No Company Association'}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {isArabic
                            ? 'لا يمكن عرض التتبع بدون ارتباط بشركة'
                            : 'Cannot display tracking without a company association'}
                    </p>
                </div>
            </div>
        );
    }

    // Feature Guard: Check if live_tracking is enabled for this client
    const liveTrackingEnabled = await isFeatureEnabled(clientId, 'live_tracking', divisionId);

    if (!liveTrackingEnabled) {
        return (
            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('live_tracking')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isArabic ? 'تتبع تحركات الفريق لحظياً' : 'Track team movements in real-time'}
                        </p>
                    </div>
                </div>

                {/* Feature Not Available */}
                <div className="rounded-xl border border-border bg-card/50 p-12 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                        <Lock className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="mt-6 text-xl font-semibold">
                        {isArabic ? 'هذه الميزة غير متاحة' : 'Feature Not Available'}
                    </h3>
                    <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
                        {isArabic
                            ? 'ميزة التتبع المباشر غير مفعلة لحسابكم. يرجى التواصل مع المسؤول لتفعيلها.'
                            : 'Live tracking is not enabled for your account. Please contact your administrator to activate this feature.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('live_tracking')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isArabic ? 'تتبع تحركات الفريق لحظياً' : 'Track team movements in real-time'}
                    </p>
                </div>
            </div>

            {/* Live Map */}
            <ScopeProvider clientId={clientId} divisionId={divisionId} managerAccountId={user.id}>
                <DashboardFilters userAccountId={user.id} clientId={clientId} showLocationFilters={false} />
                <LiveMapContainer clientId={clientId} />
            </ScopeProvider>
        </div>
    );
}
