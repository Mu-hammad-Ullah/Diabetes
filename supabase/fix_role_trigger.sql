-- One-off fix: SQL Editor থেকে role / is_verified বদলানো allow (API দিয়ে শুধু admin)
create or replace function public.protect_profile_role()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'role পরিবর্তনের অনুমতি নেই';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.protect_doctor_verification()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.is_verified is distinct from old.is_verified and auth.uid() is not null and not public.is_admin() then
    raise exception 'ভেরিফিকেশন পরিবর্তনের অনুমতি নেই';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- এবার admin বানানো
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = 'ullah8701@gmail.com');

select u.email, p.role from auth.users u join public.profiles p on p.id = u.id;
