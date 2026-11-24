-- ============================================================================
-- MiGymBrou — ESQUEMA COMPLETO DE BASE DE DATOS (SUPABASE POSTGRESQL)
-- Incluye: Rutinas Visuales (exercise_library), Metas (student_goals),
-- Calendario Conectado (workout_logs), Planes de Suscripción del Coach
-- (coach_subscription_plans), Storage y Políticas RLS estrictas.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. PERFILES DE USUARIO (profiles)
-- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('coach', 'student', 'admin')) default 'student',
  gender text check (gender in ('female', 'male')) default 'female',
  full_name text not null,
  email text not null,
  avatar_url text,
  phone text,
  brand_name text,
  specialty text,
  bio text,
  city text,
  years_experience int default 1,
  accepting_students boolean not null default true,
  fitness_goal text,
  is_verified_identity boolean not null default false,
  verification_status text not null check (verification_status in ('unverified', 'pending', 'verified', 'rejected')) default 'unverified',
  verified_at timestamptz,
  identity_document_url text,
  identity_document_name text,
  identity_document_type text check (identity_document_type in ('ine_id', 'passport', 'selfie_id')),
  verification_notes text,
  has_completed_onboarding boolean not null default false,
  saas_plan_tier text not null check (saas_plan_tier in ('free', 'base', 'pro', 'studio')) default 'free',
  saas_student_limit int default 5,
  terms_accepted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migración idempotente por si public.profiles ya existía previamente
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists years_experience int default 1;
alter table public.profiles add column if not exists accepting_students boolean not null default true;
alter table public.profiles add column if not exists is_verified_identity boolean not null default false;
alter table public.profiles add column if not exists verification_status text not null default 'unverified';
alter table public.profiles add column if not exists verified_at timestamptz;
alter table public.profiles add column if not exists identity_document_url text;
alter table public.profiles add column if not exists identity_document_name text;
alter table public.profiles add column if not exists identity_document_type text;
alter table public.profiles add column if not exists verification_notes text;
alter table public.profiles add column if not exists has_completed_onboarding boolean not null default false;
alter table public.profiles add column if not exists saas_plan_tier text not null default 'free';
alter table public.profiles add column if not exists saas_student_limit int default 5;

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_verified on public.profiles(role, is_verified_identity, accepting_students);

-- ============================================================================
-- 1B. DIPLOMAS Y CERTIFICACIONES DEL COACH (coach_certifications)
-- ============================================================================
create table if not exists public.coach_certifications (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  institution text not null,
  issue_year int not null,
  credential_id text,
  category text not null check (category in ('entrenamiento', 'nutricion', 'salud', 'especialidad')) default 'entrenamiento',
  file_name text not null,
  file_url text not null,
  file_type text not null check (file_type in ('pdf', 'image')) default 'pdf',
  file_size_bytes int,
  is_verified boolean not null default true,
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_coach_certifications_coach on public.coach_certifications(coach_id, uploaded_at desc);

-- ============================================================================
-- 1C. SOLICITUDES DE ALUMNOS BUSCANDO COACH (coach_inquiries)
-- ============================================================================
create table if not exists public.coach_inquiries (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete set null,
  student_name text not null,
  student_email text not null,
  student_is_verified boolean not null default false,
  goal text not null,
  preferred_plan_name text,
  message text not null,
  status text not null check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_coach_inquiries_coach on public.coach_inquiries(coach_id, status);

-- ============================================================================
-- 2. PLANES DE SUSCRIPCIÓN DEL COACH (coach_subscription_plans)
-- ============================================================================
create table if not exists public.coach_subscription_plans (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, -- Ej. "Plan Básico", "Plan Medio", "Plan Oro", "Plan Premium"
  description text,
  price numeric(10, 2) not null default 0,
  duration_days int not null default 30 check (duration_days > 0),
  includes_nutrition boolean not null default true,
  includes_workouts boolean not null default false,
  coaching_mode text not null check (coaching_mode in ('none', 'intermittent', 'in_person')) default 'none',
  includes_assessments boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_coach_plans_coach on public.coach_subscription_plans(coach_id, is_active);

-- ============================================================================
-- 3. RELACIÓN Y SUSCRIPCIÓN COACH-ALUMNO (coach_students)
-- ============================================================================
create table if not exists public.coach_students (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete set null,
  plan_id uuid references public.coach_subscription_plans(id) on delete set null,
  invited_name text not null,
  invited_email text not null,
  invite_token text unique default encode(gen_random_bytes(24), 'hex'),
  invite_status text not null check (invite_status in ('pending', 'active', 'inactive')) default 'pending',
  subscription_status text not null check (subscription_status in ('active', 'trial', 'expired', 'pending_payment')) default 'trial',
  subscription_plan_name text not null default 'Plan Oro',
  subscription_price numeric(10, 2) not null default 0,
  subscription_started_at date not null default current_date,
  expires_at date,
  next_billing_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(coach_id, invited_email)
);

create index if not exists idx_coach_students_coach on public.coach_students(coach_id);
create index if not exists idx_coach_students_student on public.coach_students(student_id);
create index if not exists idx_coach_students_expires on public.coach_students(expires_at);

-- ============================================================================
-- 4. METAS DEL ALUMNO SINCRONIZADAS CON EL COACH (student_goals)
-- ============================================================================
create table if not exists public.student_goals (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  primary_goal text not null default 'Recomposición corporal',
  priority_zones text[] not null default '{}',
  target_weight_kg numeric(5, 2),
  days_per_week int not null default 4 check (days_per_week between 1 and 7),
  limitations_or_injuries text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_student_goals_student on public.student_goals(student_id);

-- ============================================================================
-- 5. BIBLIOTECA DE EJERCICIOS VISUALES (exercise_library + exercise_frames)
-- Soporta secuencias de 3-4 fotogramas anatómicos en Dark UI por género
-- ============================================================================
create table if not exists public.exercise_library (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references public.profiles(id) on delete cascade, -- NULL = catálogo global precargado
  name text not null,
  muscle_group text not null check (muscle_group in (
    'Pecho', 'Espalda', 'Pierna', 'Hombro', 'Bíceps', 'Tríceps', 'Abdomen', 'Cardio'
  )),
  primary_muscles text[] not null default '{}',
  secondary_muscles text[] not null default '{}',
  equipment text not null default 'Mancuernas',
  instructions text not null,
  media_url text,
  media_type text not null check (media_type in ('sequence', 'gif', 'video', 'lottie', 'svg_anim')) default 'sequence',
  frames_female jsonb not null default '[]'::jsonb, -- [{phase:1, label:'Inicio', image_url:'...'}]
  frames_male jsonb not null default '[]'::jsonb,
  frame_interval_ms int not null default 650,
  animation_key text,
  created_at timestamptz not null default now()
);

create table if not exists public.exercise_frames (
  id uuid primary key default uuid_generate_v4(),
  exercise_id uuid not null references public.exercise_library(id) on delete cascade,
  gender text not null check (gender in ('female', 'male')),
  phase_number int not null check (phase_number between 1 and 4),
  phase_label text not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  unique(exercise_id, gender, phase_number)
);

create index if not exists idx_exercise_frames_exercise on public.exercise_frames(exercise_id, gender, phase_number);
create index if not exists idx_exercise_library_group on public.exercise_library(muscle_group);
create index if not exists idx_exercise_library_coach on public.exercise_library(coach_id);

-- ============================================================================
-- 6. EVALUACIONES FÍSICAS Y ANTROPOMETRÍA (body_assessments)
-- ============================================================================
create table if not exists public.body_assessments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  coach_id uuid not null references public.profiles(id) on delete cascade,
  assessment_date date not null default current_date,
  weight_kg numeric(5, 2) not null,
  height_cm numeric(5, 2),
  body_fat_percentage numeric(4, 1),
  muscle_mass_kg numeric(5, 2),
  chest_cm numeric(5, 1),
  back_width_cm numeric(5, 1),
  waist_cm numeric(5, 1),
  abdomen_cm numeric(5, 1),
  hip_cm numeric(5, 1),
  bicep_left_cm numeric(5, 1),
  bicep_right_cm numeric(5, 1),
  forearm_cm numeric(5, 1),
  thigh_left_cm numeric(5, 1),
  thigh_right_cm numeric(5, 1),
  calf_cm numeric(5, 1),
  coach_analysis_notes text,
  goal_tag text,
  progress_photos jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_assessments_student_date on public.body_assessments(student_id, assessment_date desc);

-- ============================================================================
-- 7. RUTINAS GUIADAS (workouts, workout_days, workout_exercises, workout_logs)
-- ============================================================================
create table if not exists public.workouts (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  is_template boolean not null default false,
  title text not null,
  description text,
  goal text,
  level text check (level in ('principiante', 'intermedio', 'avanzado')) default 'intermedio',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_workouts_student on public.workouts(student_id, is_active);

create table if not exists public.workout_days (
  id uuid primary key default uuid_generate_v4(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  day_number int not null,
  title text not null,
  focus_area text,
  assigned_weekdays int[] not null default '{1,3,5}', -- 0=Dom, 1=Lun .. 6=Sáb
  estimated_minutes int default 60
);

create table if not exists public.workout_exercises (
  id uuid primary key default uuid_generate_v4(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_library_id uuid references public.exercise_library(id) on delete set null,
  sort_order int not null default 1,
  name text not null,
  muscle_group text not null,
  sets int not null default 3,
  reps text not null default '10-12',
  rest_seconds int not null default 90,
  target_weight_or_rpe text,
  coach_notes text,
  demo_url text,
  media_url text,
  media_type text check (media_type in ('gif', 'video', 'lottie', 'svg_anim')) default 'svg_anim'
);

create table if not exists public.workout_logs (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  workout_exercise_id uuid references public.workout_exercises(id) on delete set null,
  completed_date date not null default current_date,
  status text not null check (status in ('completed', 'partial')) default 'completed',
  completed_sets int not null default 0,
  weight_used text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_logs_student_date on public.workout_logs(student_id, completed_date desc);

-- ============================================================================
-- 8. DIETAS Y PLAN ALIMENTICIO (nutrition_plans, meal_items, meal_logs)
-- ============================================================================
create table if not exists public.nutrition_plans (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  is_template boolean not null default false,
  title text not null,
  notes text,
  daily_calories int not null default 2000,
  protein_g int not null default 150,
  carbs_g int not null default 200,
  fats_g int not null default 65,
  water_liters numeric(3, 1) not null default 2.5,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meal_items (
  id uuid primary key default uuid_generate_v4(),
  nutrition_plan_id uuid not null references public.nutrition_plans(id) on delete cascade,
  sort_order int not null default 1,
  meal_time text not null,
  suggested_hour text,
  foods_description text not null,
  exchange_options text,
  calories int,
  protein_g int,
  carbs_g int,
  fats_g int
);

create table if not exists public.meal_logs (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  meal_item_id uuid not null references public.meal_items(id) on delete cascade,
  log_date date not null default current_date,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique(student_id, meal_item_id, log_date)
);

-- ============================================================================
-- 9. CITAS, NOTIFICACIONES Y PUBLICIDAD NO INVASIVA
-- ============================================================================
create table if not exists public.appointments (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  location_or_link text,
  status text not null check (status in ('scheduled', 'completed', 'cancelled')) default 'scheduled',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_appointments_coach_date on public.appointments(coach_id, scheduled_at);
create index if not exists idx_appointments_student_date on public.appointments(student_id, scheduled_at);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null check (type in ('workout', 'diet', 'assessment', 'appointment', 'subscription', 'goal', 'verification', 'inquiry')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Actualizar constraint de notifications si la tabla ya existía
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('workout', 'diet', 'assessment', 'appointment', 'subscription', 'goal', 'verification', 'inquiry'));

create table if not exists public.ad_placements (
  id uuid primary key default uuid_generate_v4(),
  sponsor_name text not null,
  title text not null,
  description text not null,
  cta_text text not null default 'Ver oferta',
  cta_url text not null,
  badge_text text default 'Patrocinado',
  placement_slot text not null default 'student_footer',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 10. TRIGGER DE CREACIÓN DE PERFIL Y VINCULACIÓN DE ALUMNO
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_role text;
  user_name text;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  user_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));

  insert into public.profiles (id, role, full_name, email, brand_name, specialty, terms_accepted_at)
  values (
    new.id, user_role, user_name, new.email,
    new.raw_user_meta_data->>'brand_name',
    new.raw_user_meta_data->>'specialty',
    coalesce((new.raw_user_meta_data->>'terms_accepted_at')::timestamptz, now())
  )
  on conflict (id) do update set full_name = excluded.full_name, updated_at = now();

  if user_role = 'student' then
    update public.coach_students
    set student_id = new.id, invite_status = 'active', updated_at = now()
    where lower(invited_email) = lower(new.email) and student_id is null;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) ESTRICTO
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.coach_certifications enable row level security;
alter table public.coach_inquiries enable row level security;
alter table public.coach_subscription_plans enable row level security;
alter table public.coach_students enable row level security;
alter table public.student_goals enable row level security;
alter table public.exercise_library enable row level security;
alter table public.body_assessments enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_logs enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.meal_items enable row level security;
alter table public.meal_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.notifications enable row level security;
alter table public.ad_placements enable row level security;

create or replace function public.is_coach_of(target_student_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.coach_students
    where coach_id = auth.uid() and student_id = target_student_id
  );
$$;

-- COACH_SUBSCRIPTION_PLANS
drop policy if exists "Coaches manage own subscription plans" on public.coach_subscription_plans;
create policy "Coaches manage own subscription plans"
  on public.coach_subscription_plans for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

drop policy if exists "Students view active plans of their coach" on public.coach_subscription_plans;
create policy "Students view active plans of their coach"
  on public.coach_subscription_plans for select
  using (
    is_active = true and exists (
      select 1 from public.coach_students cs
      where cs.student_id = auth.uid() and cs.coach_id = coach_subscription_plans.coach_id
    )
  );

-- STUDENT_GOALS
drop policy if exists "Students manage own goals" on public.student_goals;
create policy "Students manage own goals"
  on public.student_goals for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

drop policy if exists "Coaches view goals of their students" on public.student_goals;
create policy "Coaches view goals of their students"
  on public.student_goals for select
  using (public.is_coach_of(student_id));

-- EXERCISE_LIBRARY
drop policy if exists "Authenticated users read global or coach exercise library" on public.exercise_library;
create policy "Authenticated users read global or coach exercise library"
  on public.exercise_library for select
  using (
    coach_id is null
    or coach_id = auth.uid()
    or exists (
      select 1 from public.coach_students cs
      where cs.student_id = auth.uid() and cs.coach_id = exercise_library.coach_id
    )
  );

drop policy if exists "Coaches manage own custom exercises" on public.exercise_library;
create policy "Coaches manage own custom exercises"
  on public.exercise_library for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

-- PROFILES, COACH_CERTIFICATIONS, COACH_INQUIRIES, COACH_STUDENTS, ASSESSMENTS, WORKOUTS, NUTRITION, APPOINTMENTS, NOTIFICATIONS
drop policy if exists "Users view own profile" on public.profiles;
create policy "Users view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Coaches view students profiles" on public.profiles;
create policy "Coaches view students profiles" on public.profiles for select using (public.is_coach_of(id));
drop policy if exists "Public directory view coaches" on public.profiles;
create policy "Public directory view coaches" on public.profiles for select using (role = 'coach' and accepting_students = true);
drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Coaches review student verification" on public.profiles;
create policy "Coaches review student verification" on public.profiles for update using (public.is_coach_of(id));

drop policy if exists "Anyone views coach certifications" on public.coach_certifications;
create policy "Anyone views coach certifications" on public.coach_certifications for select using (true);
drop policy if exists "Coaches manage own certifications" on public.coach_certifications;
create policy "Coaches manage own certifications" on public.coach_certifications for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);

drop policy if exists "Coaches view and respond to own inquiries" on public.coach_inquiries;
create policy "Coaches view and respond to own inquiries" on public.coach_inquiries for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
drop policy if exists "Students create inquiries" on public.coach_inquiries;
create policy "Students create inquiries" on public.coach_inquiries for insert with check (true);
drop policy if exists "Students view own inquiries" on public.coach_inquiries;
create policy "Students view own inquiries" on public.coach_inquiries for select using (auth.uid() = student_id);

drop policy if exists "Public view active coach plans for directory" on public.coach_subscription_plans;
create policy "Public view active coach plans for directory" on public.coach_subscription_plans for select using (is_active = true);

drop policy if exists "Coaches manage own student relations" on public.coach_students;
create policy "Coaches manage own student relations" on public.coach_students for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
drop policy if exists "Students view own coach relation" on public.coach_students;
create policy "Students view own coach relation" on public.coach_students for select using (auth.uid() = student_id);

drop policy if exists "Coaches manage assessments" on public.body_assessments;
create policy "Coaches manage assessments" on public.body_assessments for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
drop policy if exists "Students view own assessments" on public.body_assessments;
create policy "Students view own assessments" on public.body_assessments for select using (auth.uid() = student_id);

drop policy if exists "Coaches manage workouts" on public.workouts;
create policy "Coaches manage workouts" on public.workouts for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
drop policy if exists "Students view assigned workouts" on public.workouts;
create policy "Students view assigned workouts" on public.workouts for select using (auth.uid() = student_id);

drop policy if exists "Students manage own workout logs" on public.workout_logs;
create policy "Students manage own workout logs" on public.workout_logs for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
drop policy if exists "Coaches view students workout logs" on public.workout_logs;
create policy "Coaches view students workout logs" on public.workout_logs for select using (public.is_coach_of(student_id));

drop policy if exists "Coaches manage nutrition plans" on public.nutrition_plans;
create policy "Coaches manage nutrition plans" on public.nutrition_plans for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
drop policy if exists "Students view assigned nutrition plans" on public.nutrition_plans;
create policy "Students view assigned nutrition plans" on public.nutrition_plans for select using (auth.uid() = student_id);

drop policy if exists "Coaches manage appointments" on public.appointments;
create policy "Coaches manage appointments" on public.appointments for all using (auth.uid() = coach_id) with check (auth.uid() = coach_id);
drop policy if exists "Students view own appointments" on public.appointments;
create policy "Students view own appointments" on public.appointments for select using (auth.uid() = student_id);

drop policy if exists "Users manage own notifications" on public.notifications;
create policy "Users manage own notifications" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Coaches send notifications to students" on public.notifications;
create policy "Coaches send notifications to students" on public.notifications for insert with check (public.is_coach_of(user_id));

drop policy if exists "Read active ad placements" on public.ad_placements;
create policy "Read active ad placements" on public.ad_placements for select using (is_active = true);

-- ============================================================================
-- 12. STORAGE BUCKETS (progress-photos, avatars, exercise-media, coach-certifications, identity-docs)
-- ============================================================================
insert into storage.buckets (id, name, public) values ('progress-photos', 'progress-photos', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('exercise-media', 'exercise-media', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('coach-certifications', 'coach-certifications', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('identity-docs', 'identity-docs', false) on conflict (id) do nothing;

drop policy if exists "Public read coach certifications files" on storage.objects;
create policy "Public read coach certifications files"
  on storage.objects for select
  using (bucket_id = 'coach-certifications');

drop policy if exists "Coaches upload own certification files" on storage.objects;
create policy "Coaches upload own certification files"
  on storage.objects for insert
  with check (bucket_id = 'coach-certifications' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Coaches delete own certification files" on storage.objects;
create policy "Coaches delete own certification files"
  on storage.objects for delete
  using (bucket_id = 'coach-certifications' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users upload own identity docs" on storage.objects;
create policy "Users upload own identity docs"
  on storage.objects for insert
  with check (bucket_id = 'identity-docs' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users view own identity docs" on storage.objects;
create policy "Users view own identity docs"
  on storage.objects for select
  using (bucket_id = 'identity-docs' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- 13. SEED INICIAL: CATÁLOGO GLOBAL DE 14 EJERCICIOS VISUALES
-- ============================================================================
insert into public.exercise_library (coach_id, name, muscle_group, equipment, instructions, media_type, animation_key)
values
  (null, 'Press de Banca Plano con Barra', 'Pecho', 'Barra y Banco', 'Retrae escápulas, baja la barra controlada hacia el pecho medio y empuja explosivo sin despegar glúteos.', 'svg_anim', 'bench_press'),
  (null, 'Press Inclinado con Mancuernas', 'Pecho', 'Mancuernas', 'Banco a 30°. Baja con codos a 45° respecto al torso y junta las mancuernas arriba controlando la fase excéntrica.', 'svg_anim', 'bench_press'),
  (null, 'Jalón al Pecho Agarre Neutro', 'Espalda', 'Polea Alta', 'Saca el pecho, inicia el jalón deprimiendo escápulas y dirige los codos hacia la cadera.', 'svg_anim', 'lat_pulldown'),
  (null, 'Remo en Polea Baja', 'Espalda', 'Polea Baja', 'Espalda neutra, jala el agarre hacia el abdomen bajo apretando escápulas 1 segundo.', 'svg_anim', 'row'),
  (null, 'Sentadilla Libre / Búlgara', 'Pierna', 'Barra o Mancuernas', 'Desciende controlando rodillas alineadas con la punta del pie, mantén el core firme y sube empujando con talón.', 'svg_anim', 'squat'),
  (null, 'Hip Thrust con Barra', 'Pierna', 'Barra y Banco', 'Apoya escápulas en el banco, empuja la cadera arriba hasta extensión completa con pausa de 2 segundos en glúteo.', 'svg_anim', 'hip_thrust'),
  (null, 'Peso Muerto Rumano', 'Pierna', 'Barra o Mancuernas', 'Lleva la cadera hacia atrás con rodillas semiflexionadas, mantén la barra pegada a las piernas y activa isquiotibiales.', 'svg_anim', 'rdl'),
  (null, 'Press Militar con Mancuernas', 'Hombro', 'Mancuernas', 'Core firme sin arquear la espalda baja. Empuja en vertical hasta extender brazos por completo.', 'svg_anim', 'shoulder_press'),
  (null, 'Elevaciones Laterales', 'Hombro', 'Mancuernas / Polea', 'Sube los brazos ligeramente por delante del plano escapular hasta la altura del hombro con control.', 'svg_anim', 'lateral_raise'),
  (null, 'Curl de Bíceps con Mancuernas', 'Bíceps', 'Mancuernas', 'Mantén codos pegados al costado, supina la muñeca al subir y controla el descenso en 3 segundos.', 'svg_anim', 'bicep_curl'),
  (null, 'Extensión de Tríceps con Cuerda', 'Tríceps', 'Polea Alta', 'Fija los codos a los costados y abre las puntas de la cuerda al extender por completo el antebrazo.', 'svg_anim', 'tricep_pushdown'),
  (null, 'Plancha Abdominal Isométrica', 'Abdomen', 'Peso Corporal', 'Alinea cabeza, espalda y cadera. Contrae glúteos y abdomen profundo evitando que la cadera caiga.', 'svg_anim', 'plank'),
  (null, 'Crunch en Polea / Elevación de Piernas', 'Abdomen', 'Polea o Colchoneta', 'Flexiona la columna vertebral exhalando al contraer el abdomen, sin jalar el cuello.', 'svg_anim', 'crunch'),
  (null, 'HIIT / Jumping Jacks & Cuerda', 'Cardio', 'Sin equipo / Cuerda', 'Mantén ritmo constante respirando de forma controlada, aterrizando suave sobre las puntas de los pies.', 'svg_anim', 'cardio_jump')
on conflict do nothing;
