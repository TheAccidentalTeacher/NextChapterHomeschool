-- Migration 010: Create security-definer function to delete epoch submissions.
-- This bypasses RLS entirely since it runs as the function owner (postgres).
-- Solves the issue where PostgREST DELETE returns 0 even with service role key.

create or replace function clear_epoch_submissions(
  p_game_id uuid,
  p_epoch integer
)
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  delete from epoch_submissions
  where game_id = p_game_id
    and epoch = p_epoch;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
