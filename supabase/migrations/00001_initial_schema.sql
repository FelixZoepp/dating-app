-- FounderMatch Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  created_at timestamptz default now() not null,
  email text not null,
  first_name text,
  age integer,
  city text,
  gender text check (gender in ('male', 'female', 'other')),
  seeking_gender text check (seeking_gender in ('male', 'female', 'other')),
  account_type text check (account_type in (
    'entrepreneur', 'self_employed', 'ceo', 'investor',
    'ambitious_woman', 'businesswoman', 'career_woman', 'student', 'family_oriented'
  )),
  relationship_goal text check (relationship_goal in ('serious', 'marriage', 'family', 'open')),
  children_wish text check (children_wish in ('yes', 'no', 'maybe', 'already_have')),
  career_focus text check (career_focus in ('low', 'medium', 'high')),
  family_orientation text check (family_orientation in ('low', 'medium', 'high')),
  relationship_model text check (relationship_model in ('both_career', 'traditional', 'flexible', 'undecided')),
  relocation text check (relocation in ('yes', 'no', 'maybe')),
  travel_frequency text check (travel_frequency in ('rarely', 'monthly', 'frequently')),
  bio text,
  life_in_5_years text,
  looking_for text,
  unique_trait text,
  profile_image_url text,
  gallery_image_urls jsonb default '[]'::jsonb,
  verification_status text default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  is_admin boolean default false,
  is_banned boolean default false,
  plan text default 'basic' check (plan in ('basic', 'premium', 'elite', 'concierge')),
  onboarding_completed boolean default false
);

-- Values table
create table public.values (
  profile_id uuid references public.profiles on delete cascade primary key,
  loyalty integer default 3 check (loyalty between 1 and 5),
  ambition integer default 3 check (ambition between 1 and 5),
  family integer default 3 check (family between 1 and 5),
  freedom integer default 3 check (freedom between 1 and 5),
  security integer default 3 check (security between 1 and 5),
  spirituality integer default 3 check (spirituality between 1 and 5),
  adventure integer default 3 check (adventure between 1 and 5),
  structure integer default 3 check (structure between 1 and 5),
  communication integer default 3 check (communication between 1 and 5),
  status_lifestyle integer default 3 check (status_lifestyle between 1 and 5)
);

-- Business verifications
create table public.business_verifications (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles on delete cascade not null,
  company_name text,
  website text,
  linkedin text,
  registry_link text,
  revenue_range text check (revenue_range in ('under_100k', '100k_500k', '500k_1m', 'over_1m')),
  status text default 'pending' check (status in ('pending', 'verified', 'rejected')),
  admin_notes text,
  created_at timestamptz default now() not null
);

-- Likes
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  from_profile_id uuid references public.profiles on delete cascade not null,
  to_profile_id uuid references public.profiles on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(from_profile_id, to_profile_id)
);

-- Matches
create table public.matches (
  id uuid default uuid_generate_v4() primary key,
  profile_a uuid references public.profiles on delete cascade not null,
  profile_b uuid references public.profiles on delete cascade not null,
  created_at timestamptz default now() not null
);

-- Messages
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  match_id uuid references public.matches on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  body text not null,
  created_at timestamptz default now() not null
);

-- Concierge applications
create table public.concierge_applications (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles on delete cascade not null,
  motivation text,
  budget text,
  expectations text,
  created_at timestamptz default now() not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected'))
);

-- Create profile on signup trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-create match when mutual like
create or replace function public.handle_new_like()
returns trigger as $$
begin
  -- Check if reverse like exists
  if exists (
    select 1 from public.likes
    where from_profile_id = new.to_profile_id
    and to_profile_id = new.from_profile_id
  ) then
    -- Create match if not exists
    if not exists (
      select 1 from public.matches
      where (profile_a = new.from_profile_id and profile_b = new.to_profile_id)
      or (profile_a = new.to_profile_id and profile_b = new.from_profile_id)
    ) then
      insert into public.matches (profile_a, profile_b)
      values (new.from_profile_id, new.to_profile_id);
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_like_created
  after insert on public.likes
  for each row execute procedure public.handle_new_like();

-- Indexes
create index idx_likes_from on public.likes(from_profile_id);
create index idx_likes_to on public.likes(to_profile_id);
create index idx_matches_a on public.matches(profile_a);
create index idx_matches_b on public.matches(profile_b);
create index idx_messages_match on public.messages(match_id);
create index idx_messages_created on public.messages(created_at);
create index idx_profiles_gender on public.profiles(gender);
create index idx_profiles_seeking on public.profiles(seeking_gender);
create index idx_profiles_city on public.profiles(city);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.values enable row level security;
alter table public.business_verifications enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.concierge_applications enable row level security;

-- Profiles policies
create policy "Users can view non-banned profiles" on public.profiles
  for select using (is_banned = false or auth.uid() = id or exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can update any profile" on public.profiles
  for update using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Values policies
create policy "Users can view values" on public.values
  for select using (true);

create policy "Users can insert own values" on public.values
  for insert with check (auth.uid() = profile_id);

create policy "Users can update own values" on public.values
  for update using (auth.uid() = profile_id);

-- Business verifications policies
create policy "Users can view own verification" on public.business_verifications
  for select using (auth.uid() = profile_id or exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "Users can insert own verification" on public.business_verifications
  for insert with check (auth.uid() = profile_id);

create policy "Users can update own verification" on public.business_verifications
  for update using (auth.uid() = profile_id);

create policy "Admins can update any verification" on public.business_verifications
  for update using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Likes policies
create policy "Users can view own likes" on public.likes
  for select using (auth.uid() = from_profile_id or auth.uid() = to_profile_id);

create policy "Users can insert own likes" on public.likes
  for insert with check (auth.uid() = from_profile_id);

-- Matches policies
create policy "Users can view own matches" on public.matches
  for select using (auth.uid() = profile_a or auth.uid() = profile_b);

-- Messages policies
create policy "Match participants can view messages" on public.messages
  for select using (exists (
    select 1 from public.matches
    where id = match_id
    and (profile_a = auth.uid() or profile_b = auth.uid())
  ));

create policy "Match participants can send messages" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.matches
      where id = match_id
      and (profile_a = auth.uid() or profile_b = auth.uid())
    )
  );

-- Concierge policies
create policy "Users can view own applications" on public.concierge_applications
  for select using (auth.uid() = profile_id or exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "Users can insert own applications" on public.concierge_applications
  for insert with check (auth.uid() = profile_id);

create policy "Admins can update applications" on public.concierge_applications
  for update using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Admin select all policy
create policy "Admins can view all likes" on public.likes
  for select using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "Admins can view all matches" on public.matches
  for select using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "Admins can view all messages" on public.messages
  for select using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));
