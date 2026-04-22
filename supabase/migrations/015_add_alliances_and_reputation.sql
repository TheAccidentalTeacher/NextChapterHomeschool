-- ============================================
-- Migration 015: Alliances, reputation, adjacency, casus belli, vassal duration
-- ============================================
-- Realms ship plan v1.5 — Pass 1 (large migration; the core Realms diplomacy
-- substrate). Implements:
--   - alliances table (proposal/acceptance/break lifecycle)
--   - teams.reputation_score + teams.aggression_score
--   - casus_belli_grants child table (F6 fix — multiple outstanding grants)
--   - team_members.isolated_start flag (Madagascar compensation)
--   - sub_zone_adjacencies table (geographer finding — adjacency graph)
--   - games.adjacency_strict gate (F18)
--   - games.target_civ_count column reserved for v1.4-post-hard-live NPC work
--   - vassal_relationships duration minimum (F11 fix)
--   - victory_type enum extended with 'domination'
-- Idempotent via IF NOT EXISTS / DO block guards where appropriate.
-- ============================================

-- --------------------------------------------
-- Alliance system (§4.5 consequences matrix)
-- --------------------------------------------

create table if not exists alliances (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  proposer_team_id uuid not null references teams(id) on delete cascade,
  target_team_id uuid not null references teams(id) on delete cascade,
  status text not null check (status in ('pending','active','broken','rejected','expired')),
  treaty_text text not null,
  proposed_epoch integer not null,
  accepted_epoch integer,
  broken_epoch integer,
  rejected_epoch integer,
  proposed_at timestamptz not null default now(),
  accepted_at timestamptz,
  broken_at timestamptz,
  rejected_at timestamptz,
  check (proposer_team_id <> target_team_id)
);

create index if not exists idx_alliances_game_status on alliances(game_id, status);
create index if not exists idx_alliances_proposer_active on alliances(proposer_team_id) where status = 'active';
create index if not exists idx_alliances_target_active on alliances(target_team_id) where status = 'active';

alter table alliances enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'alliances' and policyname = 'alliances_select') then
    create policy "alliances_select" on alliances for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'alliances' and policyname = 'alliances_insert') then
    create policy "alliances_insert" on alliances for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'alliances' and policyname = 'alliances_update') then
    create policy "alliances_update" on alliances for update using (true);
  end if;
end $$;

-- --------------------------------------------
-- Reputation + aggression scores (B7, E4)
-- --------------------------------------------

alter table teams
  add column if not exists reputation_score integer not null default 0,
  add column if not exists aggression_score integer not null default 0;

-- --------------------------------------------
-- Casus belli grants (F6 fix — child table, supports multiple outstanding grants)
-- --------------------------------------------

create table if not exists casus_belli_grants (
  id uuid primary key default uuid_generate_v4(),
  holder_team_id uuid not null references teams(id) on delete cascade,
  grantor_team_id uuid not null references teams(id) on delete cascade,
  granted_epoch integer not null,
  expires_epoch integer not null,
  consumed boolean not null default false,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (holder_team_id <> grantor_team_id)
);

create index if not exists idx_casus_belli_holder_unconsumed
  on casus_belli_grants(holder_team_id) where consumed = false;

alter table casus_belli_grants enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'casus_belli_grants' and policyname = 'casus_belli_select') then
    create policy "casus_belli_select" on casus_belli_grants for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'casus_belli_grants' and policyname = 'casus_belli_insert') then
    create policy "casus_belli_insert" on casus_belli_grants for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'casus_belli_grants' and policyname = 'casus_belli_update') then
    create policy "casus_belli_update" on casus_belli_grants for update using (true);
  end if;
end $$;

-- --------------------------------------------
-- Isolated-start compensation (Madagascar problem)
-- --------------------------------------------

alter table team_members
  add column if not exists isolated_start boolean not null default false;

-- --------------------------------------------
-- Sub-zone adjacency graph (§6.1)
-- --------------------------------------------

create table if not exists sub_zone_adjacencies (
  sub_zone_a_id uuid not null references sub_zones(id) on delete cascade,
  sub_zone_b_id uuid not null references sub_zones(id) on delete cascade,
  edge_type text not null check (edge_type in ('land','coastal','naval_required','impassable')),
  primary key (sub_zone_a_id, sub_zone_b_id),
  check (sub_zone_a_id <> sub_zone_b_id)
);

alter table sub_zone_adjacencies enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'sub_zone_adjacencies' and policyname = 'adjacency_select') then
    create policy "adjacency_select" on sub_zone_adjacencies for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'sub_zone_adjacencies' and policyname = 'adjacency_insert') then
    create policy "adjacency_insert" on sub_zone_adjacencies for insert with check (true);
  end if;
end $$;

-- Gate on games: strict adjacency enforcement (must be true for Thu Apr 23 hard-live per F18)
alter table games
  add column if not exists adjacency_strict boolean not null default false;

-- --------------------------------------------
-- NPC scaffolding reservation (v1.4-post-hard-live; column present but unused)
-- Keeping the target_civ_count column so future games can seed it. Range
-- enforced here matches §4.7.2 (10–25).
-- --------------------------------------------

alter table games
  add column if not exists target_civ_count integer check (target_civ_count between 10 and 25);

-- --------------------------------------------
-- Vassal duration minimum (F11 fix)
-- vassal_relationships.end_epoch: if set, must be at least start_epoch + 3
-- to prevent 0-duration vassalage exploits.
-- --------------------------------------------

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'vassal_duration_minimum'
      and conrelid = 'vassal_relationships'::regclass
  ) then
    alter table vassal_relationships
      add constraint vassal_duration_minimum
      check (end_epoch is null or end_epoch >= start_epoch + 3);
  end if;
end $$;

-- --------------------------------------------
-- Domination victory type (§4.5 + B8)
-- --------------------------------------------

do $$ begin
  if not exists (
    select 1 from pg_enum
    where enumlabel = 'domination'
      and enumtypid = (select oid from pg_type where typname = 'victory_type')
  ) then
    alter type victory_type add value 'domination';
  end if;
end $$;

-- --------------------------------------------
-- Final notice
-- --------------------------------------------

do $$ begin
  raise notice 'Migration 015 applied: alliances, casus_belli_grants, reputation/aggression, sub_zone_adjacencies, adjacency_strict, target_civ_count, vassal duration minimum, domination victory type';
end $$;
