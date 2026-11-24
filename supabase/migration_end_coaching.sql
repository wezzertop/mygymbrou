-- =====================================================================
-- MiGymBrou — Migración: Finalización de Asesoramiento y Liberación de Cupos
-- =====================================================================

ALTER TABLE public.coach_students
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS end_reason text;

-- Permitir el estado 'finalizado' además de 'pending', 'active', 'inactive'
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.coach_students'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%invite_status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.coach_students DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.coach_students
  ADD CONSTRAINT coach_students_invite_status_check
  CHECK (invite_status IN ('pending', 'active', 'inactive', 'finalizado'));

-- Índice para consultar rápidamente alumnos activos por coach (cálculo de cupo)
CREATE INDEX IF NOT EXISTS idx_coach_students_active_quota
  ON public.coach_students (coach_id, invite_status)
  WHERE invite_status IN ('active', 'pending');
