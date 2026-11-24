-- Isolated PostgreSQL verification; all data mutations roll back.
BEGIN;
DO $$
DECLARE pid bigint; before_count bigint; g bigint; a bigint; m bigint; h record;
BEGIN
 SELECT id,goles,asistencias,partidos INTO pid,g,a,m FROM jugadores ORDER BY id LIMIT 1;
 SELECT count(*) INTO before_count FROM player_history WHERE game='EFOOTBALL' AND player_id=pid;
 UPDATE jugadores SET goles=goles WHERE id=pid;
 IF (SELECT count(*) FROM player_history WHERE game='EFOOTBALL' AND player_id=pid)<>before_count THEN RAISE EXCEPTION 'No-op added snapshot'; END IF;
 UPDATE jugadores SET goles=g+20 WHERE id=pid;
 UPDATE jugadores SET goles=g+40,asistencias=a+1 WHERE id=pid;
 SELECT * INTO h FROM player_history WHERE game='EFOOTBALL' AND player_id=pid ORDER BY recorded_at DESC,id DESC LIMIT 1;
 IF h.goles<>g+40 OR h.asistencias<>a+1 OR h.partidos<>m THEN RAISE EXCEPTION 'Incorrect eFootball snapshot'; END IF;
 IF (SELECT count(*) FROM player_history WHERE game='EFOOTBALL' AND player_id=pid)<>before_count+1 THEN RAISE EXCEPTION 'Expected one final snapshot per transaction'; END IF;
 SELECT player_id INTO pid FROM player_stats ORDER BY id LIMIT 1;
 UPDATE player_stats SET goles=goles+1 WHERE player_id=pid;
 SELECT * INTO h FROM player_history WHERE game='FIFA' AND player_id=pid ORDER BY recorded_at DESC,id DESC LIMIT 1;
 IF h.goles<>(SELECT sum(goles) FROM player_stats WHERE player_id=pid) THEN RAISE EXCEPTION 'FIFA totals not aggregated'; END IF;
 DELETE FROM player_stats WHERE id=(SELECT id FROM player_stats WHERE player_id=pid LIMIT 1);
 SELECT * INTO h FROM player_history WHERE game='FIFA' AND player_id=pid ORDER BY recorded_at DESC,id DESC LIMIT 1;
 IF h.goles<>(SELECT coalesce(sum(goles),0) FROM player_stats WHERE player_id=pid) THEN RAISE EXCEPTION 'Deleted season not recorded'; END IF;
 RAISE NOTICE 'PASS history: no-op, final transaction, eFootball, FIFA aggregate, season deletion';
END $$;
ROLLBACK;
