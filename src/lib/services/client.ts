// Client Service - Fetch client data using Drizzle ORM (Direct PostgreSQL)
import { db } from '@/lib/db';
import { clients, organizations, clientPortalUserRoles, clientPortalRoleCatalog, accounts, clientUsers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

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
 * Get client info - cached per request (Drizzle ORM)
 */
export const getClientInfo = cache(async (clientId: string): Promise<ClientInfo | null> => {
    try {
        const result = await db
            .select({
                id: clients.id,
                logoUrl: clients.logoUrl,
                nameEn: organizations.name,
                nameAr: organizations.nameAr,
            })
            .from(clients)
            .innerJoin(organizations, eq(clients.id, organizations.id))
            .where(eq(clients.id, clientId))
            .limit(1);

        if (result.length === 0) {
            return null;
        }

        const client = result[0];

        // Get signed URL for logo if exists
        let logoUrl: string | null = null;
        if (client.logoUrl) {
            if (client.logoUrl.startsWith('http')) {
                logoUrl = client.logoUrl;
            } else {
                const fullPath = `clients/${clientId}/${client.logoUrl}`;
                logoUrl = await getSignedUrl(ORG_LOGOS_BUCKET, fullPath);
            }
        }

        return {
            id: client.id,
            logoUrl,
            nameEn: client.nameEn,
            nameAr: client.nameAr,
        };
    } catch (error) {
        console.error('Failed to fetch client info:', error);
        return null;
    }
});

/**
 * Get client ID for current user - cached per request (Drizzle ORM)
 */
export const getUserClientId = cache(async (accountId: string): Promise<string | null> => {
    try {
        // Try client_portal_user_roles first (for portal users)
        const portalRole = await db
            .select({ clientId: clientPortalUserRoles.clientId })
            .from(clientPortalUserRoles)
            .where(eq(clientPortalUserRoles.accountId, accountId))
            .limit(1);

        if (portalRole.length > 0 && portalRole[0].clientId) {
            return portalRole[0].clientId;
        }

        // Fallback to client_users (for field users)
        const clientUser = await db
            .select({ clientId: clientUsers.clientId })
            .from(clientUsers)
            .where(eq(clientUsers.userId, accountId))
            .limit(1);

        if (clientUser.length > 0 && clientUser[0].clientId) {
            return clientUser[0].clientId;
        }

        return null;
    } catch (error) {
        console.error('Failed to fetch user client ID:', error);
        return null;
    }
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
    'reporter': 'salesman',
};

/**
 * Get user's client portal role - cached per request (Drizzle ORM)
 */
export const getUserClientRole = cache(async (accountId: string): Promise<ClientRole | null> => {
    try {
        // First try: get role_key from client_portal_user_roles
        const userRole = await db
            .select({ roleKey: clientPortalUserRoles.roleKey })
            .from(clientPortalUserRoles)
            .where(eq(clientPortalUserRoles.accountId, accountId))
            .limit(1);

        let roleKey: string | null = userRole.length > 0 ? userRole[0].roleKey : null;

        // Second try: if no role in client_portal_user_roles, check portal_role from accounts
        if (!roleKey) {
            const account = await db
                .select({ portalRole: accounts.portalRole })
                .from(accounts)
                .where(eq(accounts.id, accountId))
                .limit(1);

            if (account.length > 0 && account[0].portalRole) {
                roleKey = PORTAL_ROLE_TO_CATALOG[account[0].portalRole] || null;
            }
        }

        if (!roleKey) {
            return null;
        }

        // Fetch role labels from catalog
        const roleInfo = await db
            .select({
                key: clientPortalRoleCatalog.key,
                labelEn: clientPortalRoleCatalog.labelEn,
                labelAr: clientPortalRoleCatalog.labelAr,
            })
            .from(clientPortalRoleCatalog)
            .where(eq(clientPortalRoleCatalog.key, roleKey))
            .limit(1);

        if (roleInfo.length === 0) {
            return null;
        }

        return {
            key: roleInfo[0].key,
            labelEn: roleInfo[0].labelEn,
            labelAr: roleInfo[0].labelAr,
        };
    } catch (error) {
        console.error('Failed to fetch user client role:', error);
        return null;
    }
});
