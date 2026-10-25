-- Ensure all required columns exist in test_environments.
-- This migration is safe to run even if columns already exist (IF NOT EXISTS).

ALTER TABLE test_environments
    ADD COLUMN IF NOT EXISTS image VARCHAR(255) NOT NULL DEFAULT 'ubuntu:22.04';

ALTER TABLE test_environments
    ADD COLUMN IF NOT EXISTS container_id VARCHAR(128);

ALTER TABLE test_environments
    ADD COLUMN IF NOT EXISTS container_name VARCHAR(150);

ALTER TABLE test_environments
    ADD COLUMN IF NOT EXISTS port_mapping VARCHAR(100);

ALTER TABLE test_environments
    ADD COLUMN IF NOT EXISTS environment_variables TEXT;

ALTER TABLE test_environments
    ADD COLUMN IF NOT EXISTS workspace_path VARCHAR(255) NOT NULL DEFAULT '/workspace';

ALTER TABLE test_environments
    ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_test_environments_project_id ON test_environments (project_id);
CREATE INDEX IF NOT EXISTS idx_test_environments_container_id ON test_environments (container_id);
CREATE INDEX IF NOT EXISTS idx_test_environments_status ON test_environments (status);
CREATE INDEX IF NOT EXISTS idx_test_environments_created_at ON test_environments (created_at DESC);
