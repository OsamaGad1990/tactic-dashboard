// Supabase Anonymous Client - For cached functions that don't need user session
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Create an anonymous Supabase client for cached/static data fetching
 * This client doesn't use cookies, so it can be used inside unstable_cache
 */
export function createAnonClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
}
