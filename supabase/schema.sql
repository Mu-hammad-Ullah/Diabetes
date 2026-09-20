-- =====================================================================
--  Diabetes Care Platform — Supabase schema
--  Supabase Dashboard → SQL Editor → New query → এই পুরো ফাইল paste → Run
--  পুরো ফাইল idempotent (বারবার চালানো নিরাপদ)।
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('patient', 'doctor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.reading_type as enum ('fasting', 'after_meal', 'random', 'bedtime');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.diabetes_type as enum ('type1', 'type2', 'gestational', 'prediabetes', 'unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum ('pending', 'accepted', 'rejected', 'cancelled', 'completed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------

-- প্রতিটা auth user-এর জন্য একটা profile (trigger দিয়ে auto-create হয়)
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           public.user_role not null default 'patient',
  full_name      text not null default '',
  phone          text,
  date_of_birth  date,
  gender         text check (gender in ('male', 'female', 'other')),
  diabetes_type  public.diabetes_type not null default 'unknown',
  diagnosed_year smallint check (diagnosed_year between 1900 and 2100),
  height_cm      numeric(5,1) check (height_cm between 50 and 250),
  weight_kg      numeric(5,1) check (weight_kg between 10 and 400),
  locale         text not null default 'bn' check (locale in ('bn', 'en')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Blood glucose readings (mmol/L)
create table if not exists public.glucose_readings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  reading_type public.reading_type not null,
  value_mmol   numeric(4,1) not null check (value_mmol between 1.0 and 40.0),
  measured_at  timestamptz not null default now(),
  note         text check (char_length(note) <= 500),
  created_at   timestamptz not null default now()
);
create index if not exists glucose_readings_user_time_idx
  on public.glucose_readings (user_id, measured_at desc);

-- Uploaded medical reports (file lives in private storage bucket "reports")
create table if not exists public.reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  title         text not null check (char_length(title) between 1 and 120),
  report_date   date not null default current_date,
  file_path     text not null,                       -- "<user_id>/<uuid>.<ext>"
  file_type     text not null,                       -- mime type
  file_size     integer not null check (file_size > 0 and file_size <= 10485760),
  -- রোগী নিজে হাতে entry করবে (OCR নেই)
  hba1c         numeric(4,1) check (hba1c between 3 and 20),
  fasting_mmol  numeric(4,1) check (fasting_mmol between 1 and 40),
  pp_mmol       numeric(4,1) check (pp_mmol between 1 and 40),
  notes         text check (char_length(notes) <= 1000),
  created_at    timestamptz not null default now()
);
create index if not exists reports_user_date_idx on public.reports (user_id, report_date desc);

-- Doctor profile (extends profiles where role = 'doctor')
create table if not exists public.doctors (
  id               uuid primary key default gen_random_uuid(),
  profile_id       uuid not null unique references public.profiles(id) on delete cascade,
  specialty        text not null default 'Diabetologist',
  qualification    text not null default '',
  registration_no  text,                              -- BMDC reg no
  hospital_name    text not null default '',
  chamber_address  text not null default '',
  city             text not null default '',
  consultation_fee integer check (consultation_fee >= 0),
  available_days   text[] not null default '{}',      -- e.g. {sat,sun,mon}
  available_hours  text,                              -- free text "5pm–9pm"
  bio              text check (char_length(bio) <= 1000),
  is_verified      boolean not null default false,    -- শুধু admin true করতে পারবে
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists doctors_verified_city_idx on public.doctors (is_verified, city);

-- Appointment requests
create table if not exists public.appointments (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.profiles(id) on delete cascade,
  doctor_id      uuid not null references public.doctors(id) on delete cascade,
  requested_date date not null,
  requested_slot text not null check (requested_slot in ('morning', 'afternoon', 'evening')),
  reason         text check (char_length(reason) <= 500),
  status         public.appointment_status not null default 'pending',
  doctor_note    text check (char_length(doctor_note) <= 500),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists appointments_patient_idx on public.appointments (patient_id, created_at desc);
create index if not exists appointments_doctor_idx  on public.appointments (doctor_id, status, requested_date);

-- Curated hospital list (public read)
create table if not exists public.hospitals (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null,
  name_bn                 text,
  type                    text not null default 'hospital',   -- hospital | clinic | diabetic_center
  address                 text,
  city                    text not null,
  country_code            char(2) not null default 'BD',
  lat                     double precision not null check (lat between -90 and 90),
  lng                     double precision not null check (lng between -180 and 180),
  phone                   text,
  website                 text,
  is_diabetes_specialized boolean not null default false,
  created_at              timestamptz not null default now()
);
create index if not exists hospitals_country_city_idx on public.hospitals (country_code, city);

-- ---------------------------------------------------------------------
-- HELPER FUNCTIONS (security definer, RLS policy-র ভেতরে ব্যবহার হয়)
-- ---------------------------------------------------------------------

create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.my_doctor_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.doctors where profile_id = auth.uid();
$$;

-- ডাক্তার রোগীর ডেটা দেখতে পারবে শুধু accepted/completed appointment থাকলে
create or replace function public.doctor_can_view_patient(p_patient uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.appointments a
    join public.doctors d on d.id = a.doctor_id
    where a.patient_id = p_patient
      and d.profile_id = auth.uid()
      and a.status in ('accepted', 'completed')
  );
$$;

-- Haversine distance-এ কাছের হাসপাতাল (PostGIS ছাড়াই)
create or replace function public.nearby_hospitals(p_lat double precision, p_lng double precision, p_radius_km double precision default 25, p_limit int default 20)
returns table (
  id uuid, name text, name_bn text, type text, address text, city text,
  lat double precision, lng double precision, phone text,
  is_diabetes_specialized boolean, distance_km double precision
)
language sql stable
as $$
  select h.id, h.name, h.name_bn, h.type, h.address, h.city, h.lat, h.lng, h.phone,
         h.is_diabetes_specialized,
         (6371 * acos(least(1.0, greatest(-1.0,
            cos(radians(p_lat)) * cos(radians(h.lat)) * cos(radians(h.lng) - radians(p_lng))
            + sin(radians(p_lat)) * sin(radians(h.lat))
         )))) as distance_km
  from public.hospitals h
  where (6371 * acos(least(1.0, greatest(-1.0,
            cos(radians(p_lat)) * cos(radians(h.lat)) * cos(radians(h.lng) - radians(p_lng))
            + sin(radians(p_lat)) * sin(radians(h.lat))
         )))) <= p_radius_km
  order by distance_km
  limit p_limit;
$$;

-- ---------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------

-- Signup হলে profile তৈরি। role metadata থেকে নেয়, কিন্তু admin কখনো signup দিয়ে হওয়া যাবে না।
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

  insert into public.profiles (id, role, full_name, phone, locale)
  values (
    new.id,
    v_role,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    coalesce(nullif(new.raw_user_meta_data->>'locale', ''), 'bn')
  )
  on conflict (id) do nothing;

  if v_role = 'doctor' then
    insert into public.doctors (profile_id) values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- role শুধু admin বদলাতে পারবে
create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'role পরিবর্তনের অনুমতি নেই';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- is_verified শুধু admin বদলাতে পারবে
create or replace function public.protect_doctor_verification()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.is_verified is distinct from old.is_verified and not public.is_admin() then
    raise exception 'ভেরিফিকেশন পরিবর্তনের অনুমতি নেই';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists doctors_protect_verification on public.doctors;
create trigger doctors_protect_verification
  before update on public.doctors
  for each row execute function public.protect_doctor_verification();

-- Appointment status transition guard
create or replace function public.guard_appointment_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_is_patient boolean := (old.patient_id = auth.uid());
  v_is_doctor  boolean := exists (select 1 from public.doctors d where d.id = old.doctor_id and d.profile_id = auth.uid());
begin
  if public.is_admin() then
    new.updated_at := now();
    return new;
  end if;

  -- কেউ patient/doctor/date বদলাতে পারবে না
  if new.patient_id <> old.patient_id or new.doctor_id <> old.doctor_id
     or new.requested_date <> old.requested_date or new.requested_slot <> old.requested_slot then
    raise exception 'appointment-এর মূল তথ্য পরিবর্তন করা যাবে না';
  end if;

  if v_is_patient then
    -- রোগী শুধু pending/accepted → cancelled করতে পারবে
    if not (old.status in ('pending', 'accepted') and new.status = 'cancelled') then
      raise exception 'রোগী শুধু appointment বাতিল করতে পারবে';
    end if;
    if new.doctor_note is distinct from old.doctor_note then
      raise exception 'doctor_note পরিবর্তনের অনুমতি নেই';
    end if;
  elsif v_is_doctor then
    -- ডাক্তার: pending → accepted/rejected, accepted → completed/cancelled
    if not (
      (old.status = 'pending'  and new.status in ('accepted', 'rejected')) or
      (old.status = 'accepted' and new.status in ('completed', 'cancelled')) or
      (old.status = new.status)
    ) then
      raise exception 'এই status পরিবর্তন অনুমোদিত নয়';
    end if;
    if new.reason is distinct from old.reason then
      raise exception 'reason পরিবর্তনের অনুমতি নেই';
    end if;
  else
    raise exception 'অনুমতি নেই';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists appointments_guard_update on public.appointments;
create trigger appointments_guard_update
  before update on public.appointments
  for each row execute function public.guard_appointment_update();

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.glucose_readings enable row level security;
alter table public.reports          enable row level security;
alter table public.doctors          enable row level security;
alter table public.appointments     enable row level security;
alter table public.hospitals        enable row level security;

-- ---- profiles ----
drop policy if exists "profiles: own select" on public.profiles;
create policy "profiles: own select" on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists "profiles: verified doctors visible" on public.profiles;
create policy "profiles: verified doctors visible" on public.profiles
  for select to authenticated
  using (role = 'doctor' and exists (
    select 1 from public.doctors d where d.profile_id = profiles.id and d.is_verified
  ));

drop policy if exists "profiles: doctor sees own patients" on public.profiles;
create policy "profiles: doctor sees own patients" on public.profiles
  for select to authenticated
  using (exists (
    select 1 from public.appointments a
    join public.doctors d on d.id = a.doctor_id
    where a.patient_id = profiles.id and d.profile_id = auth.uid()
  ));

drop policy if exists "profiles: admin all" on public.profiles;
create policy "profiles: admin all" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles: own update" on public.profiles;
create policy "profiles: own update" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---- glucose_readings ----
drop policy if exists "readings: own all" on public.glucose_readings;
create policy "readings: own all" on public.glucose_readings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "readings: doctor view patient" on public.glucose_readings;
create policy "readings: doctor view patient" on public.glucose_readings
  for select to authenticated using (public.doctor_can_view_patient(user_id));

-- ---- reports ----
drop policy if exists "reports: own all" on public.reports;
create policy "reports: own all" on public.reports
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "reports: doctor view patient" on public.reports;
create policy "reports: doctor view patient" on public.reports
  for select to authenticated using (public.doctor_can_view_patient(user_id));

-- ---- doctors ----
drop policy if exists "doctors: verified public" on public.doctors;
create policy "doctors: verified public" on public.doctors
  for select to authenticated using (is_verified = true);

drop policy if exists "doctors: own select" on public.doctors;
create policy "doctors: own select" on public.doctors
  for select to authenticated using (profile_id = auth.uid());

drop policy if exists "doctors: own update" on public.doctors;
create policy "doctors: own update" on public.doctors
  for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists "doctors: admin all" on public.doctors;
create policy "doctors: admin all" on public.doctors
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- appointments ----
drop policy if exists "appointments: patient select" on public.appointments;
create policy "appointments: patient select" on public.appointments
  for select to authenticated using (patient_id = auth.uid());

drop policy if exists "appointments: patient insert" on public.appointments;
create policy "appointments: patient insert" on public.appointments
  for insert to authenticated
  with check (
    patient_id = auth.uid()
    and status = 'pending'
    and requested_date >= current_date
    and exists (select 1 from public.doctors d where d.id = doctor_id and d.is_verified)
  );

drop policy if exists "appointments: patient update" on public.appointments;
create policy "appointments: patient update" on public.appointments
  for update to authenticated using (patient_id = auth.uid()) with check (patient_id = auth.uid());

drop policy if exists "appointments: doctor select" on public.appointments;
create policy "appointments: doctor select" on public.appointments
  for select to authenticated using (doctor_id = public.my_doctor_id());

drop policy if exists "appointments: doctor update" on public.appointments;
create policy "appointments: doctor update" on public.appointments
  for update to authenticated using (doctor_id = public.my_doctor_id()) with check (doctor_id = public.my_doctor_id());

drop policy if exists "appointments: admin all" on public.appointments;
create policy "appointments: admin all" on public.appointments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---- hospitals ----
drop policy if exists "hospitals: public read" on public.hospitals;
create policy "hospitals: public read" on public.hospitals
  for select to anon, authenticated using (true);

drop policy if exists "hospitals: admin write" on public.hospitals;
create policy "hospitals: admin write" on public.hospitals
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- STORAGE — private bucket "reports"
-- path convention: <user_id>/<uuid>.<ext>
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reports', 'reports', false, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "reports storage: own read" on storage.objects;
create policy "reports storage: own read" on storage.objects
  for select to authenticated
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "reports storage: own insert" on storage.objects;
create policy "reports storage: own insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "reports storage: own delete" on storage.objects;
create policy "reports storage: own delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "reports storage: doctor read patient" on storage.objects;
create policy "reports storage: doctor read patient" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'reports'
    and public.doctor_can_view_patient(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------
-- GRANTS (Supabase default roles)
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.hospitals to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.nearby_hospitals(double precision, double precision, double precision, int) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.my_role() to authenticated;
grant execute on function public.my_doctor_id() to authenticated;
grant execute on function public.doctor_can_view_patient(uuid) to authenticated;

-- =====================================================================
-- প্রথম admin বানাতে (আপনার নিজের email দিয়ে signup করার পর):
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'you@example.com');
-- =====================================================================
