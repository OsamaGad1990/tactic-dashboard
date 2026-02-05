// ============================================================================
// HIERARCHY HOOKS - HULK Architecture V5 (Bidirectional Filtering)
// Purpose: Provide reactive filtering using ScopeContext + FilterContext
// Performance: Zero-latency client-side filtering after initial load
// ============================================================================
'use client';

import { useCallback, useMemo } from 'react';
import { useScope } from '@/lib/context/ScopeContext';
import { useFilters } from '@/lib/context/FilterContext';

// ============================================================================
// RE-EXPORT TYPES from ScopeContext
// ============================================================================
export type {
    ScopeManager,
    ScopeTeamLeader,
    ScopeFieldUser,
    ScopeChain,
    ScopeRegion,
    ScopeBranch,
    ScopeResponse,
} from '@/lib/context/ScopeContext';

// ============================================================================
// LEGACY TYPES (for backward compatibility)
// ============================================================================
export interface ChainFilterOption {
    id: string;
    name: string;
    name_ar: string | null;
}

export interface RegionFilterOption {
    id: string;
    name: string;
    name_ar: string | null;
}

export interface BranchFilterOption {
    id: string;
    name: string;
    chain_id: string | null;
    region_id: string | null;
}

// ============================================================================
// HOOK: useDashboardFilters (HULK Pattern V5 - Bidirectional)
// Combines ScopeContext data with FilterContext selections
// ============================================================================
export function useDashboardFilters() {
    const scopeContext = useScope();
    const { filters } = useFilters();

    // ========================================================================
    // SQL V7 ROCKET FIX: Chain-First Filtering
    // Branches are filtered by chain FIRST, then field user (if selected)
    // Regions are DERIVED from available branches
    // ========================================================================

    // STEP 1: Filter Branches (Primary - Chain-First Approach)
    const filteredBranches = useMemo(() => {
        if (!scopeContext.scope?.branches) return [];

        let result = scopeContext.scope.branches;

        // Filter by Chain FIRST (Manager Mode: show ALL chain branches)
        if (filters.chainId) {
            result = result.filter(b => b.chain_id === filters.chainId);
        }

        // Filter by Region
        if (filters.regionId) {
            result = result.filter(b => b.region_id === filters.regionId);
        }

        // CRITICAL: Only intersect with Field User permissions IF a Field User is EXPLICITLY selected
        if (filters.fieldStaffId) {
            const user = scopeContext.scope.field_users?.find(u => u.user_id === filters.fieldStaffId);
            if (user && user.allowed_branches?.length) {
                result = result.filter(b => user.allowed_branches.includes(b.id));
            }
        }

        return result;
    }, [scopeContext.scope?.branches, scopeContext.scope?.field_users, filters.chainId, filters.regionId, filters.fieldStaffId]);

    // STEP 2: Derive Regions from Filtered Branches (when chain is selected)
    const filteredRegions = useMemo(() => {
        if (!scopeContext.scope?.regions) return [];

        // If a chain is selected, derive regions from filtered branches
        if (filters.chainId && scopeContext.scope?.branches) {
            // Get branches of selected chain
            let chainBranches = scopeContext.scope.branches.filter(b => b.chain_id === filters.chainId);

            // If field user is selected, further filter
            if (filters.fieldStaffId) {
                const user = scopeContext.scope.field_users?.find(u => u.user_id === filters.fieldStaffId);
                if (user && user.allowed_regions?.length) {
                    chainBranches = chainBranches.filter(b => user.allowed_regions.includes(b.region_id));
                }
            }

            // Extract unique region IDs from these branches
            const regionIdsInChain = new Set(chainBranches.map(b => b.region_id));
            return scopeContext.scope.regions.filter(r => regionIdsInChain.has(r.id));
        }

        // If a specific field user is selected (no chain), filter regions to their allowed ones
        if (filters.fieldStaffId) {
            const user = scopeContext.scope.field_users?.find(u => u.user_id === filters.fieldStaffId);
            if (user && user.allowed_regions?.length) {
                return scopeContext.scope.regions.filter(r => user.allowed_regions.includes(r.id));
            }
        }

        return scopeContext.scope.regions;
    }, [scopeContext.scope?.regions, scopeContext.scope?.branches, scopeContext.scope?.field_users, filters.chainId, filters.fieldStaffId]);

    // Chains: Filtered by Field User selection only
    const filteredChains = useMemo(() => {
        if (!scopeContext.scope?.chains) return [];

        // If a specific field user is selected, filter chains to their allowed ones
        if (filters.fieldStaffId) {
            const user = scopeContext.scope.field_users?.find(u => u.user_id === filters.fieldStaffId);
            if (user && user.allowed_chains?.length) {
                return scopeContext.scope.chains.filter(c => user.allowed_chains.includes(c.id));
            }
        }

        return scopeContext.scope.chains;
    }, [scopeContext.scope?.chains, scopeContext.scope?.field_users, filters.fieldStaffId]);

    // Field Users: Filtered by Team Leader, Chain, Region
    const filteredFieldUsers = useMemo(() => {
        if (!scopeContext.scope?.field_users) return [];

        let result = scopeContext.scope.field_users;

        // Rule A (Top-Down): Team Leader -> Field Users
        if (filters.teamLeaderId) {
            result = result.filter(u => u.team_leader_account_id === filters.teamLeaderId);
        }

        // Rule B (Reverse): Chain -> Field Users (only show users who work in this chain)
        if (filters.chainId) {
            result = result.filter(u => u.allowed_chains?.includes(filters.chainId as string) ?? false);
        }

        // Rule C (Cross-Validation): Region -> Field Users
        if (filters.regionId) {
            result = result.filter(u => u.allowed_regions?.includes(filters.regionId as string) ?? false);
        }

        return result;
    }, [scopeContext.scope?.field_users, filters.teamLeaderId, filters.chainId, filters.regionId]);
    // ========================================================================
    // SQL V8: SMART HIERARCHY DISPLAY
    // ========================================================================

    // Implicit Manager Context
    // If only 1 manager exists (the logged-in user), use them automatically
    const implicitManagerId = useMemo(() => {
        const managers = scopeContext.scope?.managers ?? [];
        if (managers.length === 1) {
            return managers[0].id;
        }
        return null;
    }, [scopeContext.scope?.managers]);

    // Auto-Hide Manager Filter (The "Direct Manager" Rule)
    // If managers.length <= 1, it only contains the logged-in user
    const shouldShowManagerFilter = useMemo(() => {
        const managers = scopeContext.scope?.managers ?? [];
        return managers.length > 1;
    }, [scopeContext.scope?.managers]);

    // Team Leaders - show ALL team leaders in the dropdown (no role filtering)
    const filteredTeamLeaders = useMemo(() => {
        return scopeContext.scope?.team_leaders ?? [];
    }, [scopeContext.scope?.team_leaders]);

    // Auto-Hide Team Leader Filter if empty
    // Show if there are ANY team leaders under this user
    const shouldShowTeamLeaderFilter = useMemo(() => {
        const teamLeaders = scopeContext.scope?.team_leaders ?? [];
        return teamLeaders.length > 0;
    }, [scopeContext.scope?.team_leaders]);

    // Auto-Hide Field Staff Filter if empty
    // Show if there are ANY field users under this user
    const shouldShowFieldStaffFilter = useMemo(() => {
        const fieldUsers = scopeContext.scope?.field_users ?? [];
        return fieldUsers.length > 0;
    }, [scopeContext.scope?.field_users]);

    // Managers (for display when shouldShowManagerFilter is true)
    const filteredManagers = useMemo(() => {
        return scopeContext.scope?.managers ?? [];
    }, [scopeContext.scope?.managers]);


    // ========================================================================
    // BACKWARD COMPATIBLE GETTERS
    // ========================================================================

    const getFilteredChains = useCallback(
        (_selectedRegionId: string | null): ChainFilterOption[] => {
            return filteredChains.map(c => ({
                id: c.id,
                name: c.name_en,
                name_ar: c.name_ar || null,
            }));
        },
        [filteredChains]
    );

    const getFilteredRegions = useCallback(
        (_selectedChainId: string | null): RegionFilterOption[] => {
            return filteredRegions.map(r => ({
                id: r.id,
                name: r.name_en,
                name_ar: r.name_ar || null,
            }));
        },
        [filteredRegions]
    );

    // Team leaders formatted for backward compatibility
    const teamLeaders = useMemo(() => {
        return filteredTeamLeaders.map(tl => ({
            account_id: tl.team_leader_id,
            full_name: tl.name,
            manager_id: tl.manager_id,
        }));
    }, [filteredTeamLeaders]);

    // Field staff formatted for backward compatibility
    const fieldStaff = useMemo(() => {
        return filteredFieldUsers.map(fu => ({
            account_id: fu.user_id,
            full_name: fu.name,
            team_leader_account_id: fu.team_leader_account_id,
            allowed_chains: fu.allowed_chains,
            allowed_regions: fu.allowed_regions,
        }));
    }, [filteredFieldUsers]);

    // Get field staff by team leader (additional filtering on already filtered list)
    const getFieldStaffByTeamLeader = useCallback(
        (teamLeaderId: string | null) => {
            if (!teamLeaderId) return fieldStaff;
            return fieldStaff.filter(fs => fs.team_leader_account_id === teamLeaderId);
        },
        [fieldStaff]
    );

    return {
        // Loading states
        isLoading: scopeContext.isLoading,
        isError: scopeContext.isError,
        error: scopeContext.error,

        // Backward compatible getters
        getFilteredChains,
        getFilteredRegions,

        // Team and field staff
        teamLeaders,
        fieldStaff,
        getFieldStaffByTeamLeader,

        // Direct access to filtered data
        chains: filteredChains,
        regions: filteredRegions,
        branches: filteredBranches,

        // SQL V8: Smart Hierarchy Display
        managers: filteredManagers,
        implicitManagerId,
        shouldShowManagerFilter,
        shouldShowTeamLeaderFilter,
        shouldShowFieldStaffFilter,

        // Refetch
        refetch: scopeContext.refetch,
    };
}

// ============================================================================
// HOOK: useBranchOptions (HULK Pattern)
// Returns branches filtered by chain/region from ScopeContext
// ============================================================================
export function useBranchOptions(
    _clientId: string | null,
    chainId: string | null,
    regionId: string | null
) {
    const scopeContext = useScope();
    const { filters } = useFilters();

    // Filter branches based on chain and region selection
    const filteredBranches = useMemo(() => {
        if (!scopeContext.scope?.branches) return [];

        let result = scopeContext.scope.branches;

        // Filter by Chain
        if (chainId) {
            result = result.filter(b => b.chain_id === chainId);
        }

        // Filter by Region
        if (regionId) {
            result = result.filter(b => b.region_id === regionId);
        }

        // Filter by Field User's allowed branches
        if (filters.fieldStaffId) {
            const user = scopeContext.scope.field_users?.find(u => u.user_id === filters.fieldStaffId);
            if (user && user.allowed_branches?.length) {
                result = result.filter(b => user.allowed_branches.includes(b.id));
            }
        }

        return result.map(b => ({
            id: b.id,
            name: b.name_en,
            name_ar: b.name_ar,
            chain_id: b.chain_id,
            region_id: b.region_id,
        }));
    }, [scopeContext.scope?.branches, scopeContext.scope?.field_users, chainId, regionId, filters.fieldStaffId]);

    return {
        data: filteredBranches,
        isLoading: scopeContext.isLoading,
        isError: scopeContext.isError,
    };
}

// ============================================================================
// HOOK: useChainOptions (HULK Pattern - Backward Compatibility)
// ============================================================================
export function useChainOptions(_clientId: string | null) {
    const { getFilteredChains, isLoading, isError } = useDashboardFilters();

    const chainOptions = useMemo(() => {
        return getFilteredChains(null);
    }, [getFilteredChains]);

    return {
        data: chainOptions,
        isLoading,
        isError,
    };
}

// ============================================================================
// HOOK: useRegionOptions (HULK Pattern - Backward Compatibility)
// ============================================================================
export function useRegionOptions(_clientId: string | null) {
    const { getFilteredRegions, isLoading, isError } = useDashboardFilters();

    const regionOptions = useMemo(() => {
        return getFilteredRegions(null);
    }, [getFilteredRegions]);

    return {
        data: regionOptions,
        isLoading,
        isError,
    };
}
