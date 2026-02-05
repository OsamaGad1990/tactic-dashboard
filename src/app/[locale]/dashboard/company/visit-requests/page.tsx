import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { redirect } from 'next/navigation';
import { CalendarClock } from 'lucide-react';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    return {
        title: `${t('visit_requests')} | Tactic Portal`,
    };
}

export default async function VisitRequestsPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });

    // Get current user
    const user = await getPortalUser();
    if (!user) {
        redirect(`/${locale}/login`);
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CalendarClock className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('visit_requests')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'إدارة طلبات الزيارة' : 'Manage visit requests'}
                    </p>
                </div>
            </div>

            {/* Placeholder Content */}
            <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
                <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">
                    {locale === 'ar' ? 'قريباً' : 'Coming Soon'}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    {locale === 'ar'
                        ? 'هذه الصفحة قيد التطوير'
                        : 'This page is under development'}
                </p>
            </div>
        </div>
    );
}
