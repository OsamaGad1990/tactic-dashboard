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
    showLocationFilters?: boolean;
    showRequestFilters?: boolean;
    showVisitStatusFilters?: boolean;
    showDateFilters?: boolean;
    /** Only show these user IDs in the field staff dropdown */
    allowedFieldStaffIds?: string[];
}

export function DashboardFilters({ userAccountId, clientId, divisionId, showLocationFilters, showRequestFilters, showVisitStatusFilters, showDateFilters, allowedFieldStaffIds }: DashboardFiltersProps) {
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
                    showLocationFilters={showLocationFilters}
                    showRequestFilters={showRequestFilters}
                    showVisitStatusFilters={showVisitStatusFilters}
                    showDateFilters={showDateFilters}
                    allowedFieldStaffIds={allowedFieldStaffIds}
                />
            </div>
        </ScopeProvider>
    );
}

