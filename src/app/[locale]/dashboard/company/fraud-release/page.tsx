import { FraudReleasePanel } from '@/components/fraud/FraudReleasePanel';
import { getFraudLockedUsers } from '@/lib/actions/fraud-actions';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { ShieldAlert } from 'lucide-react';
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
        title: `${t('fraud_release')} | Tactic Portal`,
    };
}

export default async function FraudReleasePage({
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

    // Fetch fraud-locked users
    const { users } = await getFraudLockedUsers();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                    <ShieldAlert className="h-5 w-5 text-red-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('fraud_release')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isArabic
                            ? 'إدارة وتحرير المستخدمين المحبوسين بسبب التلاعب'
                            : 'Manage and release users locked for fraud violations'}
                    </p>
                </div>
            </div>

            {/* Panel */}
            <FraudReleasePanel initialUsers={users} />
        </div>
    );
}
