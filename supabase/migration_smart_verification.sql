-- =====================================================================
-- MiGymBrou — Migración: Verificación Inteligente (ID Frente/Reverso + Liveness + Score %)
-- =====================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS identity_back_url text,
  ADD COLUMN IF NOT EXISTS liveness_left_url text,
  ADD COLUMN IF NOT EXISTS liveness_right_url text,
  ADD COLUMN IF NOT EXISTS verification_confidence_score integer CHECK (verification_confidence_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS verification_checks jsonb;
