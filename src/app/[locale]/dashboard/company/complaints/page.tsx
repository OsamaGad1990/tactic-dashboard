import { getTranslations } from 'next-intl/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId, getUserDivisionId } from '@/lib/services/client';
import { getComplaints } from '@/lib/services/complaints-service';
import { redirect } from 'next/navigation';
import { MessageSquareWarning, MapPin } from 'lucide-react';
import { ComplaintsPanel } from '@/components/complaints/ComplaintsPanel';
import { DashboardFilters } from '@/components/filters/DashboardFilters';
import { ScopeProvider } from '@/lib/context/ScopeContext';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Sidebar' });
    return {
        title: `${t('complaints')} | Tactic Portal`,
    };
}

export default async function ComplaintsPage({
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

    const [clientId, divisionId] = await Promise.all([
        getUserClientId(user.id),
        getUserDivisionId(user.id),
    ]);

    if (!clientId) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MessageSquareWarning className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{t('complaints')}</h1>
                        <p className="text-sm text-muted-foreground">
                            {isArabic ? 'إدارة الشكاوى والمتابعة' : 'Manage complaints & follow-up'}
                        </p>
                    </div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-8 text-center">
                    <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                        {isArabic ? 'غير مرتبط بشركة' : 'No Company Association'}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {isArabic
                            ? 'لا يمكن عرض الشكاوى بدون ارتباط بشركة'
                            : 'Cannot display complaints without a company association'}
                    </p>
                </div>
            </div>
        );
    }

    const allComplaints = await getComplaints(clientId, divisionId);

    // Hide complaints where the logged-in user is a target (المشكو ضده) — unless admin
    const isAdmin = user.portalRole === 'super_admin' || user.portalRole === 'client_admin';
    const complaintsData = isAdmin
        ? allComplaints
        : allComplaints.filter(c => !c.targetAccountIds.includes(user.id));

    // Only show field users who actually submitted complaints (MCH users only)
    const complaintRequesterIds = [...new Set(complaintsData.map(c => c.requesterId))];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquareWarning className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{t('complaints')}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isArabic ? 'إدارة الشكاوى والمتابعة' : 'Manage complaints & follow-up'}
                    </p>
                </div>
            </div>

            <ScopeProvider clientId={clientId} divisionId={divisionId} managerAccountId={user.id}>
                <DashboardFilters userAccountId={user.id} clientId={clientId} divisionId={divisionId} allowedFieldStaffIds={complaintRequesterIds} />
                <ComplaintsPanel complaints={complaintsData} currentUserId={user.id} isAdmin={isAdmin} />
            </ScopeProvider>
        </div>
    );
}
