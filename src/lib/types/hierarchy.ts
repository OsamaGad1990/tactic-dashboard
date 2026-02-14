// ============================================================================
// HIERARCHY TYPES - Interfaces for RPC responses
// ============================================================================

/**
 * Subordinate node from get_org_subtree RPC
 */
export interface SubordinateNode {
    account_id: string;
    full_name: string;
    field_role: FieldRole | null;
    is_active: boolean;
    depth: number;
    path: string;
    relationship_type: RelationshipType;
    parent_id: string | null;
}

/**
 * Field roles in the hierarchy (must match database enum)
 */
export type FieldRole =
    | 'team_leader'
    | 'mch'
    | 'promoter'
    | 'promoplus'
    | 'pharmacy_user'
    | 'none';

/**
 * Relationship type between nodes
 */
export type RelationshipType =
    | 'root'
    | 'hierarchy'
    | 'managed_tl'
    | 'membership';

/**
 * Chain filter option
 */
export interface ChainOption {
    id: string;
    name: string;
    name_ar: string | null;
}

/**
 * Region filter option
 */
export interface RegionOption {
    id: string;
    name: string;
    name_ar: string | null;
}

/**
 * Branch (Market) filter option
 */
export interface BranchOption {
    id: string;
    name: string;
    name_ar: string | null;
    chain_id: string | null;
    region_id: string | null;
}

/**
 * Dashboard filters response from get_dashboard_filters RPC
 */
export interface DashboardFiltersResponse {
    chains: ChainOption[];
    regions: RegionOption[];
    branches: BranchOption[];
}

/**
 * Date range for filtering (using string for HTML date input compatibility)
 */
export interface DateRange {
    from: string | null;
    to: string | null;
}

/**
 * Active filter state for the dashboard
 */
export interface ActiveFilters {
    dateRange: DateRange;
    managerId: string | null;
    chainId: string | null;
    regionId: string | null;
    branchId: string | null;
    teamLeaderId: string | null;
    fieldStaffId: string | null;
    requestStatus: string | null;
    completionSpeed: string | null;
    visitStatus: string | null;
}

/**
 * Default empty filters
 */
export const DEFAULT_FILTERS: ActiveFilters = {
    dateRange: { from: null, to: null },
    managerId: null,
    chainId: null,
    regionId: null,
    branchId: null,
    teamLeaderId: null,
    fieldStaffId: null,
    requestStatus: null,
    completionSpeed: null,
    visitStatus: null,
};
