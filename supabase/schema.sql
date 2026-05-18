create table if not exists public.qms_records (
  collection text not null,
  id text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create index if not exists qms_records_collection_idx
  on public.qms_records (collection);

create or replace function public.set_qms_records_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_qms_records_updated_at on public.qms_records;

create trigger set_qms_records_updated_at
before update on public.qms_records
for each row
execute function public.set_qms_records_updated_at();

alter table public.qms_records enable row level security;

drop policy if exists "QMS records are readable" on public.qms_records;
drop policy if exists "QMS records can be inserted" on public.qms_records;
drop policy if exists "QMS records can be updated" on public.qms_records;
drop policy if exists "QMS records can be deleted" on public.qms_records;

create policy "QMS records are readable"
on public.qms_records
for select
to anon, authenticated
using (true);

create policy "QMS records can be inserted"
on public.qms_records
for insert
to anon, authenticated
with check (true);

create policy "QMS records can be updated"
on public.qms_records
for update
to anon, authenticated
using (true)
with check (true);

create policy "QMS records can be deleted"
on public.qms_records
for delete
to anon, authenticated
using (true);
