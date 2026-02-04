// Client Stats Service - Fetch real stats from database
import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

export interface ClientStats {
    teamMembers: number;
    activeMarkets: number;
    products: number;
    todayVisits: number;
}

/**
 * Get client stats from database - cached per request
 */
export const getClientStats = cache(async (clientId: string): Promise<ClientStats> => {
    const supabase = await createClient();

    // Get today's date for visits filter
    const today = new Date().toISOString().split('T')[0];

    // Run all queries in parallel
    const [teamResult, marketsResult, productsResult, visitsResult] = await Promise.all([
        // Team members count
        supabase
            .from('client_users')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId),

        // Active markets count
        supabase
            .from('client_markets')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('is_active', true),

        // Products count
        supabase
            .from('client_products')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .eq('is_active', true),

        // Today's visits count from visit_core
        supabase
            .from('visit_core')
            .select('id', { count: 'exact', head: true })
            .eq('client_id', clientId)
            .gte('created_at', today),
    ]);

    return {
        teamMembers: teamResult.count ?? 0,
        activeMarkets: marketsResult.count ?? 0,
        products: productsResult.count ?? 0,
        todayVisits: visitsResult.count ?? 0,
    };
});
