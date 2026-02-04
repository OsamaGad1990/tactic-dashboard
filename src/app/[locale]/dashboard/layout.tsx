import { getPortalUser } from '@/lib/supabase/portal-user';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';

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
            {children}
        </DashboardLayout>
    );
}
