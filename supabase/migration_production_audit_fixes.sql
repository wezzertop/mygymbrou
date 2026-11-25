-- =====================================================================
-- MiGymBrou — Migración de Auditoría Integral Producción (Coach ↔ Alumno)
-- =====================================================================
-- Ejecuta este script en el SQL Editor de Supabase para aplicar:
-- 1. Columnas de técnica/músculos en workout_exercises (Free Exercise DB)
-- 2. Políticas Storage RLS para bucket 'diet-images' y lectura admin en 'identity-docs'
-- 3. Endurecimiento multi-tenant RLS: is_coach_of solo con invite_status = 'active'
-- 4. Protección contra auto-escalamiento de privilegios/planes en public.profiles
-- 5. RLS en exercise_frames y stripe_webhook_events
-- 6. Unificación del CHECK de invite_status y trigger handle_new_user seguro
-- =====================================================================

-- 1. Persistir instrucciones en español y músculos en workout_exercises
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS primary_muscles text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS secondary_muscles text[] DEFAULT '{}'::text[];

-- 2. Políticas Storage RLS para bucket público 'diet-images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('diet-images', 'diet-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view diet images" ON storage.objects;
CREATE POLICY "Public can view diet images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'diet-images');

DROP POLICY IF EXISTS "Authenticated users can upload diet images" ON storage.objects;
CREATE POLICY "Authenticated users can upload diet images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'diet-images');

DROP POLICY IF EXISTS "Authenticated users can update own diet images" ON storage.objects;
CREATE POLICY "Authenticated users can update own diet images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'diet-images' AND owner = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can delete own diet images" ON storage.objects;
CREATE POLICY "Authenticated users can delete own diet images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'diet-images' AND owner = auth.uid());

-- Permitir que administradores revisen documentos de verificación en 'identity-docs'
DROP POLICY IF EXISTS "Admins can view identity docs" ON storage.objects;
CREATE POLICY "Admins can view identity docs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'identity-docs' AND public.is_admin());

-- 3. Endurecimiento multi-tenant: is_coach_of solo considera relaciones ACTIVAS
CREATE OR REPLACE FUNCTION public.is_coach_of(target_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.coach_students cs
    WHERE cs.coach_id = auth.uid()
      AND cs.student_id = target_student_id
      AND cs.invite_status = 'active'
  );
$$;

-- Eliminar política excesivamente permisiva que dejaba a un coach editar cualquier columna del perfil del alumno
DROP POLICY IF EXISTS "Coaches update own students profile" ON public.profiles;

-- 4. Protección contra auto-escalamiento de privilegios/planes en public.profiles
CREATE OR REPLACE FUNCTION public.protect_sensitive_profile_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Service role (auth.uid() IS NULL) y admins reales pueden actualizar libremente
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Impedir que un usuario modifique su propio rol, plan SaaS, estado Stripe o verificación oficial
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'No autorizado para cambiar el rol de la cuenta.';
  END IF;

  IF NEW.saas_plan_tier IS DISTINCT FROM OLD.saas_plan_tier
     OR NEW.saas_student_limit IS DISTINCT FROM OLD.saas_student_limit
     OR NEW.saas_subscription_status IS DISTINCT FROM OLD.saas_subscription_status
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_subscription_id IS DISTINCT FROM OLD.stripe_subscription_id THEN
    RAISE EXCEPTION 'Los cambios de plan y facturación solo pueden aplicarse desde el servidor.';
  END IF;

  IF NEW.is_verified_identity IS DISTINCT FROM OLD.is_verified_identity
     OR NEW.account_status IS DISTINCT FROM OLD.account_status THEN
    RAISE EXCEPTION 'El estado de verificación o cuenta solo puede ser modificado por administración.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_sensitive_profile_columns ON public.profiles;
CREATE TRIGGER trg_protect_sensitive_profile_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_sensitive_profile_columns();

-- 5. Habilitar RLS en exercise_frames y stripe_webhook_events
DO $$
BEGIN
  IF to_regclass('public.exercise_frames') IS NOT NULL THEN
    ALTER TABLE public.exercise_frames ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Authenticated users can view exercise frames" ON public.exercise_frames;
    CREATE POLICY "Authenticated users can view exercise frames"
      ON public.exercise_frames FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF to_regclass('public.stripe_webhook_events') IS NOT NULL THEN
    ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
    -- Sin políticas para anon/authenticated: solo service_role accede
  END IF;
END $$;

-- 6. Asegurar todos los estados válidos en coach_students.invite_status
ALTER TABLE public.coach_students
  DROP CONSTRAINT IF EXISTS coach_students_invite_status_check;

ALTER TABLE public.coach_students
  ADD CONSTRAINT coach_students_invite_status_check
  CHECK (invite_status IN (
    'pending',
    'pending_signup',
    'pending_acceptance',
    'active',
    'declined',
    'finalizado'
  ));

-- 7. Unificar handle_new_user(): preserva onboarding/plan Free y NO activa invitaciones antes de confirmar correo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
  v_full_name text;
  v_gender text;
  v_is_coach boolean;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF v_role NOT IN ('coach', 'student', 'admin') THEN
    v_role := 'student';
  END IF;
  v_is_coach := (v_role = 'coach');
  v_full_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
    split_part(COALESCE(NEW.email, ''), '@', 1),
    'Usuario'
  );
  v_gender := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'gender'), ''), 'female');

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    gender,
    saas_plan_tier,
    saas_student_limit,
    has_completed_onboarding,
    verification_deadline_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_full_name,
    v_role,
    v_gender,
    CASE WHEN v_is_coach THEN 'free' ELSE NULL END,
    CASE WHEN v_is_coach THEN 5 ELSE NULL END,
    false,
    CASE WHEN v_is_coach THEN now() + interval '15 days' ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email),
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name);

  -- Solo vincular student_id sin activar prematuramente si el usuario todavía no confirma correo
  IF NEW.email IS NOT NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.coach_students
    SET student_id = NEW.id,
        updated_at = now()
    WHERE lower(invited_email) = lower(NEW.email)
      AND student_id IS NULL
      AND invite_status IN ('pending', 'pending_signup');
  END IF;

  RETURN NEW;
END;
$$;
