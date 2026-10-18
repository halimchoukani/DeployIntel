CREATE TABLE releases (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    version_number VARCHAR(50) NOT NULL,
    commit_sha VARCHAR(100) NOT NULL,
    branch VARCHAR(150),
    tag VARCHAR(100),
    author_id UUID,
    environment VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_releases_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_releases_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_releases_project_id ON releases (project_id);
CREATE INDEX idx_releases_author_id ON releases (author_id);
CREATE INDEX idx_releases_status ON releases (status);
CREATE INDEX idx_releases_environment ON releases (environment);
CREATE INDEX idx_releases_created_at ON releases (created_at DESC);
