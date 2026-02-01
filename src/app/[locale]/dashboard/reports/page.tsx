import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Dashboard' });
    return {
        title: `${t('reports_title')} | Tactic Portal`,
    };
}

export default async function ReportsDashboardPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    📊 Reports Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    View analytics and reports
                </p>
            </div>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="text-2xl mb-2">📈</div>
                    <h3 className="font-semibold">Visit Reports</h3>
                    <p className="text-sm text-muted-foreground mt-1">Daily, weekly, monthly visit analytics</p>
                </div>
                <div className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="text-2xl mb-2">📦</div>
                    <h3 className="font-semibold">Inventory Reports</h3>
                    <p className="text-sm text-muted-foreground mt-1">Stock levels and availability</p>
                </div>
                <div className="bg-card rounded-xl p-6 border shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    <div className="text-2xl mb-2">👥</div>
                    <h3 className="font-semibold">Team Reports</h3>
                    <p className="text-sm text-muted-foreground mt-1">Performance and attendance</p>
                </div>
            </div>
        </div>
    );
}
