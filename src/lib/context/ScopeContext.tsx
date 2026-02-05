// ============================================================================
// SCOPE CONTEXT - Single Round-Trip Hierarchical Scope (HULK Architecture)
// Purpose: Store and manage the complete organizational scope from single RPC call
// Performance: Zero-latency client-side filtering after initial load
// ============================================================================
'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// ============================================================================
// TYPES: Scope Response (from get_hierarchical_scope_context RPC)
// ============================================================================
export interface ScopeManager {
    id: string;
    name: string;
    role: string;
}

export interface ScopeTeamLeader {
    team_leader_id: string;
    manager_id: string;
    name: string;
    role: string;
}

export interface ScopeFieldUser {
    user_id: string;
    name: string;
    team_leader_account_id: string;
    allowed_chains: string[]; // UUIDs
    allowed_regions: string[]; // UUIDs
    allowed_branches: string[]; // UUIDs
    role: string;
}

export interface ScopeChain {
    id: string;
    name_en: string;
    name_ar: string;
}

export interface ScopeRegion {
    id: string;
    name_en: string;
    name_ar: string;
}

export interface ScopeBranch {
    id: string;
    name_en: string;
    name_ar: string;
    chain_id: string;
    region_id: string;
}

export interface ScopeResponse {
    managers: ScopeManager[];
    team_leaders: ScopeTeamLeader[];
    field_users: ScopeFieldUser[];
    chains: ScopeChain[];
    regions: ScopeRegion[];
    branches: ScopeBranch[];
}

// ============================================================================
// CONTEXT STATE
// ============================================================================
interface ScopeContextState {
    scope: ScopeResponse | null;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;

    // Selected filters
    selectedTeamLeaderId: string | null;
    selectedFieldUserId: string | null;
    selectedChainId: string | null;
    selectedRegionId: string | null;
    selectedBranchId: string | null;

    // Setters
    setSelectedTeamLeaderId: (id: string | null) => void;
    setSelectedFieldUserId: (id: string | null) => void;
    setSelectedChainId: (id: string | null) => void;
    setSelectedRegionId: (id: string | null) => void;
    setSelectedBranchId: (id: string | null) => void;

    // Filtered options (Bidirectional Reactive Filtering)
    filteredTeamLeaders: ScopeTeamLeader[];
    filteredFieldUsers: ScopeFieldUser[];
    filteredChains: ScopeChain[];
    filteredRegions: ScopeRegion[];
    filteredBranches: ScopeBranch[];

    // Refetch
    refetch: () => void;
}

const ScopeContext = createContext<ScopeContextState | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================
interface ScopeProviderProps {
    children: React.ReactNode;
    clientId: string | null;
    managerAccountId: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
}

export function ScopeProvider({
    children,
    clientId,
    managerAccountId,
    dateFrom,
    dateTo,
}: ScopeProviderProps) {
    const supabase = createClient();

    // ========================================================================
    // LOCAL STATE: Selected Filters
    // ========================================================================
    const [selectedTeamLeaderId, setSelectedTeamLeaderId] = useState<string | null>(null);
    const [selectedFieldUserId, setSelectedFieldUserId] = useState<string | null>(null);
    const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
    const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

    // ========================================================================
    // SINGLE RPC FETCH (HULK Pattern)
    // ========================================================================
    const query = useQuery<ScopeResponse>({
        queryKey: ['hierarchical-scope', clientId, managerAccountId, dateFrom, dateTo],
        queryFn: async (): Promise<ScopeResponse> => {
            if (!clientId || !managerAccountId) {
                return {
                    managers: [],
                    team_leaders: [],
                    field_users: [],
                    chains: [],
                    regions: [],
                    branches: [],
                };
            }

            console.log('🦸 HULK Scope Fetch:', { clientId, managerAccountId, dateFrom, dateTo });

            try {
                const { data, error } = await supabase.rpc('get_hierarchical_scope_context', {
                    p_client_id: clientId,
                    p_manager_account_id: managerAccountId,
                    p_date_from: dateFrom || null,
                    p_date_to: dateTo || null,
                });

                if (error) {
                    console.error('❌ Scope fetch failed:', {
                        message: error.message,
                        code: error.code,
                        hint: error.hint,
                        details: error.details,
                        fullError: JSON.stringify(error),
                    });
                    // Return empty scope instead of throwing to prevent UI crash
                    console.warn('⚠️ Returning empty scope due to RPC error');
                    return {
                        managers: [],
                        team_leaders: [],
                        field_users: [],
                        chains: [],
                        regions: [],
                        branches: [],
                    };
                }

                // Check if data is null or undefined
                if (!data) {
                    console.warn('⚠️ RPC returned null data, returning empty scope');
                    return {
                        managers: [],
                        team_leaders: [],
                        field_users: [],
                        chains: [],
                        regions: [],
                        branches: [],
                    };
                }

                console.log('🦸 HULK Scope Loaded:', {
                    managers: (data as ScopeResponse)?.managers?.length ?? 0,
                    team_leaders: (data as ScopeResponse)?.team_leaders?.length ?? 0,
                    field_users: (data as ScopeResponse)?.field_users?.length ?? 0,
                    chains: (data as ScopeResponse)?.chains?.length ?? 0,
                    regions: (data as ScopeResponse)?.regions?.length ?? 0,
                    branches: (data as ScopeResponse)?.branches?.length ?? 0,
                });
                console.log('🦸 HULK Raw Data:', data);

                return data as ScopeResponse;
            } catch (err) {
                console.error('❌ Unexpected error in scope fetch:', err);
                // Return empty scope on unexpected errors
                return {
                    managers: [],
                    team_leaders: [],
                    field_users: [],
                    chains: [],
                    regions: [],
                    branches: [],
                };
            }
        },
        enabled: Boolean(clientId) && Boolean(managerAccountId),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000,   // 30 minutes
    });

    const scope = query.data ?? null;

    // ========================================================================
    // BIDIRECTIONAL REACTIVE FILTERING (Zero-Latency Client-Side)
    // ========================================================================

    // Rule A (Top-Down): Team Leader -> Field Users
    const filteredFieldUsers = useMemo(() => {
        if (!scope?.field_users) return [];

        let result = scope.field_users;

        // If Team Leader selected, filter field users by that team leader
        if (selectedTeamLeaderId) {
            result = result.filter(u => u.team_leader_account_id === selectedTeamLeaderId);
        }

        // Rule C (Cross-Validation): If Region selected, filter users who operate in that region
        if (selectedRegionId) {
            result = result.filter(u => u.allowed_regions.includes(selectedRegionId));
        }

        // If Chain selected, filter users who operate in that chain
        if (selectedChainId) {
            result = result.filter(u => u.allowed_chains.includes(selectedChainId));
        }

        return result;
    }, [scope?.field_users, selectedTeamLeaderId, selectedRegionId, selectedChainId]);

    // Rule B (Bottom-Up): Field User -> Chains & Regions
    const filteredChains = useMemo(() => {
        if (!scope?.chains) return [];

        // If a specific field user is selected, filter chains to their allowed ones
        if (selectedFieldUserId) {
            const user = scope.field_users.find(u => u.user_id === selectedFieldUserId);
            if (user) {
                return scope.chains.filter(c => user.allowed_chains.includes(c.id));
            }
        }

        return scope.chains;
    }, [scope?.chains, scope?.field_users, selectedFieldUserId]);

    const filteredRegions = useMemo(() => {
        if (!scope?.regions) return [];

        // If a specific field user is selected, filter regions to their allowed ones
        if (selectedFieldUserId) {
            const user = scope.field_users.find(u => u.user_id === selectedFieldUserId);
            if (user) {
                return scope.regions.filter(r => user.allowed_regions.includes(r.id));
            }
        }

        return scope.regions;
    }, [scope?.regions, scope?.field_users, selectedFieldUserId]);

    // Team Leaders (filtered by manager if needed)
    const filteredTeamLeaders = useMemo(() => {
        if (!scope?.team_leaders) return [];
        return scope.team_leaders;
    }, [scope?.team_leaders]);

    // Branches (filtered by chain and region)
    const filteredBranches = useMemo(() => {
        if (!scope?.branches) return [];

        let result = scope.branches;

        if (selectedChainId) {
            result = result.filter(b => b.chain_id === selectedChainId);
        }

        if (selectedRegionId) {
            result = result.filter(b => b.region_id === selectedRegionId);
        }

        // If field user selected, filter to their allowed branches
        if (selectedFieldUserId) {
            const user = scope.field_users.find(u => u.user_id === selectedFieldUserId);
            if (user) {
                result = result.filter(b => user.allowed_branches.includes(b.id));
            }
        }

        return result;
    }, [scope?.branches, scope?.field_users, selectedChainId, selectedRegionId, selectedFieldUserId]);

    // ========================================================================
    // CONTEXT VALUE
    // ========================================================================
    const value: ScopeContextState = useMemo(() => ({
        scope,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,

        // Selected filters
        selectedTeamLeaderId,
        selectedFieldUserId,
        selectedChainId,
        selectedRegionId,
        selectedBranchId,

        // Setters
        setSelectedTeamLeaderId,
        setSelectedFieldUserId,
        setSelectedChainId,
        setSelectedRegionId,
        setSelectedBranchId,

        // Filtered options
        filteredTeamLeaders,
        filteredFieldUsers,
        filteredChains,
        filteredRegions,
        filteredBranches,

        // Refetch
        refetch: query.refetch,
    }), [
        scope,
        query.isLoading,
        query.isError,
        query.error,
        selectedTeamLeaderId,
        selectedFieldUserId,
        selectedChainId,
        selectedRegionId,
        selectedBranchId,
        filteredTeamLeaders,
        filteredFieldUsers,
        filteredChains,
        filteredRegions,
        filteredBranches,
        query.refetch,
    ]);

    return (
        <ScopeContext.Provider value={value}>
            {children}
        </ScopeContext.Provider>
    );
}

// ============================================================================
// HOOK: useScope
// ============================================================================
export function useScope(): ScopeContextState {
    const context = useContext(ScopeContext);
    if (!context) {
        throw new Error('useScope must be used within a ScopeProvider');
    }
    return context;
}
