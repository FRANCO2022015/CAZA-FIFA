-- ============================================================
-- MIGRACIÓN: Soporte eFootball en carrito + campo precio
-- Ejecutar en pgAdmin sobre la base de datos EFOOTBALL
-- ============================================================

-- 1. Agregar columna 'precio' a la tabla jugadores (si no existe)
ALTER TABLE jugadores
    ADD COLUMN IF NOT EXISTS precio NUMERIC(8, 2) NOT NULL DEFAULT 500.00;

-- 2. Asignar precio 500 a todos los jugadores existentes que tengan precio 0 o null
UPDATE jugadores
SET precio = 500.00
WHERE precio IS NULL OR precio = 0;

-- 3. Hacer player_id nullable en cart_items (para soportar jugadores eFootball)
ALTER TABLE cart_items
    ALTER COLUMN player_id DROP NOT NULL;

-- 4. Agregar columna jugador_id a cart_items (si no existe)
ALTER TABLE cart_items
    ADD COLUMN IF NOT EXISTS jugador_id BIGINT REFERENCES jugadores(id);

-- 5. Eliminar la unique constraint antigua que solo cubría (user_id, player_id)
--    ya que ahora el carrito puede tener ambos tipos
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'cart_items'
          AND constraint_type = 'UNIQUE'
          AND constraint_name LIKE '%player%'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE cart_items DROP CONSTRAINT ' || constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'cart_items'
              AND constraint_type = 'UNIQUE'
              AND constraint_name LIKE '%player%'
            LIMIT 1
        );
    END IF;
END $$;

-- 6. Verificación
SELECT 'jugadores' as tabla, count(*) as filas, avg(precio) as precio_promedio FROM jugadores
UNION ALL
SELECT 'cart_items', count(*), null FROM cart_items;
