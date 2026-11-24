-- =====================================================================
-- MiGymBrou — Migración: Referidos (Cola Mensual Consecutiva), Códigos Promo
-- y Verificación Prioritaria de Identidad + Rostro (15 días)
-- =====================================================================

-- 1. Columnas en profiles para verificación facial, plazo de 15 días y código de referido propio
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by_code text,
  ADD COLUMN IF NOT EXISTS face_verification_url text,
  ADD COLUMN IF NOT EXISTS face_verification_name text,
  ADD COLUMN IF NOT EXISTS verification_deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text DEFAULT '2026.2';

-- 2. Códigos de referido únicos por Coach
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  sponsor_discount_percent numeric(5, 2) NOT NULL DEFAULT 25,
  invitee_discount_percent numeric(5, 2) NOT NULL DEFAULT 25,
  max_rewards_cap integer NOT NULL DEFAULT 18 CHECK (max_rewards_cap BETWEEN 12 AND 24),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Códigos promocionales creados desde /admin
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed_mxn')),
  discount_value numeric(10, 2) NOT NULL,
  target_plan_tier text CHECK (target_plan_tier IN ('base', 'pro', 'studio')),
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Redenciones de uso único al registrarse por primera vez
CREATE TABLE IF NOT EXISTS public.referral_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  code_kind text NOT NULL CHECK (code_kind IN ('referral', 'promo')),
  sponsor_coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_coach_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_coach_email text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed_mxn')),
  discount_value numeric(10, 2) NOT NULL DEFAULT 25,
  first_month_applied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Cola mensual consecutiva de recompensas del Coach padrino (1 por mes, sin apilar)
CREATE TABLE IF NOT EXISTS public.referral_reward_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_coach_email text,
  discount_percent numeric(5, 2) NOT NULL DEFAULT 25,
  plan_at_grant text NOT NULL DEFAULT 'base' CHECK (plan_at_grant IN ('free', 'base', 'pro', 'studio')),
  locked_plan_price_mxn numeric(10, 2) NOT NULL DEFAULT 449,
  queue_position integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'applied', 'expired', 'cancelled')),
  applied_month text, -- YYYY-MM
  applied_amount_mxn numeric(10, 2),
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_reward_queue_sponsor ON public.referral_reward_queue (sponsor_coach_id, status, queue_position);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes (upper(code));

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_reward_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches view own referral code" ON public.referral_codes;
CREATE POLICY "Coaches view own referral code"
  ON public.referral_codes FOR SELECT
  USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches view own reward queue" ON public.referral_reward_queue;
CREATE POLICY "Coaches view own reward queue"
  ON public.referral_reward_queue FOR SELECT
  USING (sponsor_coach_id = auth.uid());

-- Bucket privado de verificación de identidad y rostro (acceso restringido al dueño y admin)
INSERT INTO storage.buckets (id, name, public)
VALUES ('identity-docs', 'identity-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Seed de 2 códigos promocionales de ejemplo activos en /admin
INSERT INTO public.promo_codes (code, description, discount_type, discount_value, max_uses, is_active)
SELECT v.code, v.description, v.discount_type, v.discount_value, v.max_uses, true
FROM (
  VALUES
    ('BIENVENIDO25', '25% de descuento en tu primer mes de plan Coach', 'percent', 25, 200),
    ('LANZAMIENTO35', '35% de descuento especial de lanzamiento (primer mes)', 'percent', 35, 100)
) AS v(code, description, discount_type, discount_value, max_uses)
WHERE NOT EXISTS (
  SELECT 1 FROM public.promo_codes p WHERE upper(p.code) = upper(v.code)
);
