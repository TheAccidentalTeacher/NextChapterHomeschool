-- Migration 006: Restrict delete policies to service role only
-- Fixes L7: anon key delete policies allow any user to delete all game data.
-- Simulation/nuke scripts should use the service role key, not the anon key.

-- Drop the overly-permissive policies (using true — any user)
drop policy if exists "games_delete"       on games;
drop policy if exists "teams_delete"       on teams;
drop policy if exists "members_delete"     on team_members;
drop policy if exists "resources_delete"   on team_resources;
drop policy if exists "events_delete"      on game_events;
drop policy if exists "submissions_delete" on epoch_submissions;
drop policy if exists "civnames_delete"    on civilization_names;
drop policy if exists "subzones_delete"    on sub_zones;
drop policy if exists "fog_delete"         on team_fog_state;
drop policy if exists "tech_delete"        on tech_research;
drop policy if exists "trades_delete"      on trade_offers;

-- Re-create with teacher-scoped restrictions
-- Only the teacher who owns the game can delete game-level records.
-- NOTE: Simulation scripts must use the service role key which bypasses RLS.

create policy "games_delete"
  on games for delete
  using (teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub'));

create policy "teams_delete"
  on teams for delete
  using (
    game_id in (
      select id from games
      where teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

create policy "members_delete"
  on team_members for delete
  using (
    team_id in (
      select t.id from teams t
      join games g on g.id = t.game_id
      where g.teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

create policy "resources_delete"
  on team_resources for delete
  using (
    team_id in (
      select t.id from teams t
      join games g on g.id = t.game_id
      where g.teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

create policy "events_delete"
  on game_events for delete
  using (
    game_id in (
      select id from games
      where teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

create policy "submissions_delete"
  on epoch_submissions for delete
  using (
    game_id in (
      select id from games
      where teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

create policy "civnames_delete"
  on civilization_names for delete
  using (
    game_id in (
      select id from games
      where teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

create policy "subzones_delete"
  on sub_zones for delete
  using (
    game_id in (
      select id from games
      where teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

create policy "fog_delete"
  on team_fog_state for delete
  using (
    team_id in (
      select t.id from teams t
      join games g on g.id = t.game_id
      where g.teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

create policy "tech_delete"
  on tech_research for delete
  using (
    game_id in (
      select id from games
      where teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );

create policy "trades_delete"
  on trade_offers for delete
  using (
    game_id in (
      select id from games
      where teacher_id = (current_setting('request.jwt.claims', true)::json->>'sub')
    )
  );
