-- ============================================================
-- CAZA Football Platform - Database Initialization Script
-- ============================================================

-- Create database (run as superuser if needed)
-- CREATE DATABASE caza_db;
-- CREATE USER caza_user WITH ENCRYPTED PASSWORD 'caza_pass';
-- GRANT ALL PRIVILEGES ON DATABASE caza_db TO caza_user;

-- ============================================================
-- SEED DATA — Insert after Hibernate creates tables
-- ============================================================

-- Default ADMIN user (password: admin123)
-- BCrypt hash of "admin123"
INSERT INTO users (nombre, correo, password, rol, saldo, fecha_registro, activo)
VALUES ('Admin Caza', 'admin@caza.com',
        '$2a$12$LqV8L9Dn3pQb7LjrPYZ1VO6M7u.tDx5FZuNKhJGVDgGsP.OOd2yOi',
        'ADMIN', 50000.00, NOW(), true)
ON CONFLICT (correo) DO NOTHING;

-- Demo USER (password: user1234)
INSERT INTO users (nombre, correo, password, rol, saldo, fecha_registro, activo)
VALUES ('Franco Demo', 'demo@caza.com',
        '$2a$12$KIXx6M3f5qN1WpH9yJ5imeY5p3w.1bSK.3Uf7QWlcxOZRpZXd52S',
        'USER', 10000.00, NOW(), true)
ON CONFLICT (correo) DO NOTHING;

-- ── Players ─────────────────────────────────────────────────
INSERT INTO players (nombre, nacionalidad, posicion, edad, precio, imagen_url, activo)
VALUES
  ('Lionel Messi',    'Argentina',  'DELANTERO',      37, 45000000, NULL, true),
  ('Cristiano Ronaldo','Portugal',  'DELANTERO',      39, 35000000, NULL, true),
  ('Kylian Mbappé',   'Francia',   'DELANTERO',      25, 180000000, NULL, true),
  ('Erling Haaland',  'Noruega',   'DELANTERO',      23, 200000000, NULL, true),
  ('Vinicius Jr.',    'Brasil',    'DELANTERO',      23, 150000000, NULL, true),
  ('Pedri',           'España',    'CENTROCAMPISTA', 22, 120000000, NULL, true),
  ('Jude Bellingham', 'Inglaterra','CENTROCAMPISTA', 21, 180000000, NULL, true),
  ('Kevin De Bruyne', 'Bélgica',   'CENTROCAMPISTA', 33, 50000000, NULL, true),
  ('Virgil van Dijk', 'Países Bajos','DEFENSA',      33, 40000000, NULL, true),
  ('Rúben Dias',      'Portugal',  'DEFENSA',        27, 70000000, NULL, true),
  ('Trent Alexander-Arnold','Inglaterra','DEFENSA',  26, 80000000, NULL, true),
  ('Alisson Becker',  'Brasil',    'PORTERO',        31, 60000000, NULL, true),
  ('Manuel Neuer',    'Alemania',  'PORTERO',        38, 10000000, NULL, true),
  ('Marc-André ter Stegen','Alemania','PORTERO',     32, 40000000, NULL, true),
  ('Rodri',           'España',    'CENTROCAMPISTA', 28, 120000000, NULL, true),
  ('Lautaro Martínez','Argentina', 'DELANTERO',      27, 110000000, NULL, true),
  ('Rafael Leão',     'Portugal',  'DELANTERO',      25, 90000000, NULL, true),
  ('Bernardo Silva',  'Portugal',  'CENTROCAMPISTA', 30, 70000000, NULL, true),
  ('Joshua Kimmich',  'Alemania',  'CENTROCAMPISTA', 29, 60000000, NULL, true),
  ('Marquinhos',      'Brasil',    'DEFENSA',        30, 50000000, NULL, true)
ON CONFLICT DO NOTHING;

-- ── Player Stats ─────────────────────────────────────────────
INSERT INTO player_stats (player_id, temporada, goles, asistencias, partidos_jugados)
SELECT p.id, '2024-25', 28, 18, 35 FROM players p WHERE p.nombre = 'Lionel Messi' LIMIT 1;

INSERT INTO player_stats (player_id, temporada, goles, asistencias, partidos_jugados)
SELECT p.id, '2024-25', 32, 8, 36 FROM players p WHERE p.nombre = 'Cristiano Ronaldo' LIMIT 1;

INSERT INTO player_stats (player_id, temporada, goles, asistencias, partidos_jugados)
SELECT p.id, '2024-25', 35, 12, 38 FROM players p WHERE p.nombre = 'Kylian Mbappé' LIMIT 1;

INSERT INTO player_stats (player_id, temporada, goles, asistencias, partidos_jugados)
SELECT p.id, '2024-25', 40, 9, 37 FROM players p WHERE p.nombre = 'Erling Haaland' LIMIT 1;

INSERT INTO player_stats (player_id, temporada, goles, asistencias, partidos_jugados)
SELECT p.id, '2024-25', 22, 24, 38 FROM players p WHERE p.nombre = 'Vinicius Jr.' LIMIT 1;

INSERT INTO player_stats (player_id, temporada, goles, asistencias, partidos_jugados)
SELECT p.id, '2024-25', 12, 19, 33 FROM players p WHERE p.nombre = 'Pedri' LIMIT 1;

INSERT INTO player_stats (player_id, temporada, goles, asistencias, partidos_jugados)
SELECT p.id, '2024-25', 24, 15, 35 FROM players p WHERE p.nombre = 'Jude Bellingham' LIMIT 1;

INSERT INTO player_stats (player_id, temporada, goles, asistencias, partidos_jugados)
SELECT p.id, '2024-25', 8, 20, 30 FROM players p WHERE p.nombre = 'Kevin De Bruyne' LIMIT 1;

-- ── Songs ─────────────────────────────────────────────────────
INSERT INTO songs (titulo, artista, album, genero, anio, duracion, activo)
VALUES
  ('Seven Nation Army', 'The White Stripes', 'Elephant', 'Rock', 2003, '3:52', true),
  ('We Are the Champions', 'Queen', 'News of the World', 'Rock', 1977, '3:00', true),
  ('Eye of the Tiger', 'Survivor', 'Eye of the Tiger', 'Rock', 1982, '4:05', true),
  ('Freed from Desire', 'Gala', 'Come into My Life', 'Electronic', 1997, '3:31', true),
  ('Song 2', 'Blur', 'Blur', 'Rock', 1997, '2:01', true),
  ('Jump Around', 'House of Pain', 'House of Pain', 'Hip-Hop', 1992, '3:44', true),
  ('Thunderstruck', 'AC/DC', 'The Razors Edge', 'Rock', 1990, '4:52', true),
  ('Waka Waka', 'Shakira', 'Sale el Sol', 'Pop', 2010, '3:24', true),
  ('La La La', 'Shakira', 'Shakira.', 'Pop', 2014, '3:11', true),
  ('Put Your Hands Up for Detroit', 'Fedde Le Grand', 'Output', 'Electronic', 2006, '6:00', true),
  ('Dragostea Din Tei', 'O-Zone', 'DiscO-Zone', 'Pop', 2003, '3:35', true),
  ('Hero', 'Enrique Iglesias', 'Escape', 'Pop', 2001, '4:22', true)
ON CONFLICT DO NOTHING;

-- ── Forum Thread ──────────────────────────────────────────────
INSERT INTO forum_threads (titulo, descripcion, fecha_creacion, activo, user_id)
SELECT '¿Cuál es el mejor jugador de 2025?',
       'Discutamos sobre quién merece el Balón de Oro este año. ¿Messi, Mbappé o Haaland?',
       NOW(), true, u.id
FROM users u WHERE u.correo = 'admin@caza.com' LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO forum_threads (titulo, descripcion, fecha_creacion, activo, user_id)
SELECT 'Mejores inversiones del mercado CAZA',
       'Comparte tus estrategias para maximizar el saldo y conseguir el mejor equipo posible.',
       NOW(), true, u.id
FROM users u WHERE u.correo = 'demo@caza.com' LIMIT 1
ON CONFLICT DO NOTHING;
