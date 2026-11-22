-- V16: Add AI suggestion and model fields to test_runs and releases tables

ALTER TABLE test_runs
    ADD COLUMN IF NOT EXISTS ai_suggestion TEXT,
    ADD COLUMN IF NOT EXISTS ai_model VARCHAR(100);

ALTER TABLE releases
    ADD COLUMN IF NOT EXISTS ai_suggestion TEXT;
