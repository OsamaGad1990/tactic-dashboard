'use server';

import { getUserClientId } from '@/lib/services/client';
import { getPortalUser } from '@/lib/supabase/portal-user';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveRequest(requestId: string) {
    const user = await getPortalUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('approve_offroute_request', {
        p_request_id: requestId,
        p_approver_account_id: user.id,
    });

    if (error) {
        // ⏰ 12-Hour Rule: Specific error from RPC
        const isExpired = error.message?.includes('APPROVAL_EXPIRED_12H');
        console.error('Failed to approve request:', error.message);
        return {
            error: isExpired
                ? 'APPROVAL_EXPIRED_12H'
                : error.message
        };
    }

    revalidatePath('/dashboard/company/visit-requests');
    return { success: true, data };
}

export async function rejectRequest(requestId: string) {
    const user = await getPortalUser();
    if (!user) {
        return { error: 'Unauthorized' };
    }

    // Get user's client for multi-tenant scoping
    const clientId = await getUserClientId(user.id);
    if (!clientId) {
        return { error: 'No client association' };
    }

    const supabase = await createClient();

    const { error } = await supabase
        .from('visit_offroute_requests')
        .update({
            status: 'rejected',
            approver_account_id: user.id,
            decided_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('client_id', clientId) // Multi-tenant guard
        .eq('status', 'pending'); // Only reject pending requests

    if (error) {
        console.error('Failed to reject request:', error.message);
        return { error: error.message };
    }

    revalidatePath('/dashboard/company/visit-requests');
    return { success: true };
}
