-- ============================================================================
-- MiGymBrou — Vigencia por rango de fechas en Rutinas (workouts)
-- ============================================================================

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date;

CREATE INDEX IF NOT EXISTS idx_workouts_student_dates
  ON public.workouts(student_id, is_active, start_date, end_date);
