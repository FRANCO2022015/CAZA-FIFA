-- Ejecutar en Neon antes de desplegar. Conserva los datos existentes.
BEGIN;
CREATE TABLE IF NOT EXISTS player_history (
 id bigserial PRIMARY KEY, game varchar(10) NOT NULL CHECK(game IN ('FIFA','EFOOTBALL')),
 player_id bigint NOT NULL, nombre text NOT NULL, recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 goles bigint NOT NULL, asistencias bigint NOT NULL, partidos bigint NOT NULL,
 transaction_id bigint NOT NULL DEFAULT txid_current(), UNIQUE(game,player_id,transaction_id)
);
CREATE INDEX IF NOT EXISTS player_history_lookup ON player_history(game,player_id,recorded_at,id);
CREATE OR REPLACE FUNCTION caza_snapshot(g text, pid bigint) RETURNS void LANGUAGE plpgsql AS $$
DECLARE n text; goals bigint; assists bigint; matches bigint;
BEGIN
 -- Serialize snapshots for the same player, including concurrent season updates.
 PERFORM pg_advisory_xact_lock(hashtextextended(g || ':' || pid::text, 0));
 IF g='FIFA' THEN
  SELECT p.nombre,coalesce(sum(s.goles),0),coalesce(sum(s.asistencias),0),coalesce(sum(s.partidos_jugados),0)
  INTO n,goals,assists,matches FROM players p LEFT JOIN player_stats s ON s.player_id=p.id WHERE p.id=pid GROUP BY p.id;
 ELSE
  SELECT nombre,goles,asistencias,partidos INTO n,goals,assists,matches FROM jugadores WHERE id=pid;
 END IF;
 IF n IS NULL THEN RETURN; END IF;
 IF EXISTS(SELECT 1 FROM player_history WHERE game=g AND player_id=pid AND transaction_id=txid_current()) THEN
  UPDATE player_history SET nombre=n,goles=goals,asistencias=assists,partidos=matches,recorded_at=clock_timestamp()
   WHERE game=g AND player_id=pid AND transaction_id=txid_current();
 ELSIF NOT EXISTS(SELECT 1 FROM (SELECT goles,asistencias,partidos FROM player_history WHERE game=g AND player_id=pid ORDER BY recorded_at DESC,id DESC LIMIT 1) h
                  WHERE h.goles=goals AND h.asistencias=assists AND h.partidos=matches) THEN
  INSERT INTO player_history(game,player_id,nombre,goles,asistencias,partidos) VALUES(g,pid,n,goals,assists,matches);
 END IF;
END $$;
CREATE OR REPLACE FUNCTION caza_history_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF TG_TABLE_NAME='player_stats' THEN
  IF TG_OP='DELETE' THEN PERFORM caza_snapshot('FIFA',OLD.player_id);
  ELSE
   PERFORM caza_snapshot('FIFA',NEW.player_id);
   IF TG_OP='UPDATE' AND OLD.player_id<>NEW.player_id THEN PERFORM caza_snapshot('FIFA',OLD.player_id); END IF;
  END IF;
 ELSIF TG_TABLE_NAME='players' THEN PERFORM caza_snapshot('FIFA',NEW.id);
 ELSE PERFORM caza_snapshot('EFOOTBALL',NEW.id);
 END IF;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS caza_history ON jugadores;
CREATE TRIGGER caza_history AFTER INSERT OR UPDATE OF goles,asistencias,partidos ON jugadores FOR EACH ROW EXECUTE FUNCTION caza_history_trigger();
DROP TRIGGER IF EXISTS caza_history ON players;
CREATE TRIGGER caza_history AFTER INSERT ON players FOR EACH ROW EXECUTE FUNCTION caza_history_trigger();
DROP TRIGGER IF EXISTS caza_history ON player_stats;
CREATE TRIGGER caza_history AFTER INSERT OR UPDATE OR DELETE ON player_stats FOR EACH ROW EXECUTE FUNCTION caza_history_trigger();
-- Baseline only for players without history. Rerunning never resets the timeline.
SELECT caza_snapshot('FIFA',id) FROM players p WHERE NOT EXISTS(SELECT 1 FROM player_history h WHERE h.game='FIFA' AND h.player_id=p.id);
SELECT caza_snapshot('EFOOTBALL',id) FROM jugadores p WHERE NOT EXISTS(SELECT 1 FROM player_history h WHERE h.game='EFOOTBALL' AND h.player_id=p.id);
CREATE TABLE IF NOT EXISTS comic_folders (
 id bigserial PRIMARY KEY, parent_id bigint REFERENCES comic_folders(id),
 kind varchar(10) NOT NULL CHECK(kind IN ('SECTION','SAGA','CHAPTER')),
 name varchar(120) NOT NULL, sort_order integer NOT NULL DEFAULT 0,
 CHECK ((kind='SECTION' AND parent_id IS NULL) OR (kind<>'SECTION' AND parent_id IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS comic_folders_parent ON comic_folders(parent_id,sort_order,id);
CREATE TABLE IF NOT EXISTS comic_pages (
 id bigserial PRIMARY KEY, chapter_id bigint NOT NULL REFERENCES comic_folders(id),
 asset_id varchar(200) NOT NULL UNIQUE, name varchar(200) NOT NULL, sort_order integer NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS comic_pages_chapter ON comic_pages(chapter_id,sort_order,id);
COMMIT;
