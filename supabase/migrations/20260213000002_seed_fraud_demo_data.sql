-- ============================================================
-- DEMO DATA: Set random fraud_unlock_count for users with low trust
-- This is a one-time seed for demo purposes
-- ============================================================
UPDATE public.accounts
SET fraud_unlock_count = floor(random() * 5 + 1)::int
WHERE id IN (
    SELECT DISTINCT vc.user_id
    FROM public.visit_core vc
    WHERE vc.trust_score IS NOT NULL
      AND vc.trust_score < 90
);
