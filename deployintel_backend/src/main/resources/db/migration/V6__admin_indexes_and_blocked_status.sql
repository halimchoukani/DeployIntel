-- V6: Add BLOCKED status support and admin performance indexes
-- The status column is VARCHAR(20) so no ALTER TYPE needed.
-- Add indexes to speed up admin dashboard queries.

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
