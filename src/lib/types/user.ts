// Portal User Types - Role-Based Access Control
import type { Database } from './database';

// Extract enums from database types
export type PortalRole = Database['public']['Enums']['portal_role'];
export type AccountStatus = Database['public']['Enums']['account_status'];
export type OrgType = Database['public']['Enums']['org_type'];
export type FieldRole = Database['public']['Enums']['field_role'];

// Portal role hierarchy (higher index = more access)
export const PORTAL_ROLE_HIERARCHY: Record<PortalRole, number> = {
    none: 0,
    reporter: 1,
    client_admin: 2,
    aggregator_admin: 3,
    super_admin: 4,
};

// Dashboard routes by role
export const DASHBOARD_ROUTES: Record<PortalRole, string> = {
    none: '/login',
    reporter: '/dashboard/reports',
    client_admin: '/dashboard/company',
    aggregator_admin: '/dashboard/operator',
    super_admin: '/dashboard/admin',
};

// Portal user with enriched session data
export interface PortalUser {
    // Core identity
    id: string;                    // accounts.id
    authUserId: string;            // accounts.auth_user_id
    email: string | null;
    username: string;
    fullName: string | null;
    arabicName: string | null;
    avatarUrl: string | null;

    // Role & Access
    portalRole: PortalRole;
    fieldRole: FieldRole;
    accountStatus: AccountStatus;
    isFraudLocked: boolean;

    // Organization Scope
    orgId: string | null;          // Direct org assignment
    orgType: OrgType;
    divisionId: string | null;

    // Computed Access Flags
    canAccessAll: boolean;         // super_admin
    isOperator: boolean;           // aggregator_admin
    isClientAdmin: boolean;        // client_admin

    // Scoped Data (populated separately)
    clientIds?: string[];          // Accessible clients
    subordinateIds?: string[];     // Hierarchy subordinates
}

// Account row type from database
export type AccountRow = Database['public']['Tables']['accounts']['Row'];

// Helper to check if user has minimum role level
export function hasMinimumRole(userRole: PortalRole, requiredRole: PortalRole): boolean {
    return PORTAL_ROLE_HIERARCHY[userRole] >= PORTAL_ROLE_HIERARCHY[requiredRole];
}

// Helper to get dashboard route for role
export function getDashboardRoute(role: PortalRole, locale: string = 'ar'): string {
    return `/${locale}${DASHBOARD_ROUTES[role]}`;
}
