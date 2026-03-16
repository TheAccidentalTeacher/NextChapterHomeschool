-- Migration 007: Reset game data for new global team structure (Decision 95 + 96)
-- ─────────────────────────────────────────────────────────────────────────────
-- WHAT THIS DOES:
--   Clears all game state created by the original 3-team setup-classes.ts run
--   (2 games, 6 teams, 35 students). After applying this migration, re-run:
--     npx tsx scripts/setup-classes.ts
--   to seed the new 5-team + 6-team global structure.
--
-- WHY:
--   Decision 95: teams of 3 (was 5). 6th = 5 teams. 7/8 = 6 teams.
--   Decision 96: each class plays the full 12-region global map.
--   Old 3-team structure had regions 1, 2, 4, 5, 8, 9.
--   New 11-region structure has 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12.
--
-- SAFE TO RUN:
--   The game is at Epoch 1. No submissions, no events, no resources beyond
--   starting Food=10. Nothing here is worth preserving.
--
-- NOTE: This uses the service role key (bypasses RLS). Run via Supabase CLI
--   or the Supabase Dashboard SQL editor with service role credentials.
--   Do NOT run this after the simulation has started — it deletes all game data.
-- ─────────────────────────────────────────────────────────────────────────────

-- Delete in FK-safe order: child tables first, then parent tables.
-- All deletes are scoped to the teacher's Clerk ID to avoid touching
-- any other game data that may exist in the DB.

do $$
declare
  v_teacher_clerk_id text := 'user_3AZrclOVGSEZVBxczHdpiqxQHIx';
begin

  -- epoch_role_assignments (covers/substitute assignments)
  delete from epoch_role_assignments
  where team_id in (
    select t.id from teams t
    join games g on g.id = t.game_id
    where g.teacher_id = v_teacher_clerk_id
  );

  -- team_fog_state
  delete from team_fog_state
  where team_id in (
    select t.id from teams t
    join games g on g.id = t.game_id
    where g.teacher_id = v_teacher_clerk_id
  );

  -- civilization_names
  delete from civilization_names
  where team_id in (
    select t.id from teams t
    join games g on g.id = t.game_id
    where g.teacher_id = v_teacher_clerk_id
  );

  -- tech_research
  delete from tech_research
  where team_id in (
    select t.id from teams t
    join games g on g.id = t.game_id
    where g.teacher_id = v_teacher_clerk_id
  );

  -- trade_offers
  delete from trade_offers
  where game_id in (
    select id from games where teacher_id = v_teacher_clerk_id
  );

  -- epoch_submissions
  delete from epoch_submissions
  where game_id in (
    select id from games where teacher_id = v_teacher_clerk_id
  );

  -- game_events
  delete from game_events
  where game_id in (
    select id from games where teacher_id = v_teacher_clerk_id
  );

  -- team_resources
  delete from team_resources
  where team_id in (
    select t.id from teams t
    join games g on g.id = t.game_id
    where g.teacher_id = v_teacher_clerk_id
  );

  -- team_members
  delete from team_members
  where team_id in (
    select t.id from teams t
    join games g on g.id = t.game_id
    where g.teacher_id = v_teacher_clerk_id
  );

  -- teams
  delete from teams
  where game_id in (
    select id from games where teacher_id = v_teacher_clerk_id
  );

  -- games (last — all children already gone)
  delete from games
  where teacher_id = v_teacher_clerk_id;

  raise notice 'Game data cleared for teacher %. Re-run setup-classes.ts to seed new structure.', v_teacher_clerk_id;

end $$;
