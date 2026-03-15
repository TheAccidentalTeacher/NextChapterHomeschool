-- Migration 005: Add class_period and round_timer_minutes to games table
-- Fixes H1 (grade hardcoded) and H5 (class_period/round_timer not persisted)
-- class_period drives the grade prop on RoundSubmissionCard scaffolding

alter table games
  add column if not exists class_period text not null default '6th',
  add column if not exists round_timer_minutes integer not null default 8;
