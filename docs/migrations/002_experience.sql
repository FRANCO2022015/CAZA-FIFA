BEGIN;
ALTER TABLE players ADD COLUMN IF NOT EXISTS hologram_url varchar(500);
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS hologram_url varchar(500);
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS request_key varchar(36);
CREATE UNIQUE INDEX IF NOT EXISTS purchase_request_unique ON purchases(user_id, request_key);
CREATE TABLE IF NOT EXISTS lineups (
 id uuid PRIMARY KEY, user_id bigint NOT NULL REFERENCES users(id),
 name varchar(100) NOT NULL, payload text NOT NULL, version bigint NOT NULL DEFAULT 0,
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lineups_owner ON lineups(user_id);
CREATE TABLE IF NOT EXISTS audit_events (
 id bigserial PRIMARY KEY, occurred_at timestamptz NOT NULL DEFAULT now(),
 actor_id bigint, actor_name varchar(200) NOT NULL,
 entity_type varchar(80) NOT NULL, entity_id varchar(80) NOT NULL,
 entity_name text NOT NULL, game varchar(20), action varchar(30) NOT NULL,
 field_name varchar(100) NOT NULL, old_value text, new_value text
);
CREATE INDEX IF NOT EXISTS audit_date ON audit_events(occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS audit_actor ON audit_events(actor_id);
COMMIT;
