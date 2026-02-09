import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { redirect } from 'next/navigation';
import { UserCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    return {
        title: `${t('my_team')} - Details | Tactic Portal`,
    };
}

export default async function TeamMemberPage({
    params,
}: {
    params: Promise<{ locale: string; userId: string }>;
}) {
    const { locale, userId } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    const isArabic = locale === 'ar';

    const user = await getPortalUser();
    if (!user) {
        redirect(`/${locale}/login`);
    }

    return (
        <div className="space-y-6">
            {/* Back Link */}
            <Link
                href={`/${locale}/dashboard/company/team`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {isArabic ? 'العودة للفريق' : 'Back to Team'}
            </Link>

            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <UserCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isArabic ? 'تقارير المستخدم' : 'User Reports'}
                    </h1>
                    <p className="text-sm text-muted-foreground font-mono">
                        {userId}
                    </p>
                </div>
            </div>

            {/* Placeholder */}
            <div className="rounded-xl border border-border bg-card/50 p-12 text-center">
                <UserCircle className="mx-auto h-16 w-16 text-muted-foreground/30" />
                <h3 className="mt-6 text-xl font-semibold">
                    {isArabic ? 'قريباً' : 'Coming Soon'}
                </h3>
                <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
                    {isArabic
                        ? 'صفحة التقارير المفصلة للمستخدم قيد التطوير'
                        : 'Detailed user reports page is under development'}
                </p>
            </div>
        </div>
    );
}
