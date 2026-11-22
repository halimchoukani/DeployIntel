-- V17: Create project_members and project_invitations tables for team collaboration

-- 1. Project Members Table
CREATE TABLE IF NOT EXISTS project_members (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_members_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_project_members_project_user UNIQUE (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members (project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members (user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role ON project_members (role);

-- 2. Project Invitations Table
CREATE TABLE IF NOT EXISTS project_invitations (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    invited_by_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_project_invitations_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_invitations_invited_by FOREIGN KEY (invited_by_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON project_invitations (project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations (email);
CREATE INDEX IF NOT EXISTS idx_project_invitations_status ON project_invitations (status);
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations (token);

-- 3. Backfill: Insert existing project owners as OWNER members for all existing projects
INSERT INTO project_members (id, project_id, user_id, role, joined_at)
SELECT gen_random_uuid(), p.id, p.owner_id, 'OWNER', p.created_at
FROM projects p
WHERE NOT EXISTS (
    SELECT 1 FROM project_members pm
    WHERE pm.project_id = p.id AND pm.user_id = p.owner_id
);
