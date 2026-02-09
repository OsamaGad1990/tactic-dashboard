import { getPortalUser } from '@/lib/supabase/portal-user';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { FilterProvider } from '@/lib/context/FilterContext';
import { getUserClientId } from '@/lib/services/client';
import { getClientFeatures } from '@/lib/services/feature-service';

export default async function DashboardRootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const user = await getPortalUser();

    // Not authenticated - redirect to login
    if (!user) {
        redirect(`/${locale}/login`);
    }

    // No portal access
    if (user.portalRole === 'none') {
        redirect(`/${locale}/login`);
    }

    // Fetch enabled features for the user's client
    const clientId = await getUserClientId(user.id);
    const enabledFeatures = clientId ? await getClientFeatures(clientId) : [];

    return (
        <DashboardLayout
            userName={user.fullName || user.username}
            userRole={user.portalRole}
            avatarUrl={user.avatarUrl}
            userId={user.id}
            enabledFeatures={enabledFeatures}
        >
            <QueryProvider>
                <FilterProvider>
                    {children}
                </FilterProvider>
            </QueryProvider>
        </DashboardLayout>
    );
}

