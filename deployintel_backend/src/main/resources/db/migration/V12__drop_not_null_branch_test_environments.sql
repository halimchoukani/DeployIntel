-- Drop the stale NOT NULL constraint on branch in test_environments table
-- because the TestEnvironment entity does not map or supply this column.
ALTER TABLE test_environments
    ALTER COLUMN branch DROP NOT NULL;
