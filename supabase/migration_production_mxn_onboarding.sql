-- ============================================================================
-- MiGymBrou — Migración Producción: Onboarding, Planes MXN y Cupos de Alumnos
-- Ejecutar en Supabase SQL Editor (100% idempotente)
-- ============================================================================

-- 1. Campos de Onboarding y Plan SaaS MXN en profiles
alter table public.profiles
  add column if not exists has_completed_onboarding boolean not null default false;

alter table public.profiles
  add column if not exists saas_plan_tier text not null default 'free';

alter table public.profiles
  add column if not exists saas_student_limit int default 5;

alter table public.profiles drop constraint if exists profiles_saas_plan_tier_check;
alter table public.profiles add constraint profiles_saas_plan_tier_check
  check (saas_plan_tier in ('free', 'base', 'pro', 'studio'));

-- 2. Actualizar trigger handle_new_user para soportar plan inicial y vinculación por token/correo
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_role text;
  user_name text;
  plan_tier text;
  plan_limit int;
begin
  user_role := coalesce(new.raw_user_meta_data->>'role', 'student');
  user_name := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  plan_tier := coalesce(new.raw_user_meta_data->>'saas_plan_tier', 'free');

  if plan_tier not in ('free', 'base', 'pro', 'studio') then
    plan_tier := 'free';
  end if;

  plan_limit := case plan_tier
    when 'free' then 5
    when 'base' then 15
    when 'pro' then 50
    when 'studio' then null
    else 5
  end;

  insert into public.profiles (
    id, role, full_name, email, brand_name, specialty,
    saas_plan_tier, saas_student_limit, has_completed_onboarding, terms_accepted_at
  )
  values (
    new.id, user_role, user_name, new.email,
    new.raw_user_meta_data->>'brand_name',
    new.raw_user_meta_data->>'specialty',
    plan_tier,
    plan_limit,
    false,
    coalesce((new.raw_user_meta_data->>'terms_accepted_at')::timestamptz, now())
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        updated_at = now();

  if user_role = 'student' then
    update public.coach_students
    set student_id = new.id,
        invite_status = 'active',
        subscription_status = case when subscription_status = 'trial' then 'active' else subscription_status end,
        updated_at = now()
    where (
      lower(invited_email) = lower(new.email)
      or (
        new.raw_user_meta_data->>'invite_token' is not null
        and invite_token = new.raw_user_meta_data->>'invite_token'
      )
    )
    and student_id is null;
  end if;

  return new;
end;
$$;

-- 3. Permitir que un alumno autenticado consulte su propia invitación pendiente por correo
drop policy if exists "Students view pending invite by email" on public.coach_students;
create policy "Students view pending invite by email"
  on public.coach_students for select
  using (
    auth.uid() = student_id
    or lower(invited_email) = lower(coalesce(auth.jwt()->>'email', ''))
  );

-- 4. Índice por invite_token para resolución rápida de enlaces de invitación
create index if not exists idx_coach_students_invite_token on public.coach_students(invite_token);
