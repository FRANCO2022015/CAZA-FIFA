-- Ejecutar en la base de Neon que usa Render ANTES de publicar el backend.
-- Aditiva: no cambia fotos, estadísticas ni posiciones FIFA.
BEGIN;
ALTER TABLE public.jugadores ADD COLUMN IF NOT EXISTS posicion varchar(3);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jugadores_posicion_check'
                   AND conrelid = 'public.jugadores'::regclass) THEN
        ALTER TABLE public.jugadores ADD CONSTRAINT jugadores_posicion_check
        CHECK (posicion IS NULL OR posicion IN
          ('PO','DEF','LI','LD','MC','MCD','MO','MDI','MDD','EXI','EXD','DC','SD'));
    END IF;
END $$;
COMMIT;
