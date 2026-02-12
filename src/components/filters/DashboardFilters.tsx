// ============================================================================
// DASHBOARD FILTERS - Wrapper for GlobalFilterBar (Server/Client boundary)
// Includes ScopeProvider for HULK Architecture
// ============================================================================
'use client';

import { GlobalFilterBar } from './GlobalFilterBar';
import { ScopeProvider } from '@/lib/context/ScopeContext';
import { useFilters } from '@/lib/context/FilterContext';

interface DashboardFiltersProps {
    userAccountId: string;
    clientId: string | null;
    divisionId?: string | null;
}

export function DashboardFilters({ userAccountId, clientId, divisionId }: DashboardFiltersProps) {
    const { filters } = useFilters();

    // Don't render if no clientId
    if (!clientId) {
        return null;
    }

    return (
        <ScopeProvider
            clientId={clientId}
            divisionId={divisionId}
            managerAccountId={userAccountId}
            dateFrom={filters.dateRange.from}
            dateTo={filters.dateRange.to}
        >
            <div className="dashboard-filters">
                <GlobalFilterBar
                    userAccountId={userAccountId}
                    clientId={clientId}
                />
            </div>
        </ScopeProvider>
    );
}

