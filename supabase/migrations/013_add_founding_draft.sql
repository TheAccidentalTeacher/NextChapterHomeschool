-- ============================================
-- Migration 013: Founding draft fairness + audit columns
-- ============================================
-- Realms ship plan v1.5 — Pass 1.
-- Minimal addition: the draft shuffle mechanic already lives in
-- src/app/api/games/[id]/randomize-draft/route.ts using teams.draft_order
-- (added in Migration 011 for catch-up). This migration adds fairness/audit
-- columns on top so the claim flow can enforce server-side timeouts and the
-- random seed is preserved for replay integrity.
-- ============================================

-- Games: founding seed + session timestamp for audit + reproducibility
alter table games
  add column if not exists founding_seed text,
  add column if not exists founding_started_at timestamptz;

-- Teams: claim deadline enforced server-side + claim completion timestamp.
-- (Plan v1.4 put these on team_members; v1.5 puts them on teams because
--  Realms is one-team-per-student so team-level is equivalent and simpler.)
alter table teams
  add column if not exists claim_deadline timestamptz,
  add column if not exists claim_completed_at timestamptz,
  add column if not exists claim_skip_reason text
    check (claim_skip_reason is null or claim_skip_reason in ('timeout', 'manual', 'absent'));

-- Index to speed the "whose turn is it" query in /api/games/[id]/founding/order
create index if not exists idx_teams_claim_flow
  on teams(game_id, draft_order, claim_completed_at);

do $$ begin
  raise notice 'Migration 013 applied: founding draft fairness (seed, deadline, skip reason)';
end $$;
