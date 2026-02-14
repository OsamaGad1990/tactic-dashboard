'use server';

import { createClient } from '@/lib/supabase/server';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { getUserClientId } from '@/lib/services/client';

export interface FraudLockedUser {
    id: string;
    fullName: string | null;
    arabicName: string | null;
    email: string | null;
    fieldRole: string | null;
    fraudLockReason: string[] | null;
    fraudUnlockCount: number;
}

/**
 * Fetch all fraud-locked users within the current user's client
 */
export async function getFraudLockedUsers(): Promise<{ users: FraudLockedUser[]; error?: string }> {
    try {
        const user = await getPortalUser();
        if (!user) return { users: [], error: 'Not authenticated' };

        const clientId = await getUserClientId(user.id);
        if (!clientId) return { users: [], error: 'No client' };

        const supabase = await createClient();

        // Step 1: Get all user IDs belonging to this client
        const { data: clientUsers, error: cuError } = await supabase
            .from('client_users')
            .select('user_id')
            .eq('client_id', clientId);

        if (cuError) {
            console.error('Failed to fetch client users:', cuError);
            return { users: [], error: cuError.message };
        }

        const userIds = (clientUsers ?? [])
            .map((cu) => cu.user_id)
            .filter(Boolean) as string[];

        if (userIds.length === 0) return { users: [] };

        // Step 2: Get fraud-locked accounts from those user IDs
        const { data: lockedUsers, error: accError } = await supabase
            .from('accounts')
            .select('id, full_name, arabic_name, email, field_role, fraud_lock_reason, fraud_unlock_count')
            .in('id', userIds)
            .eq('is_fraud_locked', true)
            .order('fraud_unlock_count', { ascending: true, nullsFirst: true })
            .order('full_name', { ascending: true });

        if (accError) {
            console.error('Failed to fetch fraud-locked accounts:', accError);
            return { users: [], error: accError.message };
        }

        const mapped: FraudLockedUser[] = (lockedUsers ?? []).map((a) => ({
            id: a.id,
            fullName: a.full_name,
            arabicName: a.arabic_name,
            email: a.email,
            fieldRole: a.field_role,
            fraudLockReason: a.fraud_lock_reason,
            fraudUnlockCount: a.fraud_unlock_count ?? 0,
        }));

        return { users: mapped };
    } catch (err) {
        console.error('Failed to fetch fraud-locked users:', err);
        return { users: [], error: String(err) };
    }
}

/**
 * Release a user from fraud lock (set is_fraud_locked=false, increment unlock count)
 */
export async function releaseFraudUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getPortalUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        const supabase = await createClient();

        // First get the current unlock count
        const { data: current } = await supabase
            .from('accounts')
            .select('fraud_unlock_count')
            .eq('id', userId)
            .single();

        const currentCount = current?.fraud_unlock_count ?? 0;

        // Update: unlock + increment count
        const { error } = await supabase
            .from('accounts')
            .update({
                is_fraud_locked: false,
                fraud_lock_reason: null,
                fraud_unlock_count: currentCount + 1,
            })
            .eq('id', userId);

        if (error) {
            console.error('Failed to release fraud user:', error);
            return { success: false, error: error.message };
        }

        console.log(`✅ Fraud user released: ${userId} by admin: ${user.id}`);
        return { success: true };
    } catch (err) {
        console.error('Failed to release fraud user:', err);
        return { success: false, error: String(err) };
    }
}
