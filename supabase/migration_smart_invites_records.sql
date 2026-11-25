-- ============================================================================
-- MiGymBrou — Migración: Invitación Inteligente Dual, Expedientes Aislados
-- por Coach (coach_student_records) y Auto-Vinculación Multi-Tenant
-- ============================================================================

-- 1. Ampliar coach_students para soportar flujo dual y pre-vinculación
ALTER TABLE public.coach_students
  ADD COLUMN IF NOT EXISTS invited_phone text,
  ADD COLUMN IF NOT EXISTS initial_goals text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS initial_record_payload jsonb;

-- Permitir estados: pending, pending_signup, pending_acceptance, active, inactive, finalizado
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
  CHECK (
    invite_status IN (
      'pending',
      'pending_signup',
      'pending_acceptance',
      'active',
      'inactive',
      'finalizado'
    )
  );

-- Actualizar índice de cupos para incluir pending_signup y pending_acceptance
DROP INDEX IF EXISTS public.idx_coach_students_active_quota;
CREATE INDEX IF NOT EXISTS idx_coach_students_active_quota
  ON public.coach_students (coach_id, invite_status)
  WHERE invite_status IN ('active', 'pending', 'pending_signup', 'pending_acceptance');

CREATE INDEX IF NOT EXISTS idx_coach_students_lower_email
  ON public.coach_students (lower(invited_email));

-- 2. Tabla de Expedientes Aislados por Coach (coach_student_records)
-- Cada pareja (coach_id, student_id) posee su propio expediente clínico,
-- objetivos, disponibilidad y notas, estrictamente aislado por RLS.
CREATE TABLE IF NOT EXISTS public.coach_student_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_student_id uuid NOT NULL UNIQUE REFERENCES public.coach_students(id) ON DELETE CASCADE,
  coach_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  invited_email text NOT NULL,
  phone text,
  goals text[] NOT NULL DEFAULT '{}',

  -- Historial Médico y Salud
  has_injuries boolean NOT NULL DEFAULT false,
  injuries_detail text,
  has_chronic_conditions boolean NOT NULL DEFAULT false,
  chronic_conditions_detail text,
  takes_medications boolean NOT NULL DEFAULT false,
  medications_detail text,
  allergies text,
  current_supplements text,

  -- Experiencia y Disponibilidad
  gym_experience text,
  available_days_per_week int CHECK (available_days_per_week BETWEEN 1 AND 7),
  session_duration_hours text,

  -- Notas iniciales y pre-captura de evaluación antropométrica #1
  initial_coach_notes text,
  initial_measurements jsonb,
  initial_assessment_materialized boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_csr_coach ON public.coach_student_records(coach_id);
CREATE INDEX IF NOT EXISTS idx_csr_student ON public.coach_student_records(student_id);
CREATE INDEX IF NOT EXISTS idx_csr_coach_email ON public.coach_student_records(coach_id, lower(invited_email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_csr_coach_student_unique
  ON public.coach_student_records(coach_id, student_id)
  WHERE student_id IS NOT NULL;

ALTER TABLE public.coach_student_records ENABLE ROW LEVEL SECURITY;

-- Políticas RLS estrictas: solo el Coach dueño ve/edita su expediente;
-- el Alumno solo lee los expedientes donde es student_id (nunca se cruzan coaches).
DROP POLICY IF EXISTS "Coaches manage own isolated student records" ON public.coach_student_records;
CREATE POLICY "Coaches manage own isolated student records"
  ON public.coach_student_records FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Students view own isolated records" ON public.coach_student_records;
CREATE POLICY "Students view own isolated records"
  ON public.coach_student_records FOR SELECT
  USING (auth.uid() = student_id);

-- Permitir a alumnos ver sus invitaciones pendientes de aceptación por student_id o email
DROP POLICY IF EXISTS "Students view own coach relation" ON public.coach_students;
CREATE POLICY "Students view own coach relation"
  ON public.coach_students FOR SELECT
  USING (
    auth.uid() = student_id
    OR lower(invited_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Reforzar aislamiento estricto por coach_id en evaluaciones, rutinas y dietas
DROP POLICY IF EXISTS "Coaches manage assessments" ON public.body_assessments;
CREATE POLICY "Coaches manage assessments"
  ON public.body_assessments FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches manage workouts" ON public.workouts;
CREATE POLICY "Coaches manage workouts"
  ON public.workouts FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches manage nutrition plans" ON public.nutrition_plans;
CREATE POLICY "Coaches manage nutrition plans"
  ON public.nutrition_plans FOR ALL
  USING (auth.uid() = coach_id)
  WITH CHECK (auth.uid() = coach_id);

-- 3. Ampliar tabla notifications para soportar invitaciones in-app con acción
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS metadata jsonb;

DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.notifications'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%type%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (
    type IN (
      'workout',
      'diet',
      'assessment',
      'appointment',
      'subscription',
      'goal',
      'verification',
      'inquiry',
      'coach_invite'
    )
  );

-- 4. Función auxiliar para materializar evaluación antropométrica #1 al vincular
CREATE OR REPLACE FUNCTION public.materialize_initial_assessment(target_record_id uuid, target_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  rec record;
  m jsonb;
  w numeric;
BEGIN
  SELECT * INTO rec
  FROM public.coach_student_records
  WHERE id = target_record_id
    AND initial_assessment_materialized = false
    AND initial_measurements IS NOT NULL;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  m := rec.initial_measurements;
  w := NULLIF(m->>'weight_kg', '')::numeric;

  IF w IS NOT NULL AND w > 0 THEN
    INSERT INTO public.body_assessments (
      student_id,
      coach_id,
      assessment_date,
      weight_kg,
      height_cm,
      body_fat_percentage,
      muscle_mass_kg,
      chest_cm,
      back_width_cm,
      waist_cm,
      abdomen_cm,
      hip_cm,
      bicep_left_cm,
      bicep_right_cm,
      thigh_left_cm,
      thigh_right_cm,
      calf_cm,
      coach_analysis_notes,
      goal_tag,
      progress_photos
    ) VALUES (
      target_student_id,
      rec.coach_id,
      coalesce(NULLIF(m->>'assessment_date', '')::date, current_date),
      w,
      NULLIF(m->>'height_cm', '')::numeric,
      NULLIF(m->>'body_fat_percentage', '')::numeric,
      NULLIF(m->>'muscle_mass_kg', '')::numeric,
      NULLIF(m->>'chest_cm', '')::numeric,
      NULLIF(m->>'back_width_cm', '')::numeric,
      NULLIF(m->>'waist_cm', '')::numeric,
      NULLIF(m->>'abdomen_cm', '')::numeric,
      NULLIF(m->>'hip_cm', '')::numeric,
      NULLIF(m->>'bicep_left_cm', '')::numeric,
      NULLIF(m->>'bicep_right_cm', '')::numeric,
      NULLIF(m->>'thigh_left_cm', '')::numeric,
      NULLIF(m->>'thigh_right_cm', '')::numeric,
      NULLIF(m->>'calf_cm', '')::numeric,
      coalesce(NULLIF(m->>'coach_analysis_notes', ''), rec.initial_coach_notes, 'Evaluación antropométrica inicial #1'),
      coalesce(rec.goals[1], 'Evaluación Inicial'),
      '[]'::jsonb
    );

    UPDATE public.coach_student_records
    SET initial_assessment_materialized = true, updated_at = now()
    WHERE id = target_record_id;
  END IF;
END;
$$;

-- 5. Trigger actualizado: auto-vinculación automática de alumno nuevo al confirmar/crear cuenta
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_role text;
  user_name text;
  rel record;
  rec_id uuid;
BEGIN
  user_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  user_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  INSERT INTO public.profiles (id, role, full_name, email, brand_name, specialty, terms_accepted_at)
  VALUES (
    new.id, user_role, user_name, new.email,
    new.raw_user_meta_data->>'brand_name',
    new.raw_user_meta_data->>'specialty',
    coalesce((new.raw_user_meta_data->>'terms_accepted_at')::timestamptz, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = excluded.full_name,
        updated_at = now();

  IF user_role = 'student' THEN
    FOR rel IN
      SELECT id, coach_id, invited_name
      FROM public.coach_students
      WHERE lower(invited_email) = lower(new.email)
        AND student_id IS NULL
        AND invite_status IN ('pending', 'pending_signup')
    LOOP
      UPDATE public.coach_students
      SET student_id = new.id,
          invite_status = 'active',
          subscription_status = CASE WHEN subscription_status = 'trial' THEN 'active' ELSE subscription_status END,
          updated_at = now()
      WHERE id = rel.id;

      UPDATE public.coach_student_records
      SET student_id = new.id,
          updated_at = now()
      WHERE coach_student_id = rel.id
      RETURNING id INTO rec_id;

      IF rec_id IS NOT NULL THEN
        PERFORM public.materialize_initial_assessment(rec_id, new.id);
      END IF;

      INSERT INTO public.notifications (user_id, title, message, type)
      VALUES (
        rel.coach_id,
        '¡Alumno activado automáticamente!',
        coalesce(user_name, rel.invited_name) || ' confirmó su cuenta y su expediente quedó vinculado automáticamente.',
        'subscription'
      );
    END LOOP;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
