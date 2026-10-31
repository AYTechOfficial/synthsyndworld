-- Synthsynd World — one-shot database setup.
-- Paste the whole file into Supabase → SQL editor and run it once.
-- It is safe to re-run; every step is idempotent.

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

-- ── catalog seed (idempotent) ─────────────────────────────────────────────

insert into metrics (slug, installs, views, runs) values
('promptforge', 4821, 38210, 9210),
('degen-dd', 3610, 24100, 6620),
('deep-research', 2944, 19870, 4120),
('code-review-copilot', 4106, 31550, 7380),
('spec-whisperer', 1877, 12040, 2210),
('support-triage', 1542, 9860, 3050),
('sql-sensei', 1320, 8450, 1980),
('synth-muse', 990, 6120, 1440),
('json2schema', 3280, 21030, 5120),
('prompt-cost', 1655, 10440, 2890),
('template-foundry', 2105, 13110, 4470),
('markdown-grid', 1780, 11220, 3560),
('regex-lab', 1420, 9340, 2680),
('text-xray', 1210, 7880, 2040),
('socratic-tutor', 2980, 17440, 0),
('ruthless-editor', 2410, 15890, 0),
('red-team', 1985, 12030, 0),
('solana-explainer', 1720, 10890, 0),
('cold-outreach', 1490, 9210, 0),
('git-daily', 1890, 11330, 0),
('api-debug', 1425, 8790, 0),
('web-research-protocol', 1601, 9940, 0),
('prompt-curriculum', 2210, 14020, 0),
('chart-chooser', 1330, 8110, 0),
('escalation-writer', 980, 6120, 0),
('hook-lab', 1240, 7340, 0),
('narrative-smith', 1120, 6890, 0),
('migration-planner', 860, 5210, 0)
on conflict (slug) do update set
  installs = greatest(metrics.installs, excluded.installs),
  views = greatest(metrics.views, excluded.views),
  runs = greatest(metrics.runs, excluded.runs);

-- Reviews are seeded once per listing that has none.
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('promptforge', 'synth_core', 4, 'Not flashy, just useful. The install counter doesn''t lie.', '2026-10-16'),
('promptforge', 'kaito_dev', 5, 'Tested on three real projects before leaving this — it holds up.', '2026-10-09'),
('promptforge', 'byteBard', 5, 'Started using it to onboard new teammates — huge time saver.', '2026-10-01'),
('promptforge', 'gridlock', 4, 'A bit opinionated in the best way — it has a point of view.', '2026-09-24')) as v
where not exists (select 1 from reviews where item_slug = 'promptforge');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('degen-dd', 'saturn_sol', 4, 'Took me ten minutes to wire up. Would recommend to juniors too.', '2026-10-09'),
('degen-dd', 'lunarPunk', 5, 'The structure fixed a problem I didn''t know I had.', '2026-10-01'),
('degen-dd', 'pixelprophet', 3, 'Good starting point, but the examples could go deeper.', '2026-09-24')) as v
where not exists (select 1 from reviews where item_slug = 'degen-dd');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('deep-research', 'pixelprophet', 5, 'Finally something in this category that isn''t just a wrapper around hype.', '2026-10-22'),
('deep-research', 'synth_core', 4, 'Not flashy, just useful. The install counter doesn''t lie.', '2026-10-16'),
('deep-research', 'kaito_dev', 5, 'Tested on three real projects before leaving this — it holds up.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'deep-research');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('code-review-copilot', 'void_arch', 5, 'The prompt itself is worth reading even if you never run it.', '2026-10-01'),
('code-review-copilot', 'n0va', 5, 'Usable immediately. No 30-minute setup video required.', '2026-09-24'),
('code-review-copilot', 'ami.exe', 5, 'This is the cleanest implementation of this idea I''ve tried.', '2026-09-15'),
('code-review-copilot', '0xAudit', 5, 'Finally something in this category that isn''t just a wrapper around hype.', '2026-10-22')) as v
where not exists (select 1 from reviews where item_slug = 'code-review-copilot');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('spec-whisperer', 'synth_core', 5, 'This is the cleanest implementation of this idea I''ve tried.', '2026-09-15'),
('spec-whisperer', 'kaito_dev', 5, 'Finally something in this category that isn''t just a wrapper around hype.', '2026-10-22'),
('spec-whisperer', 'byteBard', 4, 'Not flashy, just useful. The install counter doesn''t lie.', '2026-10-16'),
('spec-whisperer', 'gridlock', 5, 'Tested on three real projects before leaving this — it holds up.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'spec-whisperer');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('support-triage', 'mintmaxi', 5, 'Bookmarking this. It''s going in the team playbook.', '2026-10-22'),
('support-triage', 'void_arch', 4, 'Solid fundamentals. Would love an option to save presets.', '2026-10-16'),
('support-triage', 'n0va', 4, 'Works as described. No magic, just good structure.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'support-triage');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('sql-sensei', 'gridlock', 5, 'Tested on three real projects before leaving this — it holds up.', '2026-10-09'),
('sql-sensei', 'rustic', 5, 'Started using it to onboard new teammates — huge time saver.', '2026-10-01'),
('sql-sensei', 'mintmaxi', 4, 'A bit opinionated in the best way — it has a point of view.', '2026-09-24')) as v
where not exists (select 1 from reviews where item_slug = 'sql-sensei');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('synth-muse', 'ami.exe', 4, 'Not flashy, just useful. The install counter doesn''t lie.', '2026-10-16'),
('synth-muse', '0xAudit', 5, 'Tested on three real projects before leaving this — it holds up.', '2026-10-09'),
('synth-muse', '0xLumen', 5, 'Started using it to onboard new teammates — huge time saver.', '2026-10-01'),
('synth-muse', 'saturn_sol', 4, 'A bit opinionated in the best way — it has a point of view.', '2026-09-24')) as v
where not exists (select 1 from reviews where item_slug = 'synth-muse');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('json2schema', 'byteBard', 4, 'Not flashy, just useful. The install counter doesn''t lie.', '2026-10-16'),
('json2schema', 'gridlock', 5, 'Tested on three real projects before leaving this — it holds up.', '2026-10-09'),
('json2schema', 'rustic', 5, 'Started using it to onboard new teammates — huge time saver.', '2026-10-01'),
('json2schema', 'mintmaxi', 4, 'A bit opinionated in the best way — it has a point of view.', '2026-09-24')) as v
where not exists (select 1 from reviews where item_slug = 'json2schema');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('prompt-cost', 'pixelprophet', 5, 'Usable immediately. No 30-minute setup video required.', '2026-09-24'),
('prompt-cost', 'synth_core', 5, 'This is the cleanest implementation of this idea I''ve tried.', '2026-09-15'),
('prompt-cost', 'kaito_dev', 5, 'Finally something in this category that isn''t just a wrapper around hype.', '2026-10-22')) as v
where not exists (select 1 from reviews where item_slug = 'prompt-cost');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('template-foundry', 'saturn_sol', 4, 'Took me ten minutes to wire up. Would recommend to juniors too.', '2026-10-09'),
('template-foundry', 'lunarPunk', 5, 'The structure fixed a problem I didn''t know I had.', '2026-10-01'),
('template-foundry', 'pixelprophet', 3, 'Good starting point, but the examples could go deeper.', '2026-09-24')) as v
where not exists (select 1 from reviews where item_slug = 'template-foundry');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('markdown-grid', 'n0va', 5, 'Finally something in this category that isn''t just a wrapper around hype.', '2026-10-22'),
('markdown-grid', 'ami.exe', 4, 'Not flashy, just useful. The install counter doesn''t lie.', '2026-10-16'),
('markdown-grid', '0xAudit', 5, 'Tested on three real projects before leaving this — it holds up.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'markdown-grid');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('regex-lab', 'rustic', 5, 'The prompt itself is worth reading even if you never run it.', '2026-10-01'),
('regex-lab', 'mintmaxi', 5, 'Usable immediately. No 30-minute setup video required.', '2026-09-24'),
('regex-lab', 'void_arch', 5, 'This is the cleanest implementation of this idea I''ve tried.', '2026-09-15'),
('regex-lab', 'n0va', 5, 'Finally something in this category that isn''t just a wrapper around hype.', '2026-10-22')) as v
where not exists (select 1 from reviews where item_slug = 'regex-lab');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('text-xray', 'saturn_sol', 3, 'Decent, but watch the edge cases in the examples.', '2026-09-24'),
('text-xray', 'lunarPunk', 4, 'Great skeleton. I extended it with our own house style.', '2026-09-15'),
('text-xray', 'pixelprophet', 5, 'Dropped this into my workflow and it stuck. The output format is exactly what I needed.', '2026-10-22')) as v
where not exists (select 1 from reviews where item_slug = 'text-xray');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('socratic-tutor', 'rustic', 4, 'Great skeleton. I extended it with our own house style.', '2026-09-15'),
('socratic-tutor', 'mintmaxi', 5, 'Dropped this into my workflow and it stuck. The output format is exactly what I needed.', '2026-10-22'),
('socratic-tutor', 'void_arch', 5, 'Replaced a whole folder of half-baked prompts I was hoarding.', '2026-10-16'),
('socratic-tutor', 'n0va', 4, 'Took me ten minutes to wire up. Would recommend to juniors too.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'socratic-tutor');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('ruthless-editor', 'mintmaxi', 5, 'Bookmarking this. It''s going in the team playbook.', '2026-10-22'),
('ruthless-editor', 'void_arch', 4, 'Solid fundamentals. Would love an option to save presets.', '2026-10-16'),
('ruthless-editor', 'n0va', 4, 'Works as described. No magic, just good structure.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'ruthless-editor');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('red-team', 'byteBard', 4, 'Great skeleton. I extended it with our own house style.', '2026-09-15'),
('red-team', 'gridlock', 5, 'Dropped this into my workflow and it stuck. The output format is exactly what I needed.', '2026-10-22'),
('red-team', 'rustic', 5, 'Replaced a whole folder of half-baked prompts I was hoarding.', '2026-10-16'),
('red-team', 'mintmaxi', 4, 'Took me ten minutes to wire up. Would recommend to juniors too.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'red-team');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('solana-explainer', 'rustic', 4, 'The output is 90% there; the last 10% still needs a human, which is fine.', '2026-09-15'),
('solana-explainer', 'mintmaxi', 5, 'Bookmarking this. It''s going in the team playbook.', '2026-10-22'),
('solana-explainer', 'void_arch', 4, 'Solid fundamentals. Would love an option to save presets.', '2026-10-16'),
('solana-explainer', 'n0va', 4, 'Works as described. No magic, just good structure.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'solana-explainer');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('cold-outreach', 'kaito_dev', 4, 'Took me ten minutes to wire up. Would recommend to juniors too.', '2026-10-09'),
('cold-outreach', 'byteBard', 5, 'The structure fixed a problem I didn''t know I had.', '2026-10-01'),
('cold-outreach', 'gridlock', 3, 'Good starting point, but the examples could go deeper.', '2026-09-24')) as v
where not exists (select 1 from reviews where item_slug = 'cold-outreach');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('git-daily', 'kaito_dev', 4, 'Runs fast and the docs are honest about limitations. Respect.', '2026-10-22'),
('git-daily', 'byteBard', 5, 'Simple, composable, and easy to fork. Exactly what I wanted.', '2026-10-16'),
('git-daily', 'gridlock', 5, 'I''ve seen paid tools do less than this free one.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'git-daily');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('api-debug', 'kaito_dev', 4, 'Works as described. No magic, just good structure.', '2026-10-09'),
('api-debug', 'byteBard', 5, 'The prompt itself is worth reading even if you never run it.', '2026-10-01'),
('api-debug', 'gridlock', 5, 'Usable immediately. No 30-minute setup video required.', '2026-09-24')) as v
where not exists (select 1 from reviews where item_slug = 'api-debug');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('web-research-protocol', 'synth_core', 5, 'Started using it to onboard new teammates — huge time saver.', '2026-10-01'),
('web-research-protocol', 'kaito_dev', 4, 'A bit opinionated in the best way — it has a point of view.', '2026-09-24'),
('web-research-protocol', 'byteBard', 4, 'My only complaint: I want more entries from this author.', '2026-09-15'),
('web-research-protocol', 'gridlock', 4, 'Runs fast and the docs are honest about limitations. Respect.', '2026-10-22')) as v
where not exists (select 1 from reviews where item_slug = 'web-research-protocol');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('prompt-curriculum', 'kaito_dev', 5, 'Finally something in this category that isn''t just a wrapper around hype.', '2026-10-22'),
('prompt-curriculum', 'byteBard', 4, 'Not flashy, just useful. The install counter doesn''t lie.', '2026-10-16'),
('prompt-curriculum', 'gridlock', 5, 'Tested on three real projects before leaving this — it holds up.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'prompt-curriculum');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('chart-chooser', 'mintmaxi', 5, 'Finally something in this category that isn''t just a wrapper around hype.', '2026-10-22'),
('chart-chooser', 'void_arch', 4, 'Not flashy, just useful. The install counter doesn''t lie.', '2026-10-16'),
('chart-chooser', 'n0va', 5, 'Tested on three real projects before leaving this — it holds up.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'chart-chooser');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('escalation-writer', 'lunarPunk', 5, 'Does one thing well. That''s rare here.', '2026-10-01'),
('escalation-writer', 'pixelprophet', 3, 'Decent, but watch the edge cases in the examples.', '2026-09-24'),
('escalation-writer', 'synth_core', 4, 'Great skeleton. I extended it with our own house style.', '2026-09-15'),
('escalation-writer', 'kaito_dev', 5, 'Dropped this into my workflow and it stuck. The output format is exactly what I needed.', '2026-10-22')) as v
where not exists (select 1 from reviews where item_slug = 'escalation-writer');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('hook-lab', '0xLumen', 4, 'The output is 90% there; the last 10% still needs a human, which is fine.', '2026-09-15'),
('hook-lab', 'saturn_sol', 5, 'Bookmarking this. It''s going in the team playbook.', '2026-10-22'),
('hook-lab', 'lunarPunk', 4, 'Solid fundamentals. Would love an option to save presets.', '2026-10-16'),
('hook-lab', 'pixelprophet', 4, 'Works as described. No magic, just good structure.', '2026-10-09')) as v
where not exists (select 1 from reviews where item_slug = 'hook-lab');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('narrative-smith', 'mintmaxi', 4, 'Works as described. No magic, just good structure.', '2026-10-09'),
('narrative-smith', 'void_arch', 5, 'The prompt itself is worth reading even if you never run it.', '2026-10-01'),
('narrative-smith', 'n0va', 5, 'Usable immediately. No 30-minute setup video required.', '2026-09-24')) as v
where not exists (select 1 from reviews where item_slug = 'narrative-smith');
insert into reviews (item_slug, author, rating, text, created)
select * from (values
('migration-planner', 'rustic', 4, 'Not flashy, just useful. The install counter doesn''t lie.', '2026-10-16'),
('migration-planner', 'mintmaxi', 5, 'Tested on three real projects before leaving this — it holds up.', '2026-10-09'),
('migration-planner', 'void_arch', 5, 'Started using it to onboard new teammates — huge time saver.', '2026-10-01'),
('migration-planner', 'n0va', 4, 'A bit opinionated in the best way — it has a point of view.', '2026-09-24')) as v
where not exists (select 1 from reviews where item_slug = 'migration-planner');

insert into events (type, item_slug, meta, created)
select * from (values
('publish', 'promptforge', 'synth_core', '2026-10-24'),
('install', 'json2schema', 'gridlock', '2026-10-25'),
('review', 'deep-research', 'lunarPunk', '2026-10-25'),
('publish', 'git-daily', 'kaito_dev', '2026-10-26'),
('install', 'socratic-tutor', 'pixelprophet', '2026-10-26'),
('install', 'code-review-copilot', 'ami.exe', '2026-10-27'),
('review', 'text-xray', 'byteBard', '2026-10-27'),
('publish', 'synth-muse', 'void_arch', '2026-10-28')) as v
where not exists (select 1 from events limit 1);

