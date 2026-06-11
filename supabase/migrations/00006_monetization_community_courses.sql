-- FounderMatch: Monetization, Community & Courses

-- Subscriptions (Stripe-managed)
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  tier text not null check (tier in ('premium', 'elite', 'community', 'community_yearly')),
  status text not null default 'active' check (status in ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now()
);

create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_stripe on public.subscriptions(stripe_subscription_id);
create index idx_subscriptions_status on public.subscriptions(status) where status = 'active';

alter table public.subscriptions enable row level security;

create policy "Users can view own subscriptions" on public.subscriptions
  for select using (auth.uid() = user_id);

create policy "Admins can manage subscriptions" on public.subscriptions
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Purchases (one-time payments)
create table public.purchases (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  product text not null,
  stripe_payment_id text,
  amount integer not null,
  currency text default 'eur',
  status text default 'completed' check (status in ('pending', 'completed', 'refunded', 'failed')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index idx_purchases_user on public.purchases(user_id);

alter table public.purchases enable row level security;

create policy "Users can view own purchases" on public.purchases
  for select using (auth.uid() = user_id);

create policy "Admins can manage purchases" on public.purchases
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Community members
create table public.community_members (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null unique,
  joined_at timestamptz default now() not null,
  tier text default 'member' check (tier in ('member', 'founding', 'vip')),
  status text default 'active' check (status in ('active', 'suspended', 'churned')),
  level integer default 1,
  points integer default 0
);

create index idx_community_members_user on public.community_members(user_id);

alter table public.community_members enable row level security;

create policy "Members can view community" on public.community_members
  for select using (exists (
    select 1 from public.community_members where user_id = auth.uid() and status = 'active'
  ));

create policy "Admins can manage community" on public.community_members
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Community posts
create table public.community_posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.profiles on delete cascade not null,
  body text not null,
  channel text default 'general' check (channel in ('general', 'wins', 'advice', 'accountability', 'introductions')),
  created_at timestamptz default now() not null,
  updated_at timestamptz,
  is_pinned boolean default false,
  is_flagged boolean default false,
  likes_count integer default 0
);

create index idx_posts_channel on public.community_posts(channel);
create index idx_posts_created on public.community_posts(created_at desc);
create index idx_posts_flagged on public.community_posts(is_flagged) where is_flagged = true;

alter table public.community_posts enable row level security;

create policy "Members can view posts" on public.community_posts
  for select using (exists (
    select 1 from public.community_members where user_id = auth.uid() and status = 'active'
  ));

create policy "Members can create posts" on public.community_posts
  for insert with check (
    auth.uid() = author_id and exists (
      select 1 from public.community_members where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Authors can update own posts" on public.community_posts
  for update using (auth.uid() = author_id);

create policy "Admins can manage posts" on public.community_posts
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Community comments
create table public.community_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.community_posts on delete cascade not null,
  author_id uuid references public.profiles on delete cascade not null,
  body text not null,
  created_at timestamptz default now() not null
);

create index idx_comments_post on public.community_comments(post_id);

alter table public.community_comments enable row level security;

create policy "Members can view comments" on public.community_comments
  for select using (exists (
    select 1 from public.community_members where user_id = auth.uid() and status = 'active'
  ));

create policy "Members can create comments" on public.community_comments
  for insert with check (
    auth.uid() = author_id and exists (
      select 1 from public.community_members where user_id = auth.uid() and status = 'active'
    )
  );

create policy "Admins can manage comments" on public.community_comments
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Courses
create table public.courses (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  price integer default 49900,
  is_published boolean default false,
  created_at timestamptz default now() not null
);

alter table public.courses enable row level security;

create policy "Anyone can view published courses" on public.courses
  for select using (is_published = true);

create policy "Admins can manage courses" on public.courses
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Modules
create table public.modules (
  id uuid default uuid_generate_v4() primary key,
  course_id uuid references public.courses on delete cascade not null,
  title text not null,
  description text,
  sort_order integer default 0,
  created_at timestamptz default now() not null
);

create index idx_modules_course on public.modules(course_id, sort_order);

alter table public.modules enable row level security;

create policy "Course viewers can see modules" on public.modules
  for select using (exists (
    select 1 from public.courses where id = course_id and is_published = true
  ));

create policy "Admins can manage modules" on public.modules
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Lessons
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  module_id uuid references public.modules on delete cascade not null,
  title text not null,
  description text,
  video_asset_id text,
  video_playback_id text,
  duration_seconds integer,
  sort_order integer default 0,
  is_free_preview boolean default false,
  created_at timestamptz default now() not null
);

create index idx_lessons_module on public.lessons(module_id, sort_order);

alter table public.lessons enable row level security;

create policy "Purchasers and free previews can view lessons" on public.lessons
  for select using (
    is_free_preview = true
    or exists (
      select 1 from public.purchases where user_id = auth.uid() and product = 'signature_course' and status = 'completed'
    )
    or exists (
      select 1 from public.community_members where user_id = auth.uid() and status = 'active'
    )
    or exists (
      select 1 from public.profiles where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can manage lessons" on public.lessons
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Lesson progress
create table public.lesson_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  lesson_id uuid references public.lessons on delete cascade not null,
  completed_at timestamptz default now() not null,
  unique(user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create policy "Users can manage own progress" on public.lesson_progress
  for all using (auth.uid() = user_id);

-- Live calls
create table public.live_calls (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  starts_at timestamptz not null,
  join_url text,
  recording_asset_id text,
  created_at timestamptz default now() not null
);

alter table public.live_calls enable row level security;

create policy "Community members can view calls" on public.live_calls
  for select using (exists (
    select 1 from public.community_members where user_id = auth.uid() and status = 'active'
  ) or exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "Admins can manage calls" on public.live_calls
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Coaching bookings
create table public.coaching_bookings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  slot timestamptz not null,
  type text default 'session' check (type in ('session', 'package')),
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'canceled')),
  stripe_payment_id text,
  amount integer,
  notes text,
  created_at timestamptz default now() not null
);

create index idx_coaching_user on public.coaching_bookings(user_id);

alter table public.coaching_bookings enable row level security;

create policy "Users can view own bookings" on public.coaching_bookings
  for select using (auth.uid() = user_id);

create policy "Users can insert own bookings" on public.coaching_bookings
  for insert with check (auth.uid() = user_id);

create policy "Admins can manage bookings" on public.coaching_bookings
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Upsell offers (configurable)
create table public.upsell_offers (
  key text primary key,
  title text not null,
  description text,
  price integer not null,
  currency text default 'eur',
  type text check (type in ('subscription', 'one_time', 'application')),
  stripe_price_id text,
  active boolean default true,
  created_at timestamptz default now() not null
);

alter table public.upsell_offers enable row level security;

create policy "Anyone can view active offers" on public.upsell_offers
  for select using (active = true);

create policy "Admins can manage offers" on public.upsell_offers
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Offer events (tracking)
create table public.offer_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  offer_key text references public.upsell_offers(key),
  shown_at timestamptz,
  clicked_at timestamptz,
  purchased_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_offer_events_user on public.offer_events(user_id);

alter table public.offer_events enable row level security;

create policy "Users can insert own offer events" on public.offer_events
  for insert with check (auth.uid() = user_id);

create policy "Users can view own offer events" on public.offer_events
  for select using (auth.uid() = user_id);

create policy "Admins can view all offer events" on public.offer_events
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Email sequences
create table public.email_sequences (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  description text,
  active boolean default true,
  created_at timestamptz default now() not null
);

alter table public.email_sequences enable row level security;

create policy "Admins can manage sequences" on public.email_sequences
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Email jobs
create table public.email_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles on delete cascade not null,
  sequence_id uuid references public.email_sequences on delete set null,
  template text not null,
  subject text not null,
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  status text default 'pending' check (status in ('pending', 'sent', 'failed', 'canceled')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null
);

create index idx_email_jobs_pending on public.email_jobs(scheduled_for) where status = 'pending';
create index idx_email_jobs_user on public.email_jobs(user_id);

alter table public.email_jobs enable row level security;

create policy "Admins can manage email jobs" on public.email_jobs
  for all using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

-- Seed default upsell offers
insert into public.upsell_offers (key, title, description, price, type) values
  ('app_premium', 'FounderMatch Premium', '20 kuratierte Vorschläge/Woche, alle Filter, höhere Sichtbarkeit', 7900, 'subscription'),
  ('app_elite', 'FounderMatch Elite', 'Priorisierte Ausspielung, Profilanalyse, exklusive Mitglieder', 19900, 'subscription'),
  ('community_monthly', 'Inner Circle Community', 'Geschlossene Community für ambitionierte Männer', 4900, 'subscription'),
  ('community_yearly', 'Inner Circle Jahresabo', 'Community + Signature-Kurs inklusive', 49900, 'subscription'),
  ('signature_course', 'Signature-Programm', 'Komplett-Kurs: Profil, Mindset, Strategie', 49900, 'one_time'),
  ('coaching_session', '1:1 Coaching Session', 'Persönliches Coaching mit Experte', 39900, 'one_time'),
  ('coaching_package', '1:1 Coaching Paket (5x)', '5 Sessions persönliches Coaching', 199700, 'one_time'),
  ('profile_dfy', 'Profil Done-For-You', 'Wir optimieren dein Profil professionell', 29000, 'one_time'),
  ('photoshoot', 'Professionelles Fotoshooting', 'Vermittlung an Profi-Fotografen', 49000, 'one_time'),
  ('transformation_bundle', 'Transformation Intensive', 'Premium + Community + Kurs + 3x Coaching', 199700, 'one_time'),
  ('concierge', 'Concierge Matching', 'Persönliches Matchmaking auf höchstem Niveau', 250000, 'application');
