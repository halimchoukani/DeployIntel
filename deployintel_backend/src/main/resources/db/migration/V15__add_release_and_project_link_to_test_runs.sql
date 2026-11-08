-- V15: Add release_id to deployments and project_id to test_runs

ALTER TABLE deployments
    ADD COLUMN IF NOT EXISTS release_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_deployments_release'
    ) THEN
        ALTER TABLE deployments
            ADD CONSTRAINT fk_deployments_release FOREIGN KEY (release_id) REFERENCES releases (id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_deployments_release_id ON deployments (release_id);

ALTER TABLE test_runs
    ADD COLUMN IF NOT EXISTS project_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_test_runs_project'
    ) THEN
        ALTER TABLE test_runs
            ADD CONSTRAINT fk_test_runs_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_test_runs_project_id ON test_runs (project_id);

-- Backfill project_id in test_runs from deployments if any exist
UPDATE test_runs tr
SET project_id = d.project_id
FROM deployments d
WHERE tr.deployment_id = d.id AND tr.project_id IS NULL;

