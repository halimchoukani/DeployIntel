ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users ADD COLUMN provider VARCHAR(30) NOT NULL DEFAULT 'LOCAL';

ALTER TABLE users ADD COLUMN provider_id VARCHAR(100);

ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500);

CREATE INDEX idx_users_provider_provider_id ON users (provider, provider_id);
