// ============================================================================
// DASHBOARD PAGE — Mounts DynamicDashboard with server-side context
// Server component: fetches user/client/division IDs, passes to client
// ============================================================================
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId, getUserDivisionId } from '@/lib/services/client';
import { getClientFeatures } from '@/lib/services/feature-service';
import { DynamicDashboard } from '@/components/dashboard/DynamicDashboard';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Dashboard' });

    return {
        title: t('title'),
        description: t('description'),
    };
}

export default async function DashboardPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const user = await getPortalUser();

    // Authentication guard (middleware handles this, but double-check)
    if (!user) {
        redirect(`/${locale}/login`);
    }

    // Fetch client context in parallel
    const [clientId, divisionId] = await Promise.all([
        getUserClientId(user.id),
        getUserDivisionId(user.id),
    ]);

    // Fetch enabled features for widget registry
    const enabledFeatures = clientId
        ? await getClientFeatures(clientId, divisionId)
        : [];

    return (
        <DynamicDashboard
            userAccountId={user.id}
            clientId={clientId ?? ''}
            divisionId={divisionId}
            enabledFeatures={enabledFeatures}
        />
    );
}
