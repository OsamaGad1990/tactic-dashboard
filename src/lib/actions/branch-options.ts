// ============================================================================
// SERVER ACTION: getBranchOptions
// Purpose: Fetch branches dynamically based on chainId/regionId (Server-Side Cascading)
// Performance: Uses Index Scans on chain_id and region_id
// ============================================================================
'use server';

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// ============================================================================
// TYPES
// ============================================================================
export interface BranchFilterOption {
    id: string;
    name: string;
    name_ar: string | null;
}

interface GetBranchOptionsParams {
    clientId: string;
    chainId: string | null;
    regionId: string | null;
}

// ============================================================================
// SERVER ACTION
// ============================================================================
export async function getBranchOptions(
    params: GetBranchOptionsParams
): Promise<BranchFilterOption[]> {
    const { clientId, chainId, regionId } = params;

    console.log('🏪 Fetching branch options:', { clientId, chainId, regionId });

    try {
        // Execute with parameterized values (Drizzle SQL template)
        const result = await db.execute(sql`
            SELECT 
                m.id,
                m.name,
                m.name_ar
            FROM markets m
            WHERE m.client_id = ${clientId}
                ${chainId ? sql`AND m.chain_id = ${chainId}` : sql``}
                ${regionId ? sql`AND m.region_id = ${regionId}` : sql``}
            ORDER BY m.name ASC
            LIMIT 500
        `);

        // Drizzle RowList implements iterable, spread to array
        const rows: BranchFilterOption[] = [...result].map((row) => ({
            id: String(row.id),
            name: String(row.name),
            name_ar: row.name_ar ? String(row.name_ar) : null,
        }));

        console.log('🏪 Branch options count:', rows.length);

        return rows;
    } catch (error) {
        console.error('❌ Error fetching branch options:', error);
        return [];
    }
}

