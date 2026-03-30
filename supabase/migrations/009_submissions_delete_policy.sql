-- Migration 009: Ensure DELETE policy exists on epoch_submissions
-- Migration 004 added this but may not have been applied to all environments.
-- Safe to run multiple times (drops old policy first if it exists).

do $$ begin
  -- Drop if already exists (harmless)
  drop policy if exists "submissions_delete" on epoch_submissions;

  -- Re-create to guarantee it is present
  create policy "submissions_delete"
    on epoch_submissions for delete
    using (true);

  raise notice 'submissions_delete policy applied to epoch_submissions';
end $$;
