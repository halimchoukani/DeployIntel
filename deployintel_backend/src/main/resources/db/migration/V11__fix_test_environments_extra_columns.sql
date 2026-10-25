-- The test_environments table has a stale NOT NULL constraint on repository_url
-- (a column from a pre-V9 schema that survived the DROP TABLE + recreate cycle).
-- Our TestEnvironment entity does not map this column, so any INSERT violates
-- the constraint. Drop the NOT NULL so inserts can proceed with NULL.

ALTER TABLE test_environments
    ALTER COLUMN repository_url DROP NOT NULL;
