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

create table if not exists cinghouse.orders (
  id text primary key,
  placed_time text not null,
  placed_time_full text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  branch text not null,
  channel text not null,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric not null default 0 check (subtotal >= 0),
  shipping_fee numeric not null default 0 check (shipping_fee >= 0),
  service_fee numeric check (service_fee is null or service_fee >= 0),
  total numeric not null default 0 check (total >= 0),
  status text not null check (status in ('NEW', 'PROCESSING', 'COMPLETED', 'CANCELLED')),
  notes text not null default '',
  table_ref text,
  screenshot text,
  created_by text not null,
  created_by_avatar text,
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists orders_status_idx on cinghouse.orders (status);
create index if not exists orders_branch_idx on cinghouse.orders (branch);
create index if not exists orders_created_at_idx on cinghouse.orders (created_at desc);

drop trigger if exists set_orders_updated_at on cinghouse.orders;

create trigger set_orders_updated_at
before update on cinghouse.orders
for each row
execute function cinghouse.set_updated_at();

alter table cinghouse.orders enable row level security;

grant select, insert, update, delete on table cinghouse.orders to anon, authenticated;
grant all on table cinghouse.orders to service_role;

drop policy if exists "Orders are readable by app" on cinghouse.orders;
create policy "Orders are readable by app"
on cinghouse.orders
for select
to anon, authenticated
using (true);

drop policy if exists "Orders can be inserted by app" on cinghouse.orders;
create policy "Orders can be inserted by app"
on cinghouse.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Orders can be updated by app" on cinghouse.orders;
create policy "Orders can be updated by app"
on cinghouse.orders
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Orders can be deleted by app" on cinghouse.orders;
create policy "Orders can be deleted by app"
on cinghouse.orders
for delete
to anon, authenticated
using (true);
