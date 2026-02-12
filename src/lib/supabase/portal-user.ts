// Portal User Session - Fetch enriched user data from Supabase
// =========================================================
// 🛡️ SECURITY: This file is the Gatekeeper of the Portal.
// If getPortalUser() returns null, the user is redirected to login.
// All access decisions (fraud, status, deactivation) are enforced HERE.
// =========================================================
import { createClient } from '@/lib/supabase/server';
import type { PortalUser } from '@/lib/types/user';
import { cache } from 'react';

/**
 * Get the current authenticated user's portal profile
 * Returns null if not authenticated, account is missing, or access is denied
 * Cached per request to prevent duplicate DB calls
 */
export const getPortalUser = cache(async (): Promise<PortalUser | null> => {
    const supabase = await createClient();

    // =========================================================
    // STEP 1: Check Auth Session
    // =========================================================
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        // 🔍 DIAGNOSTIC: Distinguish between "no session" vs "auth error"
        if (authError) {
            console.error('[PORTAL-USER] ❌ Auth error:', authError.message, '| Status:', authError.status);
        }
        // Silent return for no session (normal behavior for unauthenticated visitors)
        return null;
    }

    // =========================================================
    // STEP 2: Fetch Account Data with explicit Security Fields
    // =========================================================
    const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select(`
            id, auth_user_id, email, username, full_name, arabic_name,
            avatar_url, portal_role, field_role, account_status,
            is_fraud_locked, org_id, org_type, division_id,
            deactivated_at
        `)
        .eq('auth_user_id', user.id)
        .single();

    // =========================================================
    // STEP 3: Handle DB Errors
    // =========================================================
    if (accountError || !account) {
        console.error(
            '[PORTAL-USER] ❌ Account lookup failed |',
            'auth_user_id:', user.id, '|',
            'Error:', accountError?.message ?? 'No account row found (RLS or missing row)', '|',
            'Code:', accountError?.code ?? 'N/A', '|',
            'Details:', accountError?.details ?? 'N/A'
        );
        return null;
    }

    // =========================================================
    // 🛑 SECURITY GUARDS (THE FIREWALL)
    // =========================================================

    // Guard A: Fraud Lock
    if (account.is_fraud_locked) {
        console.error(`[PORTAL-USER] ⛔ SECURITY ALERT: Fraud-locked user attempted access. UserID: ${account.id}`);
        return null;
    }

    // Guard B: Account Status (Strict)
    // Only 'active', 'pending', and 'must_change_password' are allowed through the gate.
    // 'pending' and 'must_change_password' are handled downstream by proxy.ts (redirect to change-password).
    // 'suspended' and 'inactive' are BLOCKED here.
    const BLOCKED_STATUSES: string[] = ['suspended', 'inactive'];
    if (BLOCKED_STATUSES.includes(account.account_status)) {
        console.error(`[PORTAL-USER] ⛔ ACCESS DENIED: User status is '${account.account_status}'. UserID: ${account.id}`);
        return null;
    }

    // Guard C: Deactivation Date
    if (account.deactivated_at && new Date(account.deactivated_at) < new Date()) {
        console.error(`[PORTAL-USER] ⛔ ACCESS DENIED: Account deactivated on ${account.deactivated_at}. UserID: ${account.id}`);
        return null;
    }

    // =========================================================
    // ✅ ACCESS GRANTED — Build enriched portal user
    // =========================================================
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
});

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
        console.error('[PORTAL-USER] ❌ Failed to fetch client IDs:', error.message);
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
        console.error('[PORTAL-USER] ❌ Failed to fetch subordinates:', error.message);
        return [];
    }

    return data?.map(row => row.child_account_id) ?? [];
}
