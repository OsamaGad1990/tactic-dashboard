// Portal User Session - Fetch enriched user data from Supabase
import { createClient } from '@/lib/supabase/server';
import type { PortalUser, AccountRow } from '@/lib/types/user';

/**
 * Get the current authenticated user's portal profile
 * Returns null if not authenticated or no account found
 */
export async function getPortalUser(): Promise<PortalUser | null> {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return null;
    }

    // Fetch account with portal role and org info
    const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select(`
            id,
            auth_user_id,
            email,
            username,
            full_name,
            arabic_name,
            avatar_url,
            portal_role,
            field_role,
            account_status,
            is_fraud_locked,
            org_id,
            org_type,
            division_id
        `)
        .eq('auth_user_id', user.id)
        .single();

    if (accountError || !account) {
        console.error('Failed to fetch account:', accountError?.message);
        return null;
    }

    // Build enriched portal user
    const portalUser: PortalUser = {
        // Core identity
        id: account.id,
        authUserId: account.auth_user_id,
        email: account.email,
        username: account.username,
        fullName: account.full_name,
        arabicName: account.arabic_name,
        avatarUrl: account.avatar_url,

        // Role & Access
        portalRole: account.portal_role,
        fieldRole: account.field_role,
        accountStatus: account.account_status,
        isFraudLocked: account.is_fraud_locked ?? false,

        // Organization Scope
        orgId: account.org_id,
        orgType: account.org_type,
        divisionId: account.division_id,

        // Computed Access Flags
        canAccessAll: account.portal_role === 'super_admin',
        isOperator: account.portal_role === 'aggregator_admin',
        isClientAdmin: account.portal_role === 'client_admin',
    };

    return portalUser;
}

/**
 * Get accessible client IDs for a user
 * - super_admin: all clients
 * - aggregator_admin: clients via client_portal_hierarchy
 * - client_admin: direct client assignment via client_users
 */
export async function getUserClientIds(accountId: string): Promise<string[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('user_id', accountId);

    if (error) {
        console.error('Failed to fetch client IDs:', error.message);
        return [];
    }

    return data?.map(row => row.client_id) ?? [];
}

/**
 * Get subordinate account IDs from hierarchy
 * Uses client_portal_hierarchy for recursive lookup
 */
export async function getSubordinateIds(accountId: string): Promise<string[]> {
    const supabase = await createClient();

    // Get direct subordinates from hierarchy
    const { data, error } = await supabase
        .from('client_portal_hierarchy')
        .select('child_account_id')
        .eq('parent_account_id', accountId);

    if (error) {
        console.error('Failed to fetch subordinates:', error.message);
        return [];
    }

    return data?.map(row => row.child_account_id) ?? [];
}
