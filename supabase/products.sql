create schema if not exists cinghouse;

grant usage on schema cinghouse to anon, authenticated, service_role;

create table if not exists cinghouse.products (
  id text primary key,
  sku text not null unique,
  name text not null,
  category text not null,
  category_name text not null,
  price numeric not null check (price >= 0),
  currency text not null default 'VND',
  status text not null check (status in ('active', 'inactive')),
  image text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table cinghouse.products alter column image set default '';

create or replace function cinghouse.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on cinghouse.products;

create trigger set_products_updated_at
before update on cinghouse.products
for each row
execute function cinghouse.set_updated_at();

alter table cinghouse.products enable row level security;

grant select, insert, update, delete on table cinghouse.products to anon, authenticated;
grant all on table cinghouse.products to service_role;

drop policy if exists "Products are readable by app" on cinghouse.products;
create policy "Products are readable by app"
on cinghouse.products
for select
to anon, authenticated
using (true);

drop policy if exists "Products can be inserted by app" on cinghouse.products;
create policy "Products can be inserted by app"
on cinghouse.products
for insert
to anon, authenticated
with check (true);

drop policy if exists "Products can be updated by app" on cinghouse.products;
create policy "Products can be updated by app"
on cinghouse.products
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Products can be deleted by app" on cinghouse.products;
create policy "Products can be deleted by app"
on cinghouse.products
for delete
to anon, authenticated
using (true);
