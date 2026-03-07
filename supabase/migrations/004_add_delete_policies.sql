-- ============================================
-- Add DELETE RLS policies for all game tables
-- Required for simulation cleanup / nuke scripts
-- using the anon key.
-- ============================================

create policy "games_delete"           on games           for delete using (true);
create policy "teams_delete"           on teams           for delete using (true);
create policy "members_delete"         on team_members    for delete using (true);
create policy "resources_delete"       on team_resources  for delete using (true);
create policy "events_delete"          on game_events     for delete using (true);
create policy "submissions_delete"     on epoch_submissions for delete using (true);
create policy "civnames_delete"        on civilization_names for delete using (true);
create policy "subzones_delete"        on sub_zones       for delete using (true);
create policy "fog_delete"             on team_fog_state  for delete using (true);
create policy "tech_delete"            on tech_research   for delete using (true);
create policy "trades_delete"          on trade_offers    for delete using (true);
