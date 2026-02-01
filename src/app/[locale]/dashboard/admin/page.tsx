import { getTranslations } from 'next-intl/server';

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

export default async function AdminDashboardPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    🛡️ Admin Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                    System overview and management
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">Total Companies</div>
                    <div className="text-3xl font-bold text-primary mt-2">--</div>
                </div>
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">Active Operators</div>
                    <div className="text-3xl font-bold text-primary mt-2">--</div>
                </div>
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">Total Users</div>
                    <div className="text-3xl font-bold text-primary mt-2">--</div>
                </div>
                <div className="bg-card rounded-xl p-5 border shadow-sm">
                    <div className="text-sm text-muted-foreground">Today's Visits</div>
                    <div className="text-3xl font-bold text-primary mt-2">--</div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-xl p-6 border shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-center">
                        <div className="text-2xl mb-2">🏢</div>
                        <div className="text-sm font-medium">Manage Companies</div>
                    </button>
                    <button className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-center">
                        <div className="text-2xl mb-2">👥</div>
                        <div className="text-sm font-medium">Manage Users</div>
                    </button>
                    <button className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-center">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="text-sm font-medium">Reports</div>
                    </button>
                    <button className="p-4 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-center">
                        <div className="text-2xl mb-2">⚙️</div>
                        <div className="text-sm font-medium">Settings</div>
                    </button>
                </div>
            </div>
        </div>
    );
}
