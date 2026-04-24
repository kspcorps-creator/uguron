create extension if not exists pgcrypto;

create table if not exists public.permit_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  project_name text not null,
  company_name text,
  jurisdiction text,
  permit_type text,
  submission_deadline date,
  status text not null default 'Draft',
  readiness_score integer not null default 0 check (readiness_score between 0 and 100),
  missing_items text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.permit_projects enable row level security;

drop policy if exists "Users can view their own permit projects" on public.permit_projects;
create policy "Users can view their own permit projects"
on public.permit_projects for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own permit projects" on public.permit_projects;
create policy "Users can create their own permit projects"
on public.permit_projects for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own permit projects" on public.permit_projects;
create policy "Users can update their own permit projects"
on public.permit_projects for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own permit projects" on public.permit_projects;
create policy "Users can delete their own permit projects"
on public.permit_projects for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_permit_projects_updated_at on public.permit_projects;

create trigger set_permit_projects_updated_at
before update on public.permit_projects
for each row execute function public.set_updated_at();
