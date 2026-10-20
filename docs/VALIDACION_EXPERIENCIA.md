# Validación de la actualización — 20 de octubre de 2026

## Entorno

Código en SIMULACION; Java 21, Maven y compilación Vite/TypeScript.
Backend de pruebas en 127.0.0.1:18081 y PostgreSQL aislado en 127.0.0.1:55432/caza_restore_test.
Frontend de pruebas en 127.0.0.1:5173. Navegador Edge sin ventana, tamaños 1440×1000 y 390×844.
No se modificó Neon ni se desplegó código. No se creó un nuevo respaldo.

## Resultado

- 7 pruebas unitarias del servicio de compras: correctas.
- Compilación TypeScript y build de producción Vite: correctos.
- 55 solicitudes HTTP con aserciones: correctas.
- Prueba de interfaz con Playwright: correcta, sin errores JavaScript de página.
- `git diff --check`: sin errores.

## Casos comprobados

- Crear FIFA y su primera temporada en una operación; editar jugador y estadísticas.
- Fallo en edición de una temporada: rollback del jugador y de los eventos de auditoría.
- Precio cero conservado; valores decimales equivalentes no generan falsos cambios.
- Recorte inválido rechazado; PNG transparente subido al servidor local de pruebas y asignado sin reemplazar la foto original.
- Archivar/restaurar eFootball, ocultarlo del catálogo y rechazar su compra mientras está archivado.
- Dos checkouts simultáneos con la misma clave: una compra y un único descuento.
- Consulta de resultado de compra limitada a su propietario.
- Alineación con suplente guardada; otro usuario no puede leerla ni sobrescribirla.
- Dos ediciones concurrentes con la misma versión: una aceptada y otra rechazada con 409.
- Eliminación con versión antigua rechazada.
- Auditoría disponible solo para administradores; sin campos de contraseña o token.
- Auditoría de jugadores, estadísticas, compras, saldo, alineaciones, foro, comentarios y reuniones.
- Barras: hover y toque; tres valores visibles.
- Fichas y equipo sin desbordamiento horizontal a 390 px.
- Equipo guardado, movido por selección de destino y recuperado tras recargar.
- Aviso al cerrar el editor con cambios pendientes.
- Descarga del PDF desde el navegador; texto extraíble y paginación.

## Alcance de la evidencia

Estas pruebas no son una auditoría de seguridad exhaustiva ni garantizan ausencia de errores
en todas las combinaciones posibles. La validación de servicios externos y cuotas debe hacerse
después de publicar, según GUIA_ACTUALIZACION_EXPERIENCIA.md.
No se probó escritura en Cloudinary de producción. El recorte de ejemplo se cargó solo localmente.
Las capturas usan datos de la copia de pruebas, que pueden ser anteriores a los actuales de Neon.
