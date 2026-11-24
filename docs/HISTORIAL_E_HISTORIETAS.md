# Comparación histórica y Mi historieta

## Antes de publicar

1. En Neon abre SQL Editor y selecciona la misma base y rama usadas por Render.
2. Ejecuta completo `docs/migrations/005_history_comics.sql`. No elimina jugadores ni fotos. Crea tres tablas nuevas y disparadores para registrar estadísticas. Se puede repetir sin reiniciar el historial.
3. El historial empieza con los valores presentes al ejecutar la migración. No recupera ni inventa fechas de cambios anteriores. FIFA usa la suma de las temporadas; eFootball sus totales. Las correcciones hacia abajo también se registran. Las modificaciones de una misma transacción se consolidan en un punto final.
4. En Render conserva las variables actuales de Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. No se añaden secretos en Vercel ni en Git. La biblioteca requiere Cloudinary, incluso en desarrollo local.
5. Publica el código desde main. Render y Vercel deben desplegar el mismo commit; espera a que el backend esté Live y Vercel Ready. No recrees los servicios ni reimportes la base.

```powershell
cd C:\Users\Franco\Desktop\SIMULACION
git status
git add caza-backend/src caza-frontend/src docs/migrations/005_history_comics.sql docs/HISTORIAL_E_HISTORIETAS.md scripts/test_history.sql scripts/test_comparison.cjs
git diff --cached --stat
git commit -m "Agregar comparación histórica y biblioteca privada de historietas"
git push origin main
```

## Uso y comprobaciones

### Comparar

Abre Comparar en el menú. Selecciona FIFA o eFootball, dos jugadores distintos y goles, asistencias o partidos. Pasa el cursor por los puntos, tócalos o usa Tab para ver valores y fechas. La tabla desplegable permite revisar los registros exactos. La línea conserva el último dato conocido hasta la siguiente actualización; no interpola goles no registrados.

Con dos jugadores de prueba: A=100 y B=5, guarda después B=20, B=50 y B=120 en operaciones separadas. Pulsa Actualizar datos o vuelve a Comparar. Debe aparecer el primer momento registrado en que B pasa de igual/inferior a superior, y el tiempo desde el primer registro disponible para ambos. Si B ya era superior al comenzar el historial, no se inventa un adelantamiento previo. Las fechas se muestran en la zona horaria del navegador.

### Historieta

Entra como administrador y abre Administración → Mi historieta (también en el menú de tu cuenta). Crea una sección, entra y crea una saga; dentro crea los capítulos. Puedes editar nombres y orden de las carpetas. Los empates se resuelven por orden de creación.

Dentro de un capítulo selecciona varios PNG de hasta 7 MB y 40 megapíxeles cada uno. Se suben uno por uno en orden natural de nombre: 1.png, 2.png, 10.png. Se muestra el progreso y, si falla una carga, cuántas se confirmaron. Revisa la lista antes de repetir para no duplicar una página cuya respuesta se haya perdido. Usa las flechas arriba/abajo de la lista para cambiar el orden.

Pulsa Leer capítulo o el nombre de una página. El lector permite zoom, desplazamiento, pantalla completa, botones Anterior/Siguiente y teclas izquierda/derecha. Escape cierra el lector (en pantalla completa el navegador puede salir primero de ese modo). Al terminar un capítulo continúa con el siguiente capítulo con páginas; también atraviesa sagas y secciones en su orden. Los capítulos vacíos se omiten. Al abrir de nuevo una página se vuelve a ajustar el zoom.

Comprueba que una cuenta normal no ve Mi historieta y que `/admin/comics` no permite entrar. El backend rechaza también las peticiones directas de esa cuenta a `/api/comics/**`.

## Almacenamiento

- **Neon:** historial de estadísticas, nombres de carpetas, orden e identificadores de las páginas.
- **Cloudinary:** PNG de las historietas como imágenes de tipo `authenticated` bajo `caza/comics/`. Los jugadores mantienen su almacenamiento actual.
- **Render:** API, permisos y generación de enlaces firmados. No guarda los PNG en su disco temporal.
- **Vercel:** interfaz y lector.

El lector solicita enlaces de descarga firmados válidos durante cinco minutos. Solo un administrador puede generarlos; quien reciba uno de esos enlaces puede usarlo mientras siga vigente. No compartas esos enlaces si la historieta es privada. Al volver a abrir la página se genera uno nuevo. Reintentar renueva el enlace si la carga falla. El uso de almacenamiento y transferencia cuenta dentro de las cuotas de tu cuenta Cloudinary.

La primera carga real debe comprobarse con un PNG en tu cuenta después del despliegue: se validaron estructura, permisos y lector localmente, pero no se subieron archivos a Cloudinary de producción durante esta tarea. Si Cloudinary rechaza una carga o entrega, revisa la configuración y el error de Render sin publicar claves.

## Verificaciones de desarrollo

- `npm run build` dentro de caza-frontend.
- `mvn test` dentro de caza-backend: incluye bloqueo de usuarios normales y validación de PNG.
- `node scripts/test_comparison.cjs`: pruebas del cálculo de la evolución y adelantamiento.
- `scripts/test_history.sql` con psql en una base local migrada: prueba cambios, operaciones sin cambios, agregados FIFA y eliminación de temporada; revierte los cambios de datos al terminar. Nunca usar las pruebas en producción.

La migración fue ejecutada dos veces en PostgreSQL local. También se comprobaron HTTP real contra el backend local, navegación entre capítulos, zoom, teclado, restricción de ruta y diseño móvil con APIs simuladas en el navegador. No se ejecutaron cambios en Neon, Render ni Vercel.
