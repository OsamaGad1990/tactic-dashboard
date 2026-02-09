// Feature Service - Server-side feature flag checking
// Uses Supabase server client + React.cache for request deduplication
// Supports division-scoped features: division_id=NULL → Global, division_id=UUID → Division-Specific
import { createClient } from '@/lib/supabase/server';
import { cache } from 'react';

/**
 * Get all enabled feature keys for a client - cached per request.
 * Respects division scoping:
 *  - Global features (division_id IS NULL) → apply to ALL divisions
 *  - Division-specific features → apply only to that division
 * Returns an empty array if no features found or on error.
 */
export const getClientFeatures = cache(async (clientId: string, divisionId?: string | null): Promise<string[]> => {
    try {
        const supabase = await createClient();

        let query = supabase
            .from('client_features')
            .select('feature_key')
            .eq('client_id', clientId)
            .eq('is_enabled', true);

        // Division scoping: global features + division-specific features
        if (divisionId) {
            query = query.or(`division_id.is.null,division_id.eq.${divisionId}`);
        } else {
            // No division context → only global features
            query = query.is('division_id', null);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Failed to fetch client features:', error.message);
            return [];
        }

        return (data ?? []).map(row => row.feature_key);
    } catch (error) {
        console.error('Feature service error:', error);
        return [];
    }
});

/**
 * Check if a specific feature is enabled for a client - cached per request.
 * Supports division scoping. Defaults to false if feature not found (fail-closed).
 */
export const isFeatureEnabled = cache(async (clientId: string, featureKey: string, divisionId?: string | null): Promise<boolean> => {
    const features = await getClientFeatures(clientId, divisionId);
    return features.includes(featureKey);
});
