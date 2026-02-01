// Admin Dashboard KPI Stats Service
import { createClient } from '@/lib/supabase/server';

export interface AdminKPIs {
    totalClients: number;
    totalFieldForce: number;
    liveVisitsToday: number;
    pendingApprovals: number;
}

/**
 * Get high-level KPIs for the super_admin dashboard
 * Uses count with head: true for performance
 */
export async function getAdminKPIs(): Promise<AdminKPIs> {
    const supabase = await createClient();

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Parallel fetch all counts
    const [
        clientsResult,
        fieldForceResult,
        visitsResult,
        approvalsResult,
    ] = await Promise.all([
        // Total active clients
        supabase
            .from('clients')
            .select('*', { count: 'exact', head: true }),

        // Total field force (merchandisers, supervisors, team_leaders, etc.)
        supabase
            .from('accounts')
            .select('*', { count: 'exact', head: true })
            .in('field_role', ['mch', 'promoter', 'promoplus', 'team_leader']),

        // Live visits today
        supabase
            .from('visit_core')
            .select('*', { count: 'exact', head: true })
            .eq('visit_date', today),

        // Pending off-route approvals
        supabase
            .from('visit_offroute_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),
    ]);

    return {
        totalClients: clientsResult.count ?? 0,
        totalFieldForce: fieldForceResult.count ?? 0,
        liveVisitsToday: visitsResult.count ?? 0,
        pendingApprovals: approvalsResult.count ?? 0,
    };
}

/**
 * Get operator-specific KPIs
 */
export async function getOperatorKPIs(accountId: string) {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // Get clients assigned to this operator
    const { data: clientUsers } = await supabase
        .from('client_users')
        .select('client_id')
        .eq('user_id', accountId);

    const clientIds = clientUsers?.map(c => c.client_id) ?? [];

    if (clientIds.length === 0) {
        return {
            managedClients: 0,
            activeTeams: 0,
            fieldUsers: 0,
            visitsToday: 0,
        };
    }

    const [teamsResult, usersResult, visitsResult] = await Promise.all([
        // Active teams (unique divisions)
        supabase
            .from('accounts')
            .select('division_id', { count: 'exact', head: true })
            .in('org_id', clientIds),

        // Field users under managed clients
        supabase
            .from('accounts')
            .select('*', { count: 'exact', head: true })
            .in('org_id', clientIds)
            .in('field_role', ['mch', 'promoter', 'promoplus', 'team_leader']),

        // Visits today for managed clients
        supabase
            .from('visit_core')
            .select('*', { count: 'exact', head: true })
            .in('client_id', clientIds)
            .eq('visit_date', today),
    ]);

    return {
        managedClients: clientIds.length,
        activeTeams: teamsResult.count ?? 0,
        fieldUsers: usersResult.count ?? 0,
        visitsToday: visitsResult.count ?? 0,
    };
}
