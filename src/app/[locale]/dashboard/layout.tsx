import { getPortalUser } from '@/lib/supabase/portal-user';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { QueryProvider } from '@/lib/providers/QueryProvider';
import { FilterProvider } from '@/lib/context/FilterContext';

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

    return (
        <DashboardLayout
            userName={user.fullName || user.username}
            userRole={user.portalRole}
            avatarUrl={user.avatarUrl}
            userId={user.id}
        >
            <QueryProvider>
                <FilterProvider>
                    {children}
                </FilterProvider>
            </QueryProvider>
        </DashboardLayout>
    );
}

