// Client Service - Fetch client data for portal users
import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export interface ClientInfo {
    id: string;
    logoUrl: string | null;
    nameEn: string;
    nameAr: string | null;
}

const ORG_LOGOS_BUCKET = 'org-logos';
const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Get a signed URL for a file in Supabase storage
 */
async function getSignedUrl(bucket: string, path: string): Promise<string | null> {
    const supabase = await createClient();

    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, SIGNED_URL_EXPIRY);

    if (error) {
        console.error('Failed to create signed URL:', error.message);
        return null;
    }

    return data.signedUrl;
}

/**
 * Get client info - cached per request
 */
export const getClientInfo = cache(async (clientId: string): Promise<ClientInfo | null> => {
    const supabase = await createClient();

    // Fetch client (for logo)
    const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, logo_url')
        .eq('id', clientId)
        .single();

    if (clientError || !client) {
        console.error('Failed to fetch client:', clientError?.message);
        return null;
    }

    // Fetch organization (for name) - clients.id is FK to organizations.id
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('name, name_ar')
        .eq('id', clientId)
        .single();

    if (orgError || !org) {
        console.error('Failed to fetch organization:', orgError?.message);
        return null;
    }

    // Get signed URL for logo if exists
    // Path structure: clients/{clientId}/{filename}
    let logoUrl: string | null = null;
    if (client.logo_url) {
        if (client.logo_url.startsWith('http')) {
            logoUrl = client.logo_url;
        } else {
            const fullPath = `clients/${clientId}/${client.logo_url}`;
            logoUrl = await getSignedUrl(ORG_LOGOS_BUCKET, fullPath);
        }
    }

    return {
        id: client.id,
        logoUrl,
        nameEn: org.name,
        nameAr: org.name_ar,
    };
});

/**
 * Get client ID for current user - cached per request
 */
export const getUserClientId = cache(async (accountId: string): Promise<string | null> => {
    const supabase = await createClient();

    // Try client_portal_user_roles first (for portal users)
    const { data: portalRole, error: portalError } = await supabase
        .from('client_portal_user_roles')
        .select('client_id')
        .eq('account_id', accountId)
        .limit(1)
        .single();

    if (!portalError && portalRole?.client_id) {
        return portalRole.client_id;
    }

    // Fallback to client_users (for field users)
    const { data: clientUser, error: clientError } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('user_id', accountId)
        .limit(1)
        .single();

    if (!clientError && clientUser?.client_id) {
        return clientUser.client_id;
    }

    return null;
});

export interface ClientRole {
    key: string;
    labelEn: string;
    labelAr: string;
}

// Map portal_role to client_portal_role_catalog key
const PORTAL_ROLE_TO_CATALOG: Record<string, string> = {
    'client_admin': 'admin',
    'aggregator_admin': 'admin',
    'super_admin': 'admin',
    'reporter': 'salesman',  // fallback
};

/**
 * Get user's client portal role - cached per request
 */
export const getUserClientRole = cache(async (accountId: string): Promise<ClientRole | null> => {
    const supabase = await createClient();

    // First try: get role_key from client_portal_user_roles
    const { data: userRole } = await supabase
        .from('client_portal_user_roles')
        .select('role_key')
        .eq('account_id', accountId)
        .limit(1)
        .single();

    let roleKey: string | null = userRole?.role_key || null;

    // Second try: if no role in client_portal_user_roles, check portal_role from accounts
    if (!roleKey) {
        const { data: account } = await supabase
            .from('accounts')
            .select('portal_role')
            .eq('id', accountId)
            .single();

        if (account?.portal_role) {
            roleKey = PORTAL_ROLE_TO_CATALOG[account.portal_role] || null;
        }
    }

    if (!roleKey) {
        return null;
    }

    // Fetch role labels from catalog
    const { data: roleInfo, error: catalogError } = await supabase
        .from('client_portal_role_catalog')
        .select('key, label_en, label_ar')
        .eq('key', roleKey)
        .single();

    if (catalogError || !roleInfo) {
        console.error('Failed to fetch role catalog:', catalogError?.message);
        return null;
    }

    return {
        key: roleInfo.key,
        labelEn: roleInfo.label_en,
        labelAr: roleInfo.label_ar,
    };
});
