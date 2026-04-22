-- ============================================
-- Migration 012: Add game_mode flag for Team v1 vs Realms v2 coexistence
-- ============================================
-- Realms ship plan v1.5 — Pass 1.
-- Gates v1 (team-based) and v2 (realms, 1-student-per-civ) in the same
-- codebase. All existing games default to 'team'. New Realms games set
-- 'realms' and teams.is_solo = true.
-- ============================================

-- Add game_mode to games
alter table games
  add column if not exists game_mode text not null default 'team'
    check (game_mode in ('team', 'realms'));

-- Add is_solo flag to teams (1-student-per-civ for Realms)
alter table teams
  add column if not exists is_solo boolean not null default false;

create index if not exists idx_games_game_mode on games(game_mode);

do $$ begin
  raise notice 'Migration 012 applied: game_mode flag (team | realms), teams.is_solo';
end $$;
