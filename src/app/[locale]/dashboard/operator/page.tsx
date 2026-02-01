import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'Dashboard' });
    return {
        title: `${t('operator_title')} | Tactic Portal`,
    };
}

export default async function OperatorDashboardPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    🏭 Operator Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage your companies and teams
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">Managed Companies</div>
                    <div className="text-3xl font-bold text-primary mt-2">--</div>
                </div>
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">Active Teams</div>
                    <div className="text-3xl font-bold text-primary mt-2">--</div>
                </div>
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">Field Users</div>
                    <div className="text-3xl font-bold text-primary mt-2">--</div>
                </div>
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">Today's Visits</div>
                    <div className="text-3xl font-bold text-primary mt-2">--</div>
                </div>
            </div>

            {/* Companies List Placeholder */}
            <div className="bg-card rounded-xl p-6 border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Managed Companies</h2>
                <p className="text-muted-foreground">
                    Company list will be populated with data from the database.
                </p>
            </div>
        </div>
    );
}
