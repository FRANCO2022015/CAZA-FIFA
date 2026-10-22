# Correcciones del catálogo — 21/10/2026

- La lista conserva en la sesión del navegador (por usuario) sección, página, búsqueda, orden, filtros aplicados y vista de compras al regresar de una ficha o recargar.
- El orden inicial es goles descendente en FIFA y eFootball. FIFA acumula todas las temporadas.
- Todas las consultas paginadas de jugadores desempatan por ID ascendente, incluidas búsquedas avanzadas y agregados FIFA. Esto evita repeticiones por empates con datos sin cambios durante la navegación; si alguien cambia estadísticas mientras navegas, la clasificación puede cambiar.
- «Todos los jugadores» / «Mis jugadores»: la segunda muestra jugadores activos comprados por la cuenta actual, incluidos titulares, suplentes y compras aún no asignadas a una alineación. Una tarjeta por jugador; las compras repetidas no duplican tarjetas. Usa las estadísticas actuales del catálogo, con búsqueda, filtros y orden antes de paginar.
- Las respuestas antiguas de solicitudes concurrentes no reemplazan una respuesta más reciente dentro de cada sección. Los errores tienen opción Reintentar.

## Publicar

No requiere SQL nuevo, migración ni variables nuevas. Hacer commit y push a la rama conectada a Render/Vercel, esperar ambos despliegues y abrir el mismo enlace. No se han publicado cambios desde esta tarea.

## Verificación

Compilación frontend y Maven package aprobados. Navegador Edge con API simulada: orden inicial, regreso desde FIFA, Atrás desde eFootball, compras de páginas distintas, deduplicación y recarga. PostgreSQL local aislado: 20 recorridos completos, goles/asistencias en ambas direcciones y cinco rutas de listado/búsqueda, sin IDs repetidos y con desempate correcto.

Regresión API: ejecutar scripts/verify-catalogue.py con CAZA_TEST_PASSWORD y opcionalmente CAZA_TEST_EMAIL y CAZA_TEST_URL. Rechaza hosts remotos. Usa una base aislada con suficientes jugadores empatados.
Regresión UI: iniciar Vite local en 127.0.0.1:5173; ejecutar node scripts/verify-catalogue-ui.cjs con Playwright y Edge instalados. PLAYWRIGHT_MODULE permite indicar la ubicación del módulo. Las respuestas API se simulan y no se realizan compras reales.
