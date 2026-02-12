import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getClientInfo, getUserClientId, getUserClientRole, getUserDivisionId } from '@/lib/services/client';
import { getClientFeatures } from '@/lib/services/feature-service';
import { ClientHeader } from '@/components/dashboard/client-header';
import { DynamicDashboard } from '@/components/dashboard/DynamicDashboard';
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

    // Get user's client ID and division ID
    const [clientId, divisionId] = await Promise.all([
        getUserClientId(user.id),
        getUserDivisionId(user.id),
    ]);

    // Fetch client info, role, and features in parallel
    const [clientInfo, clientRole, enabledFeatures] = await Promise.all([
        clientId ? getClientInfo(clientId) : null,
        getUserClientRole(user.id),
        clientId ? getClientFeatures(clientId, divisionId) : [],
    ]);

    // Get localized role label
    const roleLabel = clientRole
        ? (locale === 'ar' ? clientRole.labelAr : clientRole.labelEn)
        : (locale === 'ar' ? 'مستخدم' : 'User');

    return (
        <div className="space-y-6">
            {/* 1. Client Header — Welcome */}
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

            {/* DynamicDashboard is fully self-contained:
                — GlobalFilterBar at top
                — AnalyticsDashboard ring charts (reads useDashboardData)
                — Top Performers at bottom */}
            <DynamicDashboard
                userAccountId={user.id}
                clientId={clientId || user.orgId || ''}
                divisionId={divisionId}
                enabledFeatures={enabledFeatures}
            />
        </div>
    );
}
