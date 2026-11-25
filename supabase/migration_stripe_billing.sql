-- =====================================================================
-- MiGymBrou — Migración: Stripe Checkout, Customer Portal y Webhooks Idempotentes
-- =====================================================================

-- 1. Columnas de suscripción Stripe en profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS saas_subscription_status text DEFAULT 'free'
    CHECK (saas_subscription_status IN ('free', 'active', 'past_due', 'canceled', 'trialing')),
  ADD COLUMN IF NOT EXISTS saas_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS saas_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_downgrade_plan_tier text
    CHECK (scheduled_downgrade_plan_tier IN ('free', 'base', 'pro', 'studio'));

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles (stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription ON public.profiles (stripe_subscription_id);

-- 2. Log de eventos Webhook de Stripe para Idempotencia estricta
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  stripe_event_id text PRIMARY KEY,
  event_type text NOT NULL,
  payload_summary jsonb,
  processed_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Historial interno de facturas / pagos del Coach
CREATE TABLE IF NOT EXISTS public.coach_billing_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  stripe_invoice_id text NOT NULL UNIQUE,
  stripe_subscription_id text,
  plan_tier text CHECK (plan_tier IN ('free', 'base', 'pro', 'studio')),
  amount_paid_mxn numeric(10, 2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'mxn',
  status text NOT NULL DEFAULT 'paid',
  hosted_invoice_url text,
  invoice_pdf text,
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_invoices_coach ON public.coach_billing_invoices (coach_id, created_at DESC);

ALTER TABLE public.coach_billing_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches view own billing invoices" ON public.coach_billing_invoices;
CREATE POLICY "Coaches view own billing invoices"
  ON public.coach_billing_invoices FOR SELECT
  USING (coach_id = auth.uid());
