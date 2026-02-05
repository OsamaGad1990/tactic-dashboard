import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getClientInfo, getUserClientId, getUserClientRole } from '@/lib/services/client';
import { ClientHeader } from '@/components/dashboard/client-header';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { AnalyticsDashboard } from '@/components/dashboard/AnalyticsDashboard';
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

    // Fetch client info and role in parallel
    const [clientInfo, clientRole] = await Promise.all([
        clientId ? getClientInfo(clientId) : null,
        getUserClientRole(user.id),
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

            {/* Dashboard Filters - After Welcome Message */}
            <DashboardFilters
                userAccountId={user.id}
                clientId={clientId || user.orgId}
            />

            {/* Circle Charts Analytics Dashboard */}
            <AnalyticsDashboard clientId={clientId || user.orgId} />
        </div>
    );
}
