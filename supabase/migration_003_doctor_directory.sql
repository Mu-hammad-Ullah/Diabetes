-- =====================================================================
--  Migration 003 — Doctor directory (গবেষণা করা ডাক্তার তালিকা; account নয়)
--  Supabase → SQL Editor → paste → Run  (idempotent)
--  Registered doctors (doctors table) আলাদা — তারা app-এ appointment নেন।
--  Directory = নাম/degree/হাসপাতাল/ফোন — রোগী ফোন করে appointment নেবে।
-- =====================================================================

create table if not exists public.doctor_directory (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 1 and 160),
  degrees       text,
  designation   text,
  specialty     text not null default 'Endocrinology / Diabetology',
  hospital_name text not null,
  branch        text,
  city          text not null,
  phone         text,
  phone_type    text,
  source_url    text,
  hospital_id   uuid references public.hospitals(id) on delete set null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists doctor_directory_city_idx on public.doctor_directory (city, is_active);
create unique index if not exists doctor_directory_uidx on public.doctor_directory (lower(name), hospital_name, coalesce(branch, ''));

alter table public.doctor_directory enable row level security;

drop policy if exists "directory: public read" on public.doctor_directory;
create policy "directory: public read" on public.doctor_directory
  for select to anon, authenticated using (is_active);

drop policy if exists "directory: admin all" on public.doctor_directory;
create policy "directory: admin all" on public.doctor_directory
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.doctor_directory to anon;
grant select, insert, update, delete on public.doctor_directory to authenticated;

-- admin_stats-এ directory count
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
    'directory',          (select count(*) from public.doctor_directory where is_active),
    'announcements_active', (select count(*) from public.announcements where is_active)
  );
end;
$$;
