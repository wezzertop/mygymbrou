-- =====================================================================
-- MiGymBrou — Migración: Auditoría de Cambios de Plan (Upgrade / Downgrade)
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS saas_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_downgrade_plan_tier text
    CHECK (scheduled_downgrade_plan_tier IN ('free', 'base', 'pro', 'studio'));

CREATE TABLE IF NOT EXISTS public.plan_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  coach_email text,
  from_plan text NOT NULL CHECK (from_plan IN ('free', 'base', 'pro', 'studio')),
  to_plan text NOT NULL CHECK (to_plan IN ('free', 'base', 'pro', 'studio')),
  mode text NOT NULL CHECK (mode IN ('upgrade', 'downgrade')),
  remaining_days integer NOT NULL DEFAULT 0,
  daily_rate_mxn numeric(10, 4) NOT NULL DEFAULT 0,
  credit_applied_mxn numeric(10, 2) NOT NULL DEFAULT 0,
  net_amount_mxn numeric(10, 2) NOT NULL DEFAULT 0,
  effective_at timestamptz NOT NULL DEFAULT now(),
  accepted_terms_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_changes_coach ON public.plan_changes (coach_id, created_at DESC);

ALTER TABLE public.plan_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches view own plan changes" ON public.plan_changes;
CREATE POLICY "Coaches view own plan changes"
  ON public.plan_changes FOR SELECT
  USING (coach_id = auth.uid());
