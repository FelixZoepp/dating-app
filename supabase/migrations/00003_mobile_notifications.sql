-- FounderMatch: Mobile & Notification Infrastructure

-- Push tokens
create table public.push_tokens (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  token text not null,
  platform text not null check (platform in ('ios', 'android', 'web')),
  device_id text,
  created_at timestamptz default now() not null,
  last_used_at timestamptz default now(),
  is_active boolean default true
);

create index idx_push_tokens_user on public.push_tokens(user_id);
create index idx_push_tokens_active on public.push_tokens(is_active) where is_active = true;
create unique index idx_push_tokens_unique on public.push_tokens(user_id, token);

alter table public.push_tokens enable row level security;

create policy "Users can manage own tokens" on public.push_tokens
  for all using (auth.uid() = user_id);

-- Notification preferences
create table public.notification_preferences (
  user_id uuid references public.profiles on delete cascade primary key,
  likes_enabled boolean default true,
  matches_enabled boolean default true,
  messages_enabled boolean default true,
  offers_enabled boolean default true,
  insights_enabled boolean default true,
  concierge_enabled boolean default true,
  marketing_enabled boolean default false
);

alter table public.notification_preferences enable row level security;

create policy "Users can manage own preferences" on public.notification_preferences
  for all using (auth.uid() = user_id);

-- Create default preferences on profile creation
create or replace function public.handle_new_profile_preferences()
returns trigger as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_create_preferences
  after insert on public.profiles
  for each row execute procedure public.handle_new_profile_preferences();

-- Notifications inbox
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  type text not null,
  title text not null,
  body text not null,
  deep_link text,
  read_at timestamptz,
  created_at timestamptz default now() not null,
  metadata jsonb default '{}'::jsonb
);

create index idx_notifications_user on public.notifications(user_id);
create index idx_notifications_unread on public.notifications(user_id, read_at) where read_at is null;
create index idx_notifications_created on public.notifications(created_at);

alter table public.notifications enable row level security;

create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications" on public.notifications
  for update using (auth.uid() = user_id);

create policy "Admins can manage all notifications" on public.notifications
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));
