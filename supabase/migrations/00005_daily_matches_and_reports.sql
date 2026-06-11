-- FounderMatch: Daily Matches, Reports & Storage

-- Daily match batches (curated daily suggestions)
create table public.daily_matches (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  suggested_profile_id uuid references public.profiles on delete cascade not null,
  batch_date date default current_date not null,
  compatibility_score integer default 0,
  status text default 'pending' check (status in ('pending', 'liked', 'rejected', 'expired')),
  created_at timestamptz default now() not null,
  unique(user_id, suggested_profile_id, batch_date)
);

create index idx_daily_matches_user_date on public.daily_matches(user_id, batch_date);
create index idx_daily_matches_status on public.daily_matches(user_id, status) where status = 'pending';

alter table public.daily_matches enable row level security;

create policy "Users can view own daily matches" on public.daily_matches
  for select using (auth.uid() = user_id);

create policy "Users can update own daily matches" on public.daily_matches
  for update using (auth.uid() = user_id);

-- Reports (trust & safety)
create table public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.profiles on delete cascade not null,
  reported_id uuid references public.profiles on delete cascade not null,
  reason text not null check (reason in (
    'fake_profile', 'harassment', 'inappropriate_content', 'spam',
    'underage', 'scam', 'offensive_language', 'other'
  )),
  details text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'action_taken', 'dismissed')),
  admin_notes text,
  created_at timestamptz default now() not null,
  reviewed_at timestamptz
);

create index idx_reports_status on public.reports(status) where status = 'pending';
create index idx_reports_reported on public.reports(reported_id);

alter table public.reports enable row level security;

create policy "Users can insert own reports" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "Users can view own reports" on public.reports
  for select using (auth.uid() = reporter_id);

create policy "Admins can manage all reports" on public.reports
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Plan limits config (how many daily suggestions per plan)
-- basic: 3/week (so ~0-1/day), premium: 20/week (~3/day), elite: unlimited
-- We store this as profile metadata, enforced in application logic

-- Add seeking_gender default + age range columns for matching
alter table public.profiles
  add column if not exists min_age integer default 18,
  add column if not exists max_age integer default 99,
  add column if not exists seeking_city text;
