-- Synthsynd World — Supabase schema.
-- Curated listings ship in the app bundle (src/lib/catalog.ts). Postgres holds
-- community data: published listings, reviews, events, per-item metrics,
-- match missions, and per-account stacks.
-- Apply with: node scripts/apply-schema.mjs  (uses the direct connection string)

create table if not exists published_items (
  slug text primary key,
  name text not null,
  tagline text not null,
  category text not null check (category in ('agent','tool','prompt','skill')),
  runtime text,
  author_name text not null,
  author_role text not null default 'Community builder',
  author_hue integer not null default 190,
  tags jsonb not null default '[]'::jsonb,
  body text not null,
  prompt text not null default '',
  input_schema jsonb not null default '[]'::jsonb,
  preview_out text not null default '',
  version text not null default '0.1.0',
  updated text not null,
  created text not null,
  installs integer not null default 0,
  views integer not null default 0,
  runs integer not null default 0,
  featured integer not null default 0
);

create table if not exists reviews (
  id bigint generated always as identity primary key,
  item_slug text not null,
  author text not null,
  rating integer not null check (rating between 1 and 5),
  text text not null check (length(text) between 5 and 600),
  created text not null
);
create index if not exists idx_reviews_slug on reviews(item_slug);

create table if not exists events (
  id bigint generated always as identity primary key,
  type text not null check (type in ('install','review','publish')),
  item_slug text not null,
  meta text,
  created text not null
);

create table if not exists matches (
  id bigint generated always as identity primary key,
  query text not null,
  budget integer not null,
  priority text not null,
  winner_slug text,
  score real not null default 0,
  created text not null
);

create table if not exists metrics (
  slug text primary key,
  installs integer not null default 0,
  views integer not null default 0,
  runs integer not null default 0
);

create table if not exists stacks (
  id text not null,
  owner uuid not null references auth.users(id) on delete cascade,
  name text not null,
  query text not null default '',
  budget integer not null default 150,
  priority text not null default 'custom',
  steps jsonb not null default '[]'::jsonb,
  totals jsonb not null default '{}'::jsonb,
  created timestamptz not null default now(),
  updated timestamptz not null default now(),
  primary key (owner, id)
);

-- ── row-level security ──────────────────────────────────────────────────────
alter table published_items enable row level security;
alter table reviews enable row level security;
alter table events enable row level security;
alter table matches enable row level security;
alter table metrics enable row level security;
alter table stacks enable row level security;

drop policy if exists "published read" on published_items;
create policy "published read" on published_items for select using (true);
drop policy if exists "published authed insert" on published_items;
create policy "published authed insert" on published_items for insert
  with check (auth.role() = 'authenticated');

drop policy if exists "reviews read" on reviews;
create policy "reviews read" on reviews for select using (true);
drop policy if exists "reviews authed insert" on reviews;
create policy "reviews authed insert" on reviews for insert
  with check (auth.role() = 'authenticated' and rating between 1 and 5 and length(text) between 5 and 600);

drop policy if exists "events read" on events;
create policy "events read" on events for select using (true);
drop policy if exists "events insert" on events;
create policy "events insert" on events for insert with check (true);

drop policy if exists "matches read" on matches;
create policy "matches read" on matches for select using (true);
drop policy if exists "matches insert" on matches;
create policy "matches insert" on matches for insert with check (true);

drop policy if exists "metrics read" on metrics;
create policy "metrics read" on metrics for select using (true);

drop policy if exists "stacks owner" on stacks;
create policy "stacks owner" on stacks for all
  using (auth.uid() = owner) with check (auth.uid() = owner);

-- Counters are only changed through this function so no caller can edit rows
-- directly (metrics has no insert/update/delete policies).
create or replace function bump_metric(p_slug text, p_field text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into metrics (slug, installs, views, runs) values (p_slug, 0, 0, 0)
  on conflict (slug) do nothing;
  if p_field = 'installs' then
    update metrics set installs = installs + 1 where slug = p_slug;
  elsif p_field = 'views' then
    update metrics set views = views + 1 where slug = p_slug;
  elsif p_field = 'runs' then
    update metrics set runs = runs + 1 where slug = p_slug;
  end if;
end;
$$;

revoke all on function bump_metric(text, text) from public;
grant execute on function bump_metric(text, text) to anon, authenticated;
