import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId, getUserDivisionId } from '@/lib/services/client';
import { redirect } from 'next/navigation';
import { Users, MapPin } from 'lucide-react';
import { TeamPanel } from '@/components/team/TeamPanel';
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
        title: `${t('my_team')} | Tactic Portal`,
    };
}

export default async function TeamPage({
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
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('my_team')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isArabic ? 'عرض أعضاء الفريق' : 'View team members'}
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
                            ? 'لا يمكن عرض الفريق بدون ارتباط بشركة'
                            : 'Cannot display team without a company association'}
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
                    <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('my_team')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isArabic ? 'عرض أعضاء الفريق وأدوارهم' : 'View team members and their roles'}
                    </p>
                </div>
            </div>

            {/* Global Filters */}
            <ScopeProvider clientId={clientId} divisionId={divisionId} managerAccountId={user.id}>
                <DashboardFilters userAccountId={user.id} clientId={clientId} />
                <TeamPanel />
            </ScopeProvider>
        </div>
    );
}
