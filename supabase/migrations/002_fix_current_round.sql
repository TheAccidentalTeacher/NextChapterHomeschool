-- ============================================
-- Migration 002: Fix current_round column type
-- ============================================
-- The round_type enum ('EXPAND','BUILD','RESOLVE','DEFINE') is too
-- restrictive for the epoch state machine which uses step names:
-- login, build, build_routing, expand, expand_routing, define,
-- define_routing, defend, defend_routing, resolve, exit.
-- 
-- Also: 'DEFEND' was missing from the enum entirely.
--
-- Fix: Change games.current_round from round_type enum to text.
-- The epoch_submissions.round_type column keeps the enum since
-- submissions only use BUILD/EXPAND/DEFINE/DEFEND.
-- ============================================

-- Step 1: Add DEFEND to the round_type enum (needed for submissions)
ALTER TYPE round_type ADD VALUE IF NOT EXISTS 'DEFEND';

-- Step 2: Change games.current_round from enum to text
-- PostgreSQL can't cast enum → text in ALTER COLUMN directly,
-- so we create a new column, copy, drop, rename.
ALTER TABLE games ADD COLUMN current_round_new text;
UPDATE games SET current_round_new = current_round::text;
ALTER TABLE games DROP COLUMN current_round;
ALTER TABLE games RENAME COLUMN current_round_new TO current_round;
ALTER TABLE games ALTER COLUMN current_round SET NOT NULL;
ALTER TABLE games ALTER COLUMN current_round SET DEFAULT 'login';
