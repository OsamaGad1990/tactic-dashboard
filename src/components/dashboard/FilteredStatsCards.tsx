// ============================================================================
// COMPONENT: FilteredStatsCards
// Purpose: Display dashboard stats that react to filter changes
// ============================================================================
'use client';

import { useFilteredStats } from '@/lib/hooks/useFilteredStats';
import { useTranslations } from 'next-intl';
import { Users, Store, Package, Calendar, Loader2 } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface FilteredStatsCardsProps {
    clientId: string | null;
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    isLoading?: boolean;
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
function StatCard({ title, value, icon: Icon, isLoading }: StatCardProps) {
    return (
        <div className="
            bg-card rounded-xl p-5 border shadow-sm
            hover:shadow-lg hover:border-primary/30
            transition-all duration-300
            group
        ">
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{title}</div>
                <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-4 h-4 text-primary" />
                </div>
            </div>
            <div className="text-3xl font-bold text-primary mt-2">
                {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                    value.toLocaleString()
                )}
            </div>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function FilteredStatsCards({ clientId }: FilteredStatsCardsProps) {
    const t = useTranslations('Dashboard.stats');
    const { data: stats, isLoading, isFetching } = useFilteredStats(clientId);

    const showLoader = isLoading || isFetching;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title={t('team_members')}
                value={stats?.team_members ?? 0}
                icon={Users}
                isLoading={showLoader}
            />
            <StatCard
                title={t('active_markets')}
                value={stats?.active_markets ?? 0}
                icon={Store}
                isLoading={showLoader}
            />
            <StatCard
                title={t('products')}
                value={stats?.products ?? 0}
                icon={Package}
                isLoading={showLoader}
            />
            <StatCard
                title={t('today_visits')}
                value={stats?.today_visits ?? 0}
                icon={Calendar}
                isLoading={showLoader}
            />
        </div>
    );
}
