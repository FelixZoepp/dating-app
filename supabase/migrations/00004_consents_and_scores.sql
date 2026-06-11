-- FounderMatch: Consents & Score Extensions

-- Consents table (DSGVO compliance)
create table public.consents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  type text not null check (type in ('terms', 'special_data', 'marketing')),
  version text not null default '1.0',
  granted boolean not null,
  granted_at timestamptz default now() not null,
  ip_address text
);

create index idx_consents_user on public.consents(user_id);
create index idx_consents_type on public.consents(user_id, type);

alter table public.consents enable row level security;

create policy "Users can view own consents" on public.consents
  for select using (auth.uid() = user_id);

create policy "Users can insert own consents" on public.consents
  for insert with check (auth.uid() = user_id);

create policy "Admins can view all consents" on public.consents
  for select using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Add score columns to profiles
alter table public.profiles
  add column if not exists score_ambition integer default 0,
  add column if not exists score_family integer default 0,
  add column if not exists score_lifestyle integer default 0,
  add column if not exists score_readiness integer default 0,
  add column if not exists score_total integer default 0,
  add column if not exists score_potential integer default 0;
