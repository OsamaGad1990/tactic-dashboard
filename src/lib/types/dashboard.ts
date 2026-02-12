// ============================================================================
// DASHBOARD TYPES - Strict interfaces for get_dashboard_ops_metrics RPC
// ============================================================================

/**
 * Visit metrics from Section 1 of the RPC response
 */
export interface VisitMetrics {
    total_visits: number;
    completed_visits: number;
    incomplete_visits: number;
    in_progress: number;
    cancelled_visits: number;
    no_visit_count: number;
    completion_rate: number;
    status_breakdown: VisitStatusBreakdown[];
}

export interface VisitStatusBreakdown {
    status: string;
    count: number;
}

/**
 * Workforce metrics from Section 2 of the RPC response
 * Includes LAG()-based travel time and commute time
 */
export interface WorkforceMetrics {
    total_work_minutes: number;
    total_inter_travel_minutes: number;
    total_commute_minutes: number;
    total_travel_minutes: number;
    avg_work_minutes_per_visit: number;
    avg_travel_minutes_per_gap: number;
    total_products: number;
    available_count: number;
    unavailable_count: number;
    availability_rate: number;
}

/**
 * Notification metrics from Section 3 of the RPC response
 * Scoped to the user's army (downline) only
 */
export interface NotificationMetrics {
    total: number;
    read_count: number;
    acted_count: number;
    read_rate: number;
    execution_rate: number;
    avg_wait_hours: number;
}

/**
 * Top performer entry
 */
export interface TopPerformer {
    user_id: string;
    name_en: string;
    name_ar: string;
    avatar_url: string | null;
    role: string | null;
    total_visits: number;
    completed_visits: number;
    completion_rate: number;
}

/**
 * Fraud suspect entry (v3.7) — users with avg trust < 100%
 */
export interface FraudSuspect {
    user_id: string;
    name_en: string;
    name_ar: string;
    avatar_url: string | null;
    role: string | null;
    is_fraud_locked: boolean;
    fraud_unlock_count: number;
    avg_trust_score: number;
    total_visits: number;
}

/**
 * Metadata from the RPC response
 */
export interface MetricsMeta {
    date_from: string;
    date_to: string;
    generated_at: string;
}

/**
 * Complete response from get_dashboard_ops_metrics RPC
 */
export interface DashboardMetrics {
    visits: VisitMetrics;
    workforce: WorkforceMetrics;
    notifications: NotificationMetrics;
    top_performers: TopPerformer[];
    fraud_suspects: FraudSuspect[];
    meta: MetricsMeta;
}

/**
 * RPC parameters for get_dashboard_ops_metrics
 */
export interface DashboardMetricsParams {
    p_date_from: string;
    p_date_to: string;
    p_market_ids: string[] | null;
    p_staff_ids: string[] | null;
}
