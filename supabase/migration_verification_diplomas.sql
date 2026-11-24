-- ============================================================================
-- MIGRACIÓN INCREMENTAL: Verificación de Personas Reales + Diplomas de Coaches
-- Ejecuta este archivo en el SQL Editor de Supabase si tu base ya existía.
-- ============================================================================

-- 1. Agregar columnas nuevas a public.profiles (sin borrar datos existentes)
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

create index if not exists idx_profiles_verified
  on public.profiles(role, is_verified_identity, accepting_students);

-- 2. Tabla de Diplomas y Certificaciones del Coach
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

create index if not exists idx_coach_certifications_coach
  on public.coach_certifications(coach_id, uploaded_at desc);

-- 3. Tabla de Solicitudes de Alumnos Buscando Coach
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

create index if not exists idx_coach_inquiries_coach
  on public.coach_inquiries(coach_id, status);

-- 4. Actualizar tipos permitidos en public.notifications
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('workout', 'diet', 'assessment', 'appointment', 'subscription', 'goal', 'verification', 'inquiry'));

-- 5. Habilitar RLS y políticas nuevas (idempotentes)
alter table public.coach_certifications enable row level security;
alter table public.coach_inquiries enable row level security;

drop policy if exists "Public directory view coaches" on public.profiles;
create policy "Public directory view coaches"
  on public.profiles for select
  using (role = 'coach' and accepting_students = true);

drop policy if exists "Coaches review student verification" on public.profiles;
create policy "Coaches review student verification"
  on public.profiles for update
  using (public.is_coach_of(id));

drop policy if exists "Anyone views coach certifications" on public.coach_certifications;
create policy "Anyone views coach certifications"
  on public.coach_certifications for select
  using (true);

drop policy if exists "Coaches manage own certifications" on public.coach_certifications;
create policy "Coaches manage own certifications"
  on public.coach_certifications for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

drop policy if exists "Coaches view and respond to own inquiries" on public.coach_inquiries;
create policy "Coaches view and respond to own inquiries"
  on public.coach_inquiries for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

drop policy if exists "Students create inquiries" on public.coach_inquiries;
create policy "Students create inquiries"
  on public.coach_inquiries for insert
  with check (true);

drop policy if exists "Students view own inquiries" on public.coach_inquiries;
create policy "Students view own inquiries"
  on public.coach_inquiries for select
  using (auth.uid() = student_id);

drop policy if exists "Public view active coach plans for directory" on public.coach_subscription_plans;
create policy "Public view active coach plans for directory"
  on public.coach_subscription_plans for select
  using (is_active = true);

-- 6. Buckets de Storage para diplomas e identificaciones
insert into storage.buckets (id, name, public)
  values ('coach-certifications', 'coach-certifications', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('identity-docs', 'identity-docs', false)
  on conflict (id) do nothing;

-- Políticas de Storage para subir archivos de diplomas e IDs
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
