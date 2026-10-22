# Validación — solicitudes y diseño, 22 de octubre de 2026

## Entorno

Pruebas contra PostgreSQL 16 local aislado y backend en 127.0.0.1:18081, nunca contra Neon ni los servicios publicados. Se crearon cuentas y jugadores de prueba; los jugadores de prueba se archivaron al finalizar. La migración 003 es aditiva y se probó sobre el esquema existente.

## Resultados

- Maven package: compilación y 7 pruebas Java existentes aprobadas.
- Frontend: TypeScript y Vite build aprobados.
- 46 comprobaciones HTTP: registro USER, bloqueo de creación/edición/archivo y escritura de estadísticas para USER, aislamiento de solicitudes por cuenta, validación de campos/valores/URLs, solicitud sin cambios rechazada, duplicado pendiente bloqueado, dos aprobaciones simultáneas con una sola aplicación, rechazo sin modificar datos, conflicto al cambiar un campo previamente, temporada FIFA correcta y validación de pertenencia, jugador archivado y atribución del solicitante/revisor en auditoría.
- Edge: formulario de registro con separación entre iconos y texto, validación de confirmación, ausencia de Gemini, ocultación de controles de administrador, propuesta enviada desde la ficha, aprobación desde otra sesión, resolución visible al usuario, PDF descargado y ausencia de errores JavaScript en las pantallas comprobadas.
- Vistas de 1440 px y 390 px: registro y solicitudes sin desbordamiento horizontal. Capturas reales en docs/screenshots.
- Se revisaron visualmente registro, catálogo y bandeja de administración; se ajustaron alineación de botones y navegación.

## Límites y publicación

No se ejecutaron GitHub Actions en GitHub, compilación Docker ni despliegues remotos durante esta tarea. El workflow se ejecutará al publicar. No se ha fusionado main ni cambiado la rama de Render/Vercel: se entregaron los comandos en GUIA_SOLICITUDES_Y_PUBLICACION.md para hacerlo después del commit y las pruebas de nube.

El catálogo usa los datos existentes. Los registros del nuevo flujo comienzan al publicar y no reconstruyen solicitudes antiguas. La validación de conflictos comprueba los campos incluidos en cada propuesta, no bloquea cambios independientes en otros campos. La sincronización de la bandeja ocurre al entrar, actualizar o volver a enfocar la ventana; no requiere WebSockets ni un servicio nuevo.
