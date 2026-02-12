-- ============================================================
-- RPC: get_dashboard_ops_metrics v3.7 — Fraud Leaderboard
--
-- Changes from v3.6:
--   1. NEW COLUMN: accounts.fraud_unlock_count integer DEFAULT 0
--   2. NEW CTE: fraud_suspects — users with avg trust_score < 100%
--      - Ordered by avg_trust_score ASC (lowest trust = #1 suspect)
--      - Limit 10
--   3. Added "fraud_suspects" key to final JSON assembly
-- ============================================================

-- ─── Step 1: Add fraud_unlock_count column ──────────────────
ALTER TABLE public.accounts
ADD COLUMN IF NOT EXISTS fraud_unlock_count integer DEFAULT 0;

-- ─── Step 2: Drop old signatures ────────────────────────────
DROP FUNCTION IF EXISTS public.get_dashboard_ops_metrics(date, date);
DROP FUNCTION IF EXISTS public.get_dashboard_ops_metrics(date, date, uuid[]);
DROP FUNCTION IF EXISTS public.get_dashboard_ops_metrics(date, date, uuid[], uuid[]);

CREATE OR REPLACE FUNCTION public.get_dashboard_ops_metrics(
    p_date_from   date,
    p_date_to     date,
    p_market_ids  uuid[] DEFAULT NULL,
    p_staff_ids   uuid[] DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- ─── Guard: Validate date range ───────────────────────────
    IF p_date_from IS NULL OR p_date_to IS NULL THEN
        RAISE EXCEPTION 'INVALID_DATE_RANGE: p_date_from and p_date_to are required'
            USING ERRCODE = 'P0001';
    END IF;

    IF p_date_to < p_date_from THEN
        RAISE EXCEPTION 'INVALID_DATE_RANGE: p_date_to (%) must be >= p_date_from (%)',
            p_date_to, p_date_from
            USING ERRCODE = 'P0001';
    END IF;

    WITH
    -- ═══════════════════════════════════════════════════════════
    -- STEP 0: Materialize reusable scope CTEs (once)
    -- ═══════════════════════════════════════════════════════════
    scope AS (
        SELECT base.market_id
        FROM public.get_team_market_scope() base
        WHERE p_market_ids IS NULL
           OR base.market_id = ANY(p_market_ids)
    ),
    army AS (
        SELECT account_id FROM public.get_coordinator_deep_team_ids()
    ),

    -- ═══════════════════════════════════════════════════════════
    -- SECTION 1: VISITS
    -- ═══════════════════════════════════════════════════════════
    scoped_visits AS (
        SELECT
            vc.id,
            vc.user_id,
            vc.status,
            vc.visit_date,
            vc.actual_start,
            vc.actual_end,
            vc.trust_score
        FROM public.visit_core vc
        INNER JOIN scope s ON vc.market_id = s.market_id
        WHERE vc.visit_date BETWEEN p_date_from AND p_date_to
          AND (p_staff_ids IS NULL OR vc.user_id = ANY(p_staff_ids))
    ),

    visit_kpis AS (
        SELECT
            COUNT(*)                                                    AS total_visits,
            COUNT(*) FILTER (WHERE status = 'completed')               AS completed_visits,
            COUNT(*) FILTER (WHERE status IN ('planned', 'cancelled', 'no_visit', 'false_visit'))
                                                                       AS incomplete_visits,
            COUNT(*) FILTER (WHERE status = 'in_progress')             AS in_progress_visits,
            COUNT(*) FILTER (WHERE status = 'cancelled')               AS cancelled_visits,
            COUNT(*) FILTER (WHERE status = 'no_visit')                AS no_visit_count,
            CASE
                WHEN COUNT(*) > 0
                THEN ROUND(
                    (COUNT(*) FILTER (WHERE status = 'completed'))::numeric
                    / COUNT(*)::numeric * 100, 1
                )
                ELSE 0
            END                                                        AS completion_rate
        FROM scoped_visits
    ),

    visit_status_breakdown AS (
        SELECT status::text AS status, COUNT(*) AS count
        FROM scoped_visits
        GROUP BY status
        ORDER BY count DESC
    ),

    -- ═══════════════════════════════════════════════════════════
    -- SECTION 2: WORKFORCE — Work Time + Travel Time
    -- ═══════════════════════════════════════════════════════════
    visit_time_windows AS (
        SELECT
            sv.user_id,
            sv.visit_date,
            sv.actual_start,
            sv.actual_end,
            EXTRACT(EPOCH FROM (sv.actual_end - sv.actual_start)) / 60.0 AS work_minutes,
            LAG(sv.actual_end) OVER (
                PARTITION BY sv.user_id, sv.visit_date
                ORDER BY sv.actual_start
            ) AS prev_visit_end
        FROM scoped_visits sv
        WHERE sv.actual_start IS NOT NULL
          AND sv.actual_end   IS NOT NULL
    ),

    inter_visit_gaps AS (
        SELECT
            user_id,
            visit_date,
            work_minutes,
            CASE
                WHEN prev_visit_end IS NOT NULL AND actual_start > prev_visit_end
                THEN EXTRACT(EPOCH FROM (actual_start - prev_visit_end)) / 60.0
                ELSE 0
            END AS inter_travel_minutes
        FROM visit_time_windows
    ),

    first_events_per_day AS (
        SELECT
            sv.user_id,
            sv.visit_date,
            MIN(sv.actual_start) AS first_visit_start
        FROM scoped_visits sv
        WHERE sv.actual_start IS NOT NULL
        GROUP BY sv.user_id, sv.visit_date
    ),

    commute_times AS (
        SELECT
            fe.user_id,
            fe.visit_date,
            GREATEST(
                CASE
                    WHEN last_session.started_at IS NOT NULL
                    THEN EXTRACT(EPOCH FROM (
                        fe.first_visit_start - last_session.started_at
                    )) / 60.0
                    ELSE 0
                END,
                0
            ) AS commute_minutes
        FROM first_events_per_day fe
        INNER JOIN public.accounts acc
            ON acc.id = fe.user_id
            AND acc.auth_user_id IS NOT NULL
        LEFT JOIN LATERAL (
            SELECT uas.started_at
            FROM public.user_app_sessions uas
            WHERE uas.auth_user_id = acc.auth_user_id
              AND uas.started_at <= fe.first_visit_start
              AND uas.started_at > (fe.first_visit_start - interval '48 hours')
            ORDER BY uas.started_at DESC
            LIMIT 1
        ) last_session ON true
    ),

    time_aggregates AS (
        SELECT
            ROUND(COALESCE(SUM(ivg.work_minutes), 0)::numeric, 0)          AS total_work_minutes,
            ROUND(COALESCE(SUM(ivg.inter_travel_minutes), 0)::numeric, 0)  AS total_inter_travel_minutes,
            ROUND(COALESCE((SELECT SUM(ct.commute_minutes) FROM commute_times ct), 0)::numeric, 0)
                                                                           AS total_commute_minutes,
            ROUND((
                COALESCE(SUM(ivg.inter_travel_minutes), 0) +
                COALESCE((SELECT SUM(ct.commute_minutes) FROM commute_times ct), 0)
            )::numeric, 0)                                                 AS total_travel_minutes,
            ROUND(COALESCE(AVG(NULLIF(ivg.work_minutes, 0)), 0)::numeric, 1)
                                                                           AS avg_work_minutes_per_visit,
            ROUND(COALESCE(AVG(NULLIF(ivg.inter_travel_minutes, 0)), 0)::numeric, 1)
                                                                           AS avg_travel_minutes_per_gap
        FROM inter_visit_gaps ivg
    ),

    -- Product availability (market-scoped, NOT user-scoped — intentional)
    mch_avail AS (
        SELECT
            ma.is_available
        FROM public.mch_availability ma
        INNER JOIN public.mch_events me ON me.id = ma.event_id
        INNER JOIN scope s ON me.market_id = s.market_id
        WHERE me.created_at::date BETWEEN p_date_from AND p_date_to
    ),
    promo_avail AS (
        SELECT
            prl.is_available
        FROM public.promoter_plus_report_lines prl
        INNER JOIN public.promoter_plus_reports pr ON pr.id = prl.report_id
        INNER JOIN scope s ON pr.market_id = s.market_id
        WHERE pr.report_date BETWEEN p_date_from AND p_date_to
    ),
    combined_availability AS (
        SELECT is_available FROM mch_avail
        UNION ALL
        SELECT is_available FROM promo_avail
    ),
    availability_stats AS (
        SELECT
            COUNT(*)                                        AS total_products,
            COUNT(*) FILTER (WHERE is_available = true)     AS available_count,
            COUNT(*) FILTER (WHERE is_available = false)    AS unavailable_count,
            CASE
                WHEN COUNT(*) > 0
                THEN ROUND(
                    (COUNT(*) FILTER (WHERE is_available = true))::numeric
                    / COUNT(*)::numeric * 100, 1
                )
                ELSE 0
            END                                             AS availability_rate
        FROM combined_availability
    ),

    -- ═══════════════════════════════════════════════════════════
    -- SECTION 3: NOTIFICATIONS
    -- ═══════════════════════════════════════════════════════════
    scoped_notifications AS (
        SELECT
            n.id,
            n.created_at
        FROM public.notifications n
        WHERE n.for_user IN (SELECT account_id FROM army)
          AND n.created_at::date BETWEEN p_date_from AND p_date_to
          AND (p_staff_ids IS NULL OR n.for_user = ANY(p_staff_ids))
    ),

    notification_stats AS (
        SELECT
            COUNT(DISTINCT sn.id)                              AS total_notifications,
            COUNT(DISTINCT nr.notification_id)                 AS read_count,
            COUNT(DISTINCT na.notification_id)                 AS acted_count,
            CASE
                WHEN COUNT(DISTINCT sn.id) > 0
                THEN ROUND(
                    COUNT(DISTINCT nr.notification_id)::numeric
                    / COUNT(DISTINCT sn.id)::numeric * 100, 1
                )
                ELSE 0
            END                                                AS read_rate,
            CASE
                WHEN COUNT(DISTINCT sn.id) > 0
                THEN ROUND(
                    COUNT(DISTINCT na.notification_id)::numeric
                    / COUNT(DISTINCT sn.id)::numeric * 100, 1
                )
                ELSE 0
            END                                                AS execution_rate,
            ROUND(COALESCE(
                AVG(EXTRACT(EPOCH FROM (nr.read_at - sn.created_at)) / 3600.0),
                0
            )::numeric, 1)                                     AS avg_wait_hours
        FROM scoped_notifications sn
        LEFT JOIN public.notification_reads nr ON nr.notification_id = sn.id
        LEFT JOIN public.notification_actions na ON na.notification_id = sn.id
    ),

    -- ═══════════════════════════════════════════════════════════
    -- TOP PERFORMERS
    -- ═══════════════════════════════════════════════════════════
    user_stats AS (
        SELECT
            sv.user_id,
            COUNT(*)                                        AS total,
            COUNT(*) FILTER (WHERE sv.status = 'completed') AS completed
        FROM scoped_visits sv
        GROUP BY sv.user_id
        HAVING COUNT(*) >= 1
    ),
    top_performers AS (
        SELECT
            us.user_id,
            COALESCE(a.full_name, a.username)            AS name_en,
            COALESCE(a.arabic_name, a.full_name)         AS name_ar,
            a.avatar_url,
            COALESCE(a.role, a.field_role::text)         AS role,
            us.total                                     AS total_visits,
            us.completed                                 AS completed_visits,
            CASE
                WHEN us.total > 0
                THEN ROUND(us.completed::numeric / us.total::numeric * 100, 1)
                ELSE 0
            END                                          AS completion_rate
        FROM user_stats us
        INNER JOIN public.accounts a ON a.id = us.user_id
        ORDER BY completion_rate DESC, us.completed DESC
        LIMIT 5
    ),

    -- ═══════════════════════════════════════════════════════════
    -- FRAUD SUSPECTS (v3.7) — Users with trust < 100%
    -- Lowest trust = #1 suspect
    -- ═══════════════════════════════════════════════════════════
    fraud_suspects AS (
        SELECT
            sv.user_id,
            COALESCE(a.full_name, a.username)            AS name_en,
            COALESCE(a.arabic_name, a.full_name)         AS name_ar,
            a.avatar_url,
            COALESCE(a.role, a.field_role::text)         AS role,
            a.is_fraud_locked,
            COALESCE(a.fraud_unlock_count, 0)            AS fraud_unlock_count,
            ROUND(AVG(sv.trust_score)::numeric, 1)       AS avg_trust_score,
            COUNT(*)                                      AS total_visits
        FROM scoped_visits sv
        INNER JOIN public.accounts a ON a.id = sv.user_id
        WHERE sv.trust_score IS NOT NULL
          AND sv.trust_score < 100
        GROUP BY sv.user_id, a.full_name, a.username,
                 a.arabic_name, a.avatar_url,
                 a.is_fraud_locked, a.fraud_unlock_count,
                 a.role, a.field_role
        ORDER BY avg_trust_score ASC
        LIMIT 10
    )

    -- ═══════════════════════════════════════════════════════════
    -- FINAL ASSEMBLY
    -- ═══════════════════════════════════════════════════════════
    SELECT jsonb_build_object(
        'visits', (
            SELECT jsonb_build_object(
                'total_visits',      vk.total_visits,
                'completed_visits',  vk.completed_visits,
                'incomplete_visits', vk.incomplete_visits,
                'in_progress',       vk.in_progress_visits,
                'cancelled_visits',  vk.cancelled_visits,
                'no_visit_count',    vk.no_visit_count,
                'completion_rate',   vk.completion_rate,
                'status_breakdown',  (
                    SELECT COALESCE(jsonb_agg(
                        jsonb_build_object('status', vsb.status, 'count', vsb.count)
                    ), '[]'::jsonb) FROM visit_status_breakdown vsb
                )
            ) FROM visit_kpis vk
        ),

        'workforce', (
            SELECT jsonb_build_object(
                'total_work_minutes',           ta.total_work_minutes,
                'total_inter_travel_minutes',   ta.total_inter_travel_minutes,
                'total_commute_minutes',        ta.total_commute_minutes,
                'total_travel_minutes',         ta.total_travel_minutes,
                'avg_work_minutes_per_visit',   ta.avg_work_minutes_per_visit,
                'avg_travel_minutes_per_gap',   ta.avg_travel_minutes_per_gap,
                'total_products',               avs.total_products,
                'available_count',              avs.available_count,
                'unavailable_count',            avs.unavailable_count,
                'availability_rate',            avs.availability_rate
            )
            FROM time_aggregates ta, availability_stats avs
        ),

        'notifications', (
            SELECT jsonb_build_object(
                'total',          ns.total_notifications,
                'read_count',     ns.read_count,
                'acted_count',    ns.acted_count,
                'read_rate',      ns.read_rate,
                'execution_rate', ns.execution_rate,
                'avg_wait_hours', ns.avg_wait_hours
            ) FROM notification_stats ns
        ),

        'top_performers', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'user_id',          tp.user_id,
                    'name_en',          tp.name_en,
                    'name_ar',          tp.name_ar,
                    'avatar_url',       tp.avatar_url,
                    'role',             tp.role,
                    'total_visits',     tp.total_visits,
                    'completed_visits', tp.completed_visits,
                    'completion_rate',  tp.completion_rate
                )
            ), '[]'::jsonb)
            FROM top_performers tp
        ),

        'fraud_suspects', (
            SELECT COALESCE(jsonb_agg(
                jsonb_build_object(
                    'user_id',             fs.user_id,
                    'name_en',             fs.name_en,
                    'name_ar',             fs.name_ar,
                    'avatar_url',          fs.avatar_url,
                    'role',                fs.role,
                    'is_fraud_locked',     fs.is_fraud_locked,
                    'fraud_unlock_count',  fs.fraud_unlock_count,
                    'avg_trust_score',     fs.avg_trust_score,
                    'total_visits',        fs.total_visits
                )
            ), '[]'::jsonb)
            FROM fraud_suspects fs
        ),

        'meta', jsonb_build_object(
            'date_from',    p_date_from,
            'date_to',      p_date_to,
            'generated_at', timezone('Asia/Riyadh', now())
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_dashboard_ops_metrics(date, date, uuid[], uuid[]) TO authenticated;

-- Revoke from anon for security
REVOKE EXECUTE ON FUNCTION public.get_dashboard_ops_metrics(date, date, uuid[], uuid[]) FROM anon;
