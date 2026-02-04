import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getClientInfo, getUserClientId, getUserClientRole } from '@/lib/services/client';
import { getClientStats } from '@/lib/services/client-stats';
import { ClientHeader } from '@/components/dashboard/client-header';
import { redirect } from 'next/navigation';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Dashboard' });
    return {
        title: `${t('company_title')} | Tactic Portal`,
    };
}

export default async function CompanyDashboardPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Dashboard' });

    // Get current user
    const user = await getPortalUser();
    if (!user) {
        redirect(`/${locale}/login`);
    }

    // Get user's client ID
    const clientId = await getUserClientId(user.id);

    // Fetch client info, role, and stats in parallel
    const [clientInfo, clientRole, stats] = await Promise.all([
        clientId ? getClientInfo(clientId) : null,
        getUserClientRole(user.id),
        clientId ? getClientStats(clientId) : null,
    ]);

    // Get localized role label
    const roleLabel = clientRole
        ? (locale === 'ar' ? clientRole.labelAr : clientRole.labelEn)
        : (locale === 'ar' ? 'مستخدم' : 'User');

    return (
        <div className="space-y-6">
            {/* Client Header - Logo & Name */}
            {clientInfo && (
                <ClientHeader
                    logoUrl={clientInfo.logoUrl}
                    nameEn={clientInfo.nameEn}
                    nameAr={clientInfo.nameAr}
                    locale={locale}
                    userName={user.fullName || user.username}
                    userArabicName={user.arabicName}
                    roleLabel={roleLabel}
                    welcomeText={t('welcome_message')}
                    changePasswordText={t('change_password')}
                />
            )}

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    {t('company_title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {t('company_subtitle')}
                </p>
            </div>

            {/* Stats Grid - Real Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">{t('stats.team_members')}</div>
                    <div className="text-3xl font-bold text-primary mt-2">
                        {stats?.teamMembers ?? 0}
                    </div>
                </div>
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">{t('stats.active_markets')}</div>
                    <div className="text-3xl font-bold text-primary mt-2">
                        {stats?.activeMarkets ?? 0}
                    </div>
                </div>
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">{t('stats.products')}</div>
                    <div className="text-3xl font-bold text-primary mt-2">
                        {stats?.products ?? 0}
                    </div>
                </div>
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">{t('stats.today_visits')}</div>
                    <div className="text-3xl font-bold text-primary mt-2">
                        {stats?.todayVisits ?? 0}
                    </div>
                </div>
            </div>
        </div>
    );
}
