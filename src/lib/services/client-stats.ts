// Client Stats Service - Optimized with Drizzle ORM (Single Query)
import { getClient } from '@/lib/db';
import { cache } from 'react';

export interface ClientStats {
    teamMembers: number;
    activeMarkets: number;
    products: number;
    todayVisits: number;
}

/**
 * Get all client stats in ONE optimized SQL query
 * This replaces 4 separate REST API calls with 1 direct PostgreSQL query
 */
export const getClientStats = cache(async (clientId: string): Promise<ClientStats> => {
    try {
        // Single optimized query using subqueries
        const sql = getClient();
        const result = await sql`
            SELECT 
                (SELECT COUNT(*) FROM client_users WHERE client_id = ${clientId}::uuid)::int as team_members,
                (SELECT COUNT(*) FROM client_markets WHERE client_id = ${clientId}::uuid)::int as markets,
                (SELECT COUNT(*) FROM client_products WHERE client_id = ${clientId}::uuid)::int as products,
                (SELECT COUNT(*) FROM visit_core WHERE client_id = ${clientId}::uuid AND created_at >= CURRENT_DATE)::int as today_visits
        `;

        const stats = result[0];

        return {
            teamMembers: stats?.team_members ?? 0,
            activeMarkets: stats?.markets ?? 0,
            products: stats?.products ?? 0,
            todayVisits: stats?.today_visits ?? 0,
        };
    } catch (error) {
        console.error('Failed to fetch client stats:', {
            error: error instanceof Error ? error.message : error,
            clientId,
            databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        });
        return {
            teamMembers: 0,
            activeMarkets: 0,
            products: 0,
            todayVisits: 0,
        };
    }
});
