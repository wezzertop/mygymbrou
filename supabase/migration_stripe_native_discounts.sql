-- =====================================================================
-- MiGymBrou — Migración: Cupones Nativos de Stripe en Cola de Referidos
-- =====================================================================

ALTER TABLE public.referral_reward_queue
  ADD COLUMN IF NOT EXISTS stripe_coupon_id text,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text;

-- Permitir estados 'pending' y 'queued_in_stripe' además de 'queued', 'applied', 'expired', 'cancelled'
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.referral_reward_queue'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.referral_reward_queue DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.referral_reward_queue
  ADD CONSTRAINT referral_reward_queue_status_check
  CHECK (status IN ('pending', 'queued', 'queued_in_stripe', 'applied', 'expired', 'cancelled'));

CREATE INDEX IF NOT EXISTS idx_reward_queue_stripe_status
  ON public.referral_reward_queue (sponsor_coach_id, status, queue_position);
