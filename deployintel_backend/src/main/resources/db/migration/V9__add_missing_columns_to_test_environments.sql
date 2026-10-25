DROP TABLE IF EXISTS test_environments CASCADE;

CREATE TABLE test_environments (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    container_id VARCHAR(128),
    container_name VARCHAR(150),
    image VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL,
    port_mapping VARCHAR(100),
    environment_variables TEXT,
    workspace_path VARCHAR(255) NOT NULL DEFAULT '/workspace',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT fk_test_environments_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_test_environments_project_id ON test_environments (project_id);
CREATE INDEX IF NOT EXISTS idx_test_environments_container_id ON test_environments (container_id);
CREATE INDEX IF NOT EXISTS idx_test_environments_status ON test_environments (status);
CREATE INDEX IF NOT EXISTS idx_test_environments_created_at ON test_environments (created_at DESC);
