-- V14: Add automated container test result fields and test_run relationship to releases table
ALTER TABLE releases ADD COLUMN IF NOT EXISTS total_tests INT DEFAULT 0;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS passed_tests INT DEFAULT 0;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS failed_tests INT DEFAULT 0;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS duration_ms BIGINT DEFAULT 0;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS test_logs TEXT;
ALTER TABLE releases ADD COLUMN IF NOT EXISTS test_run_id UUID REFERENCES test_runs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_releases_test_run_id ON releases (test_run_id);

