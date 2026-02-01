import { getTranslations } from 'next-intl/server';
import { getAdminKPIs } from '@/lib/services/stats';
import { StatCard } from '@/components/dashboard/stat-card';
import { Building2, Users, MapPin, Clock, Settings, BarChart3, UserCog } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Dashboard' });
    return {
        title: `${t('admin_title')} | Tactic Portal`,
    };
}

export default async function AdminDashboardPage({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Dashboard' });

    // Fetch KPIs with error handling
    let kpis = {
        totalClients: 0,
        totalFieldForce: 0,
        liveVisitsToday: 0,
        pendingApprovals: 0,
    };

    try {
        kpis = await getAdminKPIs();
    } catch (error) {
        console.error('Failed to fetch admin KPIs:', error);
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    🛡️ {t('admin_title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                    {t('system_overview')}
                </p>
            </div>

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label={t('total_clients')}
                    value={kpis.totalClients || '---'}
                    icon={Building2}
                    variant="default"
                />
                <StatCard
                    label={t('field_force')}
                    value={kpis.totalFieldForce || '---'}
                    icon={Users}
                    variant="success"
                />
                <StatCard
                    label={t('live_visits')}
                    value={kpis.liveVisitsToday || '---'}
                    icon={MapPin}
                    variant="default"
                />
                <StatCard
                    label={t('pending_approvals')}
                    value={kpis.pendingApprovals || '---'}
                    icon={Clock}
                    variant={kpis.pendingApprovals > 0 ? 'warning' : 'default'}
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-card/30 backdrop-blur-md rounded-xl p-6 border border-primary/20">
                <h2 className="text-lg font-semibold mb-4">{t('quick_actions')}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link
                        href={`/${locale}/dashboard/admin/companies`}
                        className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-center group"
                    >
                        <div className="flex justify-center mb-2">
                            <Building2 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-sm font-medium">{t('manage_companies')}</div>
                    </Link>
                    <Link
                        href={`/${locale}/dashboard/admin/users`}
                        className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-center group"
                    >
                        <div className="flex justify-center mb-2">
                            <UserCog className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-sm font-medium">{t('manage_users')}</div>
                    </Link>
                    <Link
                        href={`/${locale}/dashboard/admin/reports`}
                        className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-center group"
                    >
                        <div className="flex justify-center mb-2">
                            <BarChart3 className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-sm font-medium">{t('view_reports')}</div>
                    </Link>
                    <Link
                        href={`/${locale}/dashboard/admin/settings`}
                        className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-center group"
                    >
                        <div className="flex justify-center mb-2">
                            <Settings className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="text-sm font-medium">{t('system_settings')}</div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
