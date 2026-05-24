create schema if not exists cinghouse;

grant usage on schema cinghouse to anon, authenticated, service_role;

create or replace function cinghouse.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists cinghouse.branches (
  id text primary key,
  name text not null unique,
  code text unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists branches_active_sort_idx on cinghouse.branches (is_active, sort_order, name);

drop trigger if exists set_branches_updated_at on cinghouse.branches;

create trigger set_branches_updated_at
before update on cinghouse.branches
for each row
execute function cinghouse.set_updated_at();

alter table cinghouse.branches enable row level security;

grant select, insert, update, delete on table cinghouse.branches to anon, authenticated;
grant all on table cinghouse.branches to service_role;

drop policy if exists "Branches are readable by app" on cinghouse.branches;
create policy "Branches are readable by app"
on cinghouse.branches
for select
to anon, authenticated
using (true);

drop policy if exists "Branches can be inserted by app" on cinghouse.branches;
create policy "Branches can be inserted by app"
on cinghouse.branches
for insert
to anon, authenticated
with check (true);

drop policy if exists "Branches can be updated by app" on cinghouse.branches;
create policy "Branches can be updated by app"
on cinghouse.branches
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Branches can be deleted by app" on cinghouse.branches;
create policy "Branches can be deleted by app"
on cinghouse.branches
for delete
to anon, authenticated
using (true);

insert into cinghouse.branches (id, name, code, is_active, sort_order)
values
  ('cing-house-vo-cuong', 'Cing House Võ Cường', 'VC', true, 1),
  ('cing-house-nguyen-gia-thieu', 'Cing House Nguyễn Gia Thiều', 'NGT', true, 2)
on conflict (id) do update set
  name = excluded.name,
  code = excluded.code,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
