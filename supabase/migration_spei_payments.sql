-- ============================================================================
-- MiGymBrou — Migración: Solicitudes de Pago SPEI y Comprobantes
-- 100% idempotente — Ejecutar en Supabase SQL Editor
-- ============================================================================

create table if not exists public.saas_payment_requests (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references public.profiles(id) on delete set null,
  coach_name text not null,
  coach_email text not null,
  plan_tier text not null check (plan_tier in ('base', 'pro', 'studio')),
  amount_mxn numeric(10, 2) not null,
  transfer_reference text,
  receipt_url text not null,
  receipt_name text not null,
  notes text,
  status text not null check (status in ('pendiente', 'aprobado', 'rechazado')) default 'pendiente',
  admin_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_saas_payment_requests_status
  on public.saas_payment_requests(status, created_at desc);

create index if not exists idx_saas_payment_requests_coach
  on public.saas_payment_requests(coach_id, created_at desc);

-- Storage bucket para comprobantes de pago SPEI
insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', true)
on conflict (id) do nothing;

drop policy if exists "Public read payment receipts" on storage.objects;
create policy "Public read payment receipts"
  on storage.objects for select
  using (bucket_id = 'payment-receipts');

drop policy if exists "Authenticated upload payment receipts" on storage.objects;
create policy "Authenticated upload payment receipts"
  on storage.objects for insert
  with check (bucket_id = 'payment-receipts');

-- RLS estricto
alter table public.saas_payment_requests enable row level security;

drop policy if exists "Coaches view own payment requests" on public.saas_payment_requests;
create policy "Coaches view own payment requests"
  on public.saas_payment_requests for select
  using (
    auth.uid() = coach_id
    or lower(coach_email) = lower(coalesce(auth.jwt()->>'email', ''))
    or public.is_admin()
  );

drop policy if exists "Coaches create payment requests" on public.saas_payment_requests;
create policy "Coaches create payment requests"
  on public.saas_payment_requests for insert
  with check (true);

drop policy if exists "Admins manage payment requests" on public.saas_payment_requests;
create policy "Admins manage payment requests"
  on public.saas_payment_requests for update
  using (public.is_admin())
  with check (public.is_admin());
