-- Ejecutar en la base de Neon utilizada por Render ANTES del despliegue.
-- Migración aditiva: conserva jugadores, compras, usuarios y estadísticas.
BEGIN;
CREATE TABLE IF NOT EXISTS player_change_requests (
 id bigserial PRIMARY KEY,
 requester_id bigint NOT NULL REFERENCES users(id), requester_name varchar(200) NOT NULL,
 game varchar(20) NOT NULL CHECK (game IN ('FIFA','EFOOTBALL')),
 player_id bigint NOT NULL, stats_id bigint, player_name varchar(200) NOT NULL,
 before_values text NOT NULL, proposed_values text NOT NULL, reason varchar(1000) NOT NULL,
 status varchar(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN ('PENDIENTE','APROBADA','RECHAZADA')),
 created_at timestamptz NOT NULL DEFAULT now(),
 reviewer_id bigint REFERENCES users(id), reviewer_name varchar(200), review_note varchar(1000), reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS change_request_owner ON player_change_requests(requester_id,id DESC);
CREATE INDEX IF NOT EXISTS change_request_status ON player_change_requests(status,id DESC);
CREATE UNIQUE INDEX IF NOT EXISTS change_request_pending_unique ON player_change_requests(requester_id,game,player_id) WHERE status='PENDIENTE';
COMMIT;
