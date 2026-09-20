-- =====================================================================
--  Migration 002 — Super admin
--  Supabase → SQL Editor → paste → Run  (idempotent)
--  schema.sql-এও এই সব যোগ করা আছে; পুরনো project-এ শুধু এটা চালালেই হবে।
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. profiles.email — admin user list-এ search-এর জন্য (auth.users থেকে copy)
-- ---------------------------------------------------------------------
alter table public.profiles add column if not exists email text;
create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_role_idx on public.profiles (role);

update public.profiles p set email = u.email
from auth.users u where u.id = p.id and p.email is distinct from u.email;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role public.user_role := 'patient';
begin
  if (new.raw_user_meta_data->>'role') = 'doctor' then
    v_role := 'doctor';
  end if;

  insert into public.profiles (id, role, full_name, phone, locale, email)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    coalesce(nullif(new.raw_user_meta_data->>'locale', ''), 'bn'),
    new.email
  )
  on conflict (id) do update set email = excluded.email;

  if v_role = 'doctor' then
    insert into public.doctors (profile_id) values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

-- email বদলালে profiles-এও sync
create or replace function public.sync_profile_email()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.profiles set email = new.email where id = new.id and email is distinct from new.email;
  return new;
end;
$$;
drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- ---------------------------------------------------------------------
-- 2. Admin — সব table-এ পূর্ণ অধিকার (profiles/doctors/appointments/hospitals-এ আগেই ছিল)
-- ---------------------------------------------------------------------
drop policy if exists "readings: admin all" on public.glucose_readings;
create policy "readings: admin all" on public.glucose_readings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "reports: admin all" on public.reports;
create policy "reports: admin all" on public.reports
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "reports storage: admin all" on storage.objects;
create policy "reports storage: admin all" on storage.objects
  for all to authenticated
  using (bucket_id = 'reports' and public.is_admin())
  with check (bucket_id = 'reports' and public.is_admin());

-- ---------------------------------------------------------------------
-- 3. Announcements — admin লেখে, সবাই দেখে
-- ---------------------------------------------------------------------
create table if not exists public.announcements (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 120),
  body        text not null check (char_length(body) <= 2000),
  level       text not null default 'info' check (level in ('info', 'success', 'warning', 'danger')),
  audience    text not null default 'all' check (audience in ('all', 'patient', 'doctor')),
  is_active   boolean not null default true,
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists announcements_active_idx on public.announcements (is_active, starts_at desc);

alter table public.announcements enable row level security;

drop policy if exists "announcements: active public read" on public.announcements;
create policy "announcements: active public read" on public.announcements
  for select to anon, authenticated
  using (is_active and starts_at <= now() and (ends_at is null or ends_at > now()));

drop policy if exists "announcements: admin all" on public.announcements;
create policy "announcements: admin all" on public.announcements
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.announcements to anon;
grant select, insert, update, delete on public.announcements to authenticated;

-- ---------------------------------------------------------------------
-- 4. Admin stats (এক query-তে সব count) — security definer, শুধু admin call করতে পারে
-- ---------------------------------------------------------------------
create or replace function public.admin_stats()
returns json
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'অনুমতি নেই';
  end if;
  return json_build_object(
    'users_total',        (select count(*) from public.profiles),
    'patients',           (select count(*) from public.profiles where role = 'patient'),
    'doctors_total',      (select count(*) from public.doctors),
    'doctors_verified',   (select count(*) from public.doctors where is_verified),
    'admins',             (select count(*) from public.profiles where role = 'admin'),
    'users_7d',           (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'readings_total',     (select count(*) from public.glucose_readings),
    'readings_today',     (select count(*) from public.glucose_readings where measured_at >= date_trunc('day', now())),
    'readings_7d',        (select count(*) from public.glucose_readings where measured_at >= now() - interval '7 days'),
    'reports_total',      (select count(*) from public.reports),
    'reports_bytes',      (select coalesce(sum(file_size), 0) from public.reports),
    'appts_pending',      (select count(*) from public.appointments where status = 'pending'),
    'appts_accepted',     (select count(*) from public.appointments where status = 'accepted'),
    'appts_total',        (select count(*) from public.appointments),
    'hospitals',          (select count(*) from public.hospitals),
    'announcements_active', (select count(*) from public.announcements where is_active)
  );
end;
$$;
grant execute on function public.admin_stats() to authenticated;
