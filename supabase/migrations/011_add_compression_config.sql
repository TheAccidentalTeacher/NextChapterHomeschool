-- ============================================
-- Migration 011: Add compression config + schema catch-up
-- ============================================
-- Realms ship plan v1.5 — Pass 1.
-- Adds ClassCiv Realms compression columns to `games` and catches up
-- two columns that were added to Supabase out-of-band (schema drift):
--   teams.draft_order (used by randomize-draft/route.ts)
--   team_members.last_seen_at (used by presence/route.ts + roster/route.ts)
-- Idempotent via IF NOT EXISTS.
-- ============================================

-- Compression config (Realms v2)
alter table games
  add column if not exists total_epochs integer not null default 10 check (total_epochs between 4 and 15),
  add column if not exists current_template text not null default 'STANDARD',
  add column if not exists finale_triggered boolean not null default false;

-- Schema catch-up: columns Scott's shipped code already uses but which were
-- never captured in a migration file. Adding them idempotently here.
alter table teams
  add column if not exists draft_order integer;

create index if not exists idx_teams_draft_order on teams(game_id, draft_order);

alter table team_members
  add column if not exists last_seen_at timestamptz;

create index if not exists idx_members_last_seen on team_members(last_seen_at desc);

-- Notification so the runner knows the migration fired.
do $$ begin
  raise notice 'Migration 011 applied: compression config + schema catch-up (draft_order, last_seen_at)';
end $$;
