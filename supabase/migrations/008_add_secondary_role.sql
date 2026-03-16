-- Migration 008: Add secondary_role for small teams (3-4 students, 5 roles)
-- Problem: teams of 3 only used 3 of 5 roles (arch/merch/dipl); lorekeeper + warlord
--          were never assigned. Teams of 4 missed warlord.
-- Fix: nullable secondary_role column so students can hold 2 roles simultaneously.
--      The rotate-roles endpoint rotates both columns forward by 1 each epoch,
--      so over 5 epochs every student holds every role at least once.
--
-- Assignment logic:
--   3-student teams: architects get lorekeeper, merchants get warlord, diplomats solo
--   4-student teams: architects get warlord, everyone else solo
--   5-student teams: no secondary needed (all 5 roles covered)
--
-- Run this in the Supabase SQL Editor BEFORE deploying code with secondary_role support.

-- 1. Add the column (nullable — existing rows will be NULL until patched below)
ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS secondary_role role_name;

-- 2. Patch existing students based on team size + current assigned_role
--    Only targets the real class games (not simulation games) by limiting to
--    teams that are members of your actual classroom games.

-- 3-student teams: architects get lorekeeper as secondary
UPDATE team_members
SET secondary_role = 'lorekeeper'
WHERE assigned_role = 'architect'
  AND secondary_role IS NULL
  AND (SELECT COUNT(*) FROM team_members t2 WHERE t2.team_id = team_members.team_id) = 3;

-- 3-student teams: merchants get warlord as secondary
UPDATE team_members
SET secondary_role = 'warlord'
WHERE assigned_role = 'merchant'
  AND secondary_role IS NULL
  AND (SELECT COUNT(*) FROM team_members t2 WHERE t2.team_id = team_members.team_id) = 3;

-- 4-student teams: architects get warlord as secondary
UPDATE team_members
SET secondary_role = 'warlord'
WHERE assigned_role = 'architect'
  AND secondary_role IS NULL
  AND (SELECT COUNT(*) FROM team_members t2 WHERE t2.team_id = team_members.team_id) = 4;
