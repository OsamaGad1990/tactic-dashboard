import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getUserWithProfile } from '@/lib/actions/auth';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

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
    const { user, profile } = await getUserWithProfile();

    // Double-check authentication (middleware should handle this)
    if (!user) {
        redirect(`/${locale}/login`);
    }

    return <DashboardContent user={user} profile={profile} />;
}
