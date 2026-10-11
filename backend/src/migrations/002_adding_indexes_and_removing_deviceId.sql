BEGIN;

CREATE INDEX idx_refresh_tokens_user_id
ON refresh_tokens(user_id);

ALTER TABLE refresh_tokens
DROP COLUMN device_id;

COMMIT;