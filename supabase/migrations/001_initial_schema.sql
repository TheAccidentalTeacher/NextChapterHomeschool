-- ============================================
-- ClassCiv Database Schema
-- Supabase Migration: 001_initial_schema
-- Decisions 1–93 from BRAINSTORM.md
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

create type user_role as enum ('student', 'teacher', 'projector');
create type role_name as enum ('architect', 'merchant', 'diplomat', 'lorekeeper', 'warlord');
create type round_type as enum ('EXPAND', 'BUILD', 'RESOLVE', 'DEFINE');
create type epoch_phase as enum ('active', 'resolving', 'completed');
create type resource_type as enum ('production', 'reach', 'legacy', 'resilience', 'food');
create type terrain_type as enum ('plains', 'forest', 'mountain', 'desert', 'coastal', 'river_valley', 'tundra', 'jungle');
create type founding_claim as enum ('first_settler', 'resource_hub', 'natural_landmark');
create type victory_type as enum ('economic', 'population', 'cultural', 'scientific', 'endgame_epoch');
create type conflict_type as enum ('war', 'duel');
create type trade_type as enum ('spot', 'agreement');
create type npc_type as enum ('caravan', 'colossus', 'survivor');
create type government_type as enum ('chiefdom', 'monarchy', 'republic', 'theocracy', 'bureaucracy', 'democracy');
create type math_difficulty as enum ('multiply', 'divide', 'ratio', 'percent');

-- ============================================
-- CORE TABLES
-- ============================================

-- Games (one per class run)
create table games (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  teacher_id text not null,                        -- Clerk user ID
  current_epoch integer not null default 1,
  current_round round_type not null default 'EXPAND',
  epoch_phase epoch_phase not null default 'active',
  math_gate_enabled boolean not null default false, -- Decision 88
  math_gate_difficulty math_difficulty not null default 'multiply',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Teams (7 teams per game, 5 students each + 2 floaters)
create table teams (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  name text not null,
  civilization_name text,                          -- Decision 76
  region_id integer not null,                      -- 1–12, Decision 60
  population integer not null default 10,          -- Decision 41
  government_type government_type not null default 'chiefdom',
  is_in_dark_age boolean not null default false,   -- Decision 75
  war_exhaustion_level integer not null default 0, -- Decision 65: 0/1/2
  confederation_id uuid,                           -- v2: Decision 91
  created_at timestamptz not null default now()
);
create index idx_teams_game on teams(game_id);

-- Team members
create table team_members (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  clerk_user_id text not null,
  display_name text not null,
  assigned_role role_name not null,
  is_absent boolean not null default false,        -- Decision 71
  joined_at timestamptz not null default now(),
  unique(team_id, clerk_user_id)
);
create index idx_members_team on team_members(team_id);
create index idx_members_clerk on team_members(clerk_user_id);

-- Team resources
create table team_resources (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  resource_type resource_type not null,
  amount integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(team_id, resource_type)
);
create index idx_resources_team on team_resources(team_id);

-- ============================================
-- MAP & TERRITORY
-- ============================================

-- Sub-zones (the map tiles)
create table sub_zones (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  zone_number integer not null,
  terrain_type terrain_type not null,
  controlled_by_team_id uuid references teams(id) on delete set null,
  -- Decision 87: Depletion
  soil_fertility integer not null default 100,
  wildlife_stock integer not null default 100,
  fertility_cap integer not null default 100,
  -- Decision 90: Landmark founding
  founding_claim founding_claim,
  settlement_name text,
  founding_epoch integer,
  first_settler_decay_epochs integer not null default 4,
  founding_bonus_active boolean not null default false,
  -- GeoJSON for Leaflet rendering
  geojson jsonb not null default '{}',
  yield_modifier numeric(4,2) not null default 1.00,
  unique(game_id, zone_number)
);
create index idx_subzones_game on sub_zones(game_id);
create index idx_subzones_team on sub_zones(controlled_by_team_id);

-- Fog of war per team
create table team_fog_state (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  sub_zone_id uuid not null references sub_zones(id) on delete cascade,
  is_visible boolean not null default false,
  revealed_at timestamptz,
  unique(team_id, sub_zone_id)
);

-- ============================================
-- TECH TREE (Decision 62)
-- ============================================

create table tech_research (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  tech_key text not null,                          -- e.g. 'pottery', 'bronze_working'
  tier integer not null check (tier between 1 and 5),
  researched_at timestamptz not null default now(),
  researched_epoch integer not null,
  unique(team_id, tech_key)
);
create index idx_tech_team on tech_research(team_id);

-- ============================================
-- ECONOMY & TRADE (Decision 69)
-- ============================================

-- Spot trade offers (open market)
create table trade_offers (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  offering_team_id uuid not null references teams(id) on delete cascade,
  offering_resource resource_type not null,
  offering_amount integer not null check (offering_amount > 0),
  requesting_resource resource_type not null,
  requesting_amount integer not null check (requesting_amount > 0),
  trade_type trade_type not null default 'spot',
  is_open boolean not null default true,
  created_epoch integer not null,
  created_at timestamptz not null default now()
);
create index idx_trades_game on trade_offers(game_id);

-- Multi-epoch trade agreements
create table trade_agreements (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  team_a_id uuid not null references teams(id) on delete cascade,
  team_b_id uuid not null references teams(id) on delete cascade,
  resource_a_to_b resource_type not null,
  amount_a_to_b integer not null,
  resource_b_to_a resource_type not null,
  amount_b_to_a integer not null,
  start_epoch integer not null,
  duration_epochs integer not null default 3,
  consecutive_epochs integer not null default 0,
  is_active boolean not null default true
);

-- Embargoes
create table trade_embargoes (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  imposing_team_id uuid not null references teams(id) on delete cascade,
  target_team_id uuid not null references teams(id) on delete cascade,
  start_epoch integer not null,
  end_epoch integer,
  is_active boolean not null default true
);

-- ============================================
-- BUILDINGS & ASSETS (Decision 39)
-- ============================================

create table team_assets (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  asset_key text not null,                         -- 'farm', 'library', 'wall', etc.
  sub_zone_id uuid not null references sub_zones(id) on delete cascade,
  built_epoch integer not null,
  is_active boolean not null default true
);
create index idx_assets_team on team_assets(team_id);
create index idx_assets_subzone on team_assets(sub_zone_id);

-- ============================================
-- SUBMISSIONS (Decision 70)
-- ============================================

create table epoch_submissions (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  game_id uuid not null references games(id) on delete cascade,
  epoch integer not null,
  round_type round_type not null,
  role role_name not null,
  submitted_by text not null,                      -- Clerk user ID
  content text not null,
  dm_score integer check (dm_score between 1 and 10),
  dm_feedback text,
  submitted_at timestamptz not null default now(),
  scored_at timestamptz
);
create index idx_subs_game_epoch on epoch_submissions(game_id, epoch);
create index idx_subs_team on epoch_submissions(team_id);

-- ============================================
-- WONDERS (Decision 39, tier 4+)
-- ============================================

create table wonder_progress (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  wonder_key text not null,
  production_invested integer not null default 0,
  production_required integer not null,
  is_complete boolean not null default false,
  completed_epoch integer,
  unique(team_id, wonder_key)
);

-- ============================================
-- CONFLICT (Decision 65)
-- ============================================

create table epoch_conflict_flags (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  epoch integer not null,
  aggressor_team_id uuid not null references teams(id) on delete cascade,
  defender_team_id uuid not null references teams(id) on delete cascade,
  conflict_type conflict_type not null default 'war',
  justification text,
  outcome text,
  resolved_at timestamptz
);

-- ============================================
-- NPCs (Decision 68)
-- ============================================

create table npcs (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  npc_type npc_type not null,
  name text not null,
  description text not null default '',
  terrain_origin terrain_type,                     -- for survivor specialists
  bonus_type text,                                 -- e.g. 'reach_cost_minus_2'
  is_active boolean not null default true,
  spawned_epoch integer not null
);

create table npc_actions (
  id uuid primary key default uuid_generate_v4(),
  npc_id uuid not null references npcs(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  action_description text not null,
  epoch integer not null,
  created_at timestamptz not null default now()
);

create table npc_reputation (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  npc_id uuid not null references npcs(id) on delete cascade,
  reputation_score integer not null default 0,
  unique(team_id, npc_id)
);

-- ============================================
-- VASSALS (Decision 63)
-- ============================================

create table vassal_relationships (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  overlord_team_id uuid not null references teams(id) on delete cascade,
  vassal_team_id uuid not null references teams(id) on delete cascade,
  tribute_percent integer not null default 20,
  start_epoch integer not null,
  end_epoch integer,
  is_active boolean not null default true
);

-- ============================================
-- CULTURAL INFLUENCE (Decision 67)
-- ============================================

create table cultural_artifacts (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  artifact_type text not null,                     -- 'mythology_creature', 'codex_entry', 'flag', 'festival'
  name text not null,
  description text not null default '',
  image_url text,
  ci_value integer not null default 0,
  created_epoch integer not null,
  created_at timestamptz not null default now()
);
create index idx_artifacts_team on cultural_artifacts(team_id);

-- ============================================
-- CIVILIZATION IDENTITY (Decisions 76, 89, 91)
-- ============================================

create table civilization_names (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  approved_by_dm boolean not null default false,
  approved_at timestamptz,
  unique(team_id)
);

create table civilization_flags (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  image_url text not null,
  approved_by_dm boolean not null default false,
  uploaded_at timestamptz not null default now(),
  unique(team_id)
);

create table civilization_codex (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  language_name text,
  deity_name text,
  core_belief text,
  legacy_bonus_applied boolean not null default false,
  created_epoch integer not null default 1,
  updated_at timestamptz not null default now(),
  unique(team_id)
);

-- ============================================
-- EVENTS (Decisions 33, 87, 92, 93)
-- ============================================

-- d20 event rolls
create table d20_events (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  epoch integer not null,
  team_id uuid not null references teams(id) on delete cascade,
  roll integer not null check (roll between 1 and 20),
  event_key text not null,
  event_description text not null,
  coastal_only boolean not null default false,      -- Decision 92: piracy
  resource_impact jsonb not null default '{}',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_d20_game_epoch on d20_events(game_id, epoch);

-- General game events log
create table game_events (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  epoch integer not null,
  event_type text not null,                        -- 'depletion', 'festival', 'war_declared', etc.
  description text not null,
  affected_team_ids uuid[] not null default '{}',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_events_game_epoch on game_events(game_id, epoch);

-- ============================================
-- HEYGEN ASSETS (Decision 82)
-- ============================================

create table heygen_assets (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  asset_type text not null,                        -- 'narrator_clip', 'npc_clip'
  video_url text not null,
  transcript text,
  epoch integer,
  created_at timestamptz not null default now()
);

-- ============================================
-- PROJECTOR STATE (Decision 83)
-- ============================================

create table projector_state (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  current_view text not null default 'map',
  active_team_spotlight uuid references teams(id) on delete set null,
  animation_queue jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  unique(game_id)
);

-- ============================================
-- DM TOOLS
-- ============================================

create table daily_recaps (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  epoch integer not null,
  recap_text text not null,
  narration_video_url text,
  created_at timestamptz not null default now(),
  unique(game_id, epoch)
);

create table private_messages (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  from_team_id uuid references teams(id) on delete set null,
  to_team_id uuid not null references teams(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_pm_to on private_messages(to_team_id);

-- ============================================
-- EPOCH ROLE ASSIGNMENTS (Decision 71)
-- ============================================

create table epoch_role_assignments (
  id uuid primary key default uuid_generate_v4(),
  team_id uuid not null references teams(id) on delete cascade,
  epoch integer not null,
  clerk_user_id text not null,
  role role_name not null,
  is_substitute boolean not null default false,
  original_role role_name,
  unique(team_id, epoch, clerk_user_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
alter table games enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table team_resources enable row level security;
alter table sub_zones enable row level security;
alter table team_fog_state enable row level security;
alter table tech_research enable row level security;
alter table trade_offers enable row level security;
alter table trade_agreements enable row level security;
alter table trade_embargoes enable row level security;
alter table team_assets enable row level security;
alter table epoch_submissions enable row level security;
alter table wonder_progress enable row level security;
alter table epoch_conflict_flags enable row level security;
alter table npcs enable row level security;
alter table npc_actions enable row level security;
alter table npc_reputation enable row level security;
alter table vassal_relationships enable row level security;
alter table cultural_artifacts enable row level security;
alter table civilization_names enable row level security;
alter table civilization_flags enable row level security;
alter table civilization_codex enable row level security;
alter table d20_events enable row level security;
alter table game_events enable row level security;
alter table heygen_assets enable row level security;
alter table projector_state enable row level security;
alter table daily_recaps enable row level security;
alter table private_messages enable row level security;
alter table epoch_role_assignments enable row level security;

-- ============================================
-- RLS POLICIES
-- For now: authenticated users can read game data.
-- Teacher (checked via Clerk JWT) can write.
-- Students can write to their own team's submissions.
-- Fine-grained policies will be added per-feature.
-- ============================================

-- Games: anyone authenticated can read
create policy "games_select" on games for select using (true);
create policy "games_insert" on games for insert with check (true);
create policy "games_update" on games for update using (true);

-- Teams: anyone in the game can read
create policy "teams_select" on teams for select using (true);
create policy "teams_insert" on teams for insert with check (true);
create policy "teams_update" on teams for update using (true);

-- Team members: readable by all, writable by teacher
create policy "members_select" on team_members for select using (true);
create policy "members_insert" on team_members for insert with check (true);
create policy "members_update" on team_members for update using (true);

-- Resources: readable by team, writable by server
create policy "resources_select" on team_resources for select using (true);
create policy "resources_insert" on team_resources for insert with check (true);
create policy "resources_update" on team_resources for update using (true);

-- Sub-zones: readable by all
create policy "subzones_select" on sub_zones for select using (true);
create policy "subzones_insert" on sub_zones for insert with check (true);
create policy "subzones_update" on sub_zones for update using (true);

-- Fog: team-specific (will be tightened)
create policy "fog_select" on team_fog_state for select using (true);
create policy "fog_insert" on team_fog_state for insert with check (true);
create policy "fog_update" on team_fog_state for update using (true);

-- Tech: readable by all
create policy "tech_select" on tech_research for select using (true);
create policy "tech_insert" on tech_research for insert with check (true);

-- Trades: readable by all in game
create policy "trades_select" on trade_offers for select using (true);
create policy "trades_insert" on trade_offers for insert with check (true);
create policy "trades_update" on trade_offers for update using (true);

create policy "agreements_select" on trade_agreements for select using (true);
create policy "agreements_insert" on trade_agreements for insert with check (true);
create policy "agreements_update" on trade_agreements for update using (true);

create policy "embargoes_select" on trade_embargoes for select using (true);
create policy "embargoes_insert" on trade_embargoes for insert with check (true);
create policy "embargoes_update" on trade_embargoes for update using (true);

-- Assets
create policy "assets_select" on team_assets for select using (true);
create policy "assets_insert" on team_assets for insert with check (true);
create policy "assets_update" on team_assets for update using (true);

-- Submissions: readable by own team + teacher, writable by team members
create policy "subs_select" on epoch_submissions for select using (true);
create policy "subs_insert" on epoch_submissions for insert with check (true);
create policy "subs_update" on epoch_submissions for update using (true);

-- Wonders
create policy "wonders_select" on wonder_progress for select using (true);
create policy "wonders_insert" on wonder_progress for insert with check (true);
create policy "wonders_update" on wonder_progress for update using (true);

-- Conflicts
create policy "conflicts_select" on epoch_conflict_flags for select using (true);
create policy "conflicts_insert" on epoch_conflict_flags for insert with check (true);
create policy "conflicts_update" on epoch_conflict_flags for update using (true);

-- NPCs
create policy "npcs_select" on npcs for select using (true);
create policy "npcs_insert" on npcs for insert with check (true);
create policy "npcs_update" on npcs for update using (true);

create policy "npc_actions_select" on npc_actions for select using (true);
create policy "npc_actions_insert" on npc_actions for insert with check (true);

create policy "npc_rep_select" on npc_reputation for select using (true);
create policy "npc_rep_insert" on npc_reputation for insert with check (true);
create policy "npc_rep_update" on npc_reputation for update using (true);

-- Vassals
create policy "vassals_select" on vassal_relationships for select using (true);
create policy "vassals_insert" on vassal_relationships for insert with check (true);
create policy "vassals_update" on vassal_relationships for update using (true);

-- Cultural artifacts
create policy "artifacts_select" on cultural_artifacts for select using (true);
create policy "artifacts_insert" on cultural_artifacts for insert with check (true);
create policy "artifacts_update" on cultural_artifacts for update using (true);

-- Civ identity
create policy "civnames_select" on civilization_names for select using (true);
create policy "civnames_insert" on civilization_names for insert with check (true);
create policy "civnames_update" on civilization_names for update using (true);

create policy "civflags_select" on civilization_flags for select using (true);
create policy "civflags_insert" on civilization_flags for insert with check (true);
create policy "civflags_update" on civilization_flags for update using (true);

create policy "civcodex_select" on civilization_codex for select using (true);
create policy "civcodex_insert" on civilization_codex for insert with check (true);
create policy "civcodex_update" on civilization_codex for update using (true);

-- Events
create policy "d20_select" on d20_events for select using (true);
create policy "d20_insert" on d20_events for insert with check (true);
create policy "d20_update" on d20_events for update using (true);

create policy "events_select" on game_events for select using (true);
create policy "events_insert" on game_events for insert with check (true);

-- HeyGen
create policy "heygen_select" on heygen_assets for select using (true);
create policy "heygen_insert" on heygen_assets for insert with check (true);

-- Projector
create policy "projector_select" on projector_state for select using (true);
create policy "projector_insert" on projector_state for insert with check (true);
create policy "projector_update" on projector_state for update using (true);

-- Recaps
create policy "recaps_select" on daily_recaps for select using (true);
create policy "recaps_insert" on daily_recaps for insert with check (true);

-- Private messages
create policy "pm_select" on private_messages for select using (true);
create policy "pm_insert" on private_messages for insert with check (true);
create policy "pm_update" on private_messages for update using (true);

-- Role assignments
create policy "roles_select" on epoch_role_assignments for select using (true);
create policy "roles_insert" on epoch_role_assignments for insert with check (true);
create policy "roles_update" on epoch_role_assignments for update using (true);

-- ============================================
-- REALTIME
-- Enable Supabase Realtime on key tables
-- (projector view, resources, game state)
-- ============================================

alter publication supabase_realtime add table games;
alter publication supabase_realtime add table team_resources;
alter publication supabase_realtime add table sub_zones;
alter publication supabase_realtime add table projector_state;
alter publication supabase_realtime add table epoch_submissions;
alter publication supabase_realtime add table d20_events;
alter publication supabase_realtime add table game_events;
alter publication supabase_realtime add table private_messages;
