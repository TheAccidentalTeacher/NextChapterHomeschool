-- ============================================
-- Migration 014: Rehearsal game flag + test fixture name
-- ============================================
-- Realms ship plan v1.5 — Pass 1.
-- Flags a game as a rehearsal (not a real classroom session). Enables the
-- DM "Fast-Forward Epoch" button and the student "Fill & Submit" button,
-- which only appear when is_rehearsal = true. Also ties a game to a named
-- test fixture for deterministic snapshot-diff testing.
-- ============================================

alter table games
  add column if not exists is_rehearsal boolean not null default false,
  add column if not exists test_fixture_name text;

create index if not exists idx_games_rehearsal on games(is_rehearsal) where is_rehearsal = true;

do $$ begin
  raise notice 'Migration 014 applied: rehearsal flag + test fixture name';
end $$;
