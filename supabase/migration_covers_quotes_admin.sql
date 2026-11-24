-- ============================================================================
-- MiGymBrou — Migración: Portadas Dinámicas, 200+ Frases Motivacionales,
-- Persistencia Estricta de Onboarding y Panel de Administración (/admin)
-- 100% idempotente — Ejecutar en Supabase SQL Editor
-- ============================================================================

-- 1. Nuevos campos en public.profiles (portada, frase, onboarding estricto y sanciones)
alter table public.profiles
  add column if not exists cover_url text,
  add column if not exists cover_type text not null default 'default_female',
  add column if not exists custom_motivational_quote text,
  add column if not exists selected_quote_id text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_skipped boolean not null default false,
  add column if not exists account_status text not null default 'active',
  add column if not exists suspension_reason text,
  add column if not exists suspended_until timestamptz;

alter table public.profiles drop constraint if exists profiles_cover_type_check;
alter table public.profiles add constraint profiles_cover_type_check
  check (cover_type in ('default_male', 'default_female', 'preset', 'custom'));

alter table public.profiles drop constraint if exists profiles_account_status_check;
alter table public.profiles add constraint profiles_account_status_check
  check (account_status in ('active', 'warned', 'suspended', 'banned'));

-- Sincronizar onboarding_completed con has_completed_onboarding si ya existía
update public.profiles
set onboarding_completed = true,
    onboarding_completed_at = coalesce(onboarding_completed_at, now())
where has_completed_onboarding = true and onboarding_completed = false;

-- 2. Función helper de autorización estricta para Admin
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- 3. Catálogo de Frases Motivacionales (200+ frases)
create table if not exists public.motivational_quotes (
  id text primary key,
  text text not null,
  category text not null check (category in (
    'disciplina', 'constancia', 'fuerza_mental', 'superacion',
    'nutricion', 'recuperacion', 'enfoque'
  )),
  audience text not null check (audience in ('student', 'coach', 'both')) default 'both',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_motivational_quotes_cat on public.motivational_quotes(category, audience);

-- 4. Reportes de Usuarios (user_reports)
create table if not exists public.user_reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references public.profiles(id) on delete set null,
  reported_user_id uuid references public.profiles(id) on delete set null,
  reporter_name text not null,
  reported_user_name text not null,
  reported_role text not null check (reported_role in ('coach', 'student')) default 'coach',
  category text not null check (category in ('servicio', 'conducta', 'contenido', 'seguimiento', 'otro')) default 'servicio',
  description text not null,
  status text not null check (status in ('pendiente', 'en_revision', 'resuelto', 'descartado')) default 'pendiente',
  admin_notes text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_reports_status on public.user_reports(status, created_at desc);

-- 5. Sistema de Sanciones Graduadas (user_sanctions)
create table if not exists public.user_sanctions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_name text not null,
  user_role text not null check (user_role in ('coach', 'student')) default 'student',
  sanction_type text not null check (sanction_type in ('warning', 'temporary_suspension', 'permanent_ban')),
  reason text not null,
  duration_days int,
  expires_at timestamptz,
  is_active boolean not null default true,
  issued_by uuid references public.profiles(id) on delete set null,
  lifted_at timestamptz,
  lifted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_sanctions_user on public.user_sanctions(user_id, is_active);

-- 6. Storage Bucket para portadas personalizadas (profile-covers)
insert into storage.buckets (id, name, public)
values ('profile-covers', 'profile-covers', true)
on conflict (id) do nothing;

drop policy if exists "Public read profile covers" on storage.objects;
create policy "Public read profile covers"
  on storage.objects for select
  using (bucket_id = 'profile-covers');

drop policy if exists "Users upload own profile cover" on storage.objects;
create policy "Users upload own profile cover"
  on storage.objects for insert
  with check (bucket_id = 'profile-covers' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users update own profile cover" on storage.objects;
create policy "Users update own profile cover"
  on storage.objects for update
  using (bucket_id = 'profile-covers' and auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Row Level Security (RLS) estricto para Admin, Reportes, Sanciones y Frases
alter table public.motivational_quotes enable row level security;
alter table public.user_reports enable row level security;
alter table public.user_sanctions enable row level security;

-- Frases: lectura pública autenticada, escritura solo Admin
drop policy if exists "Anyone reads active motivational quotes" on public.motivational_quotes;
create policy "Anyone reads active motivational quotes"
  on public.motivational_quotes for select
  using (is_active = true);

drop policy if exists "Admins manage motivational quotes" on public.motivational_quotes;
create policy "Admins manage motivational quotes"
  on public.motivational_quotes for all
  using (public.is_admin())
  with check (public.is_admin());

-- Reportes: cualquier usuario autenticado puede crear su reporte y ver los suyos; Admin gestiona todos
drop policy if exists "Users create own reports" on public.user_reports;
create policy "Users create own reports"
  on public.user_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users view own submitted reports" on public.user_reports;
create policy "Users view own submitted reports"
  on public.user_reports for select
  using (auth.uid() = reporter_id or public.is_admin());

drop policy if exists "Admins update reports" on public.user_reports;
create policy "Admins update reports"
  on public.user_reports for update
  using (public.is_admin())
  with check (public.is_admin());

-- Sanciones: el usuario solo puede leer sus propias sanciones; solo Admin crea/actualiza/levanta
drop policy if exists "Users view own sanctions" on public.user_sanctions;
create policy "Users view own sanctions"
  on public.user_sanctions for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins manage sanctions" on public.user_sanctions;
create policy "Admins manage sanctions"
  on public.user_sanctions for all
  using (public.is_admin())
  with check (public.is_admin());

-- Admin puede leer y actualizar perfiles (verificación y sanciones)
drop policy if exists "Admins manage all profiles" on public.profiles;
create policy "Admins manage all profiles"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());
