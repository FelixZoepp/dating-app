-- FounderMatch: Matching & Monetization Extensions

-- Analytics events table
create table public.analytics_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  event_name text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index idx_analytics_user on public.analytics_events(user_id);
create index idx_analytics_event on public.analytics_events(event_name);
create index idx_analytics_created on public.analytics_events(created_at);

-- RLS for analytics
alter table public.analytics_events enable row level security;

create policy "Users can insert own events" on public.analytics_events
  for insert with check (auth.uid() = user_id);

create policy "Users can view own events" on public.analytics_events
  for select using (auth.uid() = user_id);

create policy "Admins can view all events" on public.analytics_events
  for select using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Rejections table (skip/not interested)
create table public.rejections (
  id uuid default uuid_generate_v4() primary key,
  from_profile_id uuid references public.profiles on delete cascade not null,
  to_profile_id uuid references public.profiles on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(from_profile_id, to_profile_id)
);

create index idx_rejections_from on public.rejections(from_profile_id);

alter table public.rejections enable row level security;

create policy "Users can insert own rejections" on public.rejections
  for insert with check (auth.uid() = from_profile_id);

create policy "Users can view own rejections" on public.rejections
  for select using (auth.uid() = from_profile_id);

-- Blocks table
create table public.blocks (
  id uuid default uuid_generate_v4() primary key,
  from_profile_id uuid references public.profiles on delete cascade not null,
  to_profile_id uuid references public.profiles on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(from_profile_id, to_profile_id)
);

create index idx_blocks_from on public.blocks(from_profile_id);
create index idx_blocks_to on public.blocks(to_profile_id);

alter table public.blocks enable row level security;

create policy "Users can insert own blocks" on public.blocks
  for insert with check (auth.uid() = from_profile_id);

create policy "Users can view own blocks" on public.blocks
  for select using (auth.uid() = from_profile_id);

-- Add new columns to profiles
alter table public.profiles
  add column if not exists last_active_at timestamptz default now(),
  add column if not exists trial_started_at timestamptz,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists response_rate numeric default 0,
  add column if not exists total_likes_received integer default 0,
  add column if not exists total_likes_sent integer default 0,
  add column if not exists total_messages_sent integer default 0,
  add column if not exists is_flagged boolean default false;

-- Update plan check to include founder_pass
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check
  check (plan in ('basic', 'premium', 'elite', 'concierge', 'founder_pass'));

-- Function to update last_active_at
create or replace function public.update_last_active()
returns trigger as $$
begin
  update public.profiles
  set last_active_at = now()
  where id = auth.uid();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on likes to update stats
create or replace function public.update_like_stats()
returns trigger as $$
begin
  update public.profiles set total_likes_sent = total_likes_sent + 1 where id = new.from_profile_id;
  update public.profiles set total_likes_received = total_likes_received + 1 where id = new.to_profile_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_like_update_stats
  after insert on public.likes
  for each row execute procedure public.update_like_stats();

-- Trigger on messages to update stats
create or replace function public.update_message_stats()
returns trigger as $$
begin
  update public.profiles set total_messages_sent = total_messages_sent + 1 where id = new.sender_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_message_update_stats
  after insert on public.messages
  for each row execute procedure public.update_message_stats();
