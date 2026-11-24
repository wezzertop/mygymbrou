-- =====================================================================
-- MiGymBrou — Migración: Catálogo de Gimnasios (gyms) e Imágenes en Dietas
-- =====================================================================

-- 1. Imagen en plantillas de dietas
ALTER TABLE public.nutrition_plans
  ADD COLUMN IF NOT EXISTS image_url text;

-- Bucket público para imágenes de plantillas de dietas
INSERT INTO storage.buckets (id, name, public)
VALUES ('diet-images', 'diet-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Tabla controlada de Gimnasios / Estudios
CREATE TABLE IF NOT EXISTS public.gyms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  submitted_by_coach_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_by_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_gyms_status ON public.gyms (status);
CREATE INDEX IF NOT EXISTS idx_gyms_name_lower ON public.gyms (lower(name));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gym_id uuid REFERENCES public.gyms(id) ON DELETE SET NULL;

ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved gyms" ON public.gyms;
CREATE POLICY "Public can view approved gyms"
  ON public.gyms FOR SELECT
  USING (status = 'approved' OR submitted_by_coach_id = auth.uid());

DROP POLICY IF EXISTS "Coaches can suggest gyms" ON public.gyms;
CREATE POLICY "Coaches can suggest gyms"
  ON public.gyms FOR INSERT
  WITH CHECK (status = 'pending');

-- Seed inicial de gimnasios oficiales en México
INSERT INTO public.gyms (name, city, status, approved_at)
SELECT v.name, v.city, 'approved', now()
FROM (
  VALUES
    ('Entrenamiento Online / Independiente', 'México'),
    ('Smart Fit', 'Nacional'),
    ('Sports World', 'Nacional'),
    ('Sport City', 'Nacional'),
    ('Anytime Fitness', 'Nacional'),
    ('Planet Fitness', 'Nacional'),
    ('Station 24', 'Nacional'),
    ('Gold''s Gym', 'Nacional'),
    ('Energy Fitness', 'CDMX / Nacional'),
    ('Fit4Life Studio', 'Guadalajara'),
    ('Apex Performance Studio', 'Monterrey')
) AS v(name, city)
WHERE NOT EXISTS (
  SELECT 1 FROM public.gyms g WHERE lower(g.name) = lower(v.name)
);
