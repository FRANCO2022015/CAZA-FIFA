# Actualización de CAZA: hologramas, equipos y auditoría

## Estado

Cambios locales preparados en SIMULACION. No se hizo commit, push ni despliegue.
No se ejecutó SQL en Neon y no se generó un respaldo nuevo, por instrucción del usuario.
Las pruebas utilizaron la base local aislada `caza_restore_test` en `127.0.0.1:55432`.
Esta copia de pruebas procede del respaldo ya existente; no refleja las ediciones posteriores de producción.

## Qué incluye

- Fichas FIFA y eFootball con iluminación, anillos, partículas, inclinación y modo de movimiento reducido.
- Foto original conservada; `hologramUrl` permite un recorte transparente opcional. Si falta o falla, se usa la foto original.
- Tres barras accesibles por cursor, teclado y toque. FIFA identifica cada temporada; eFootball conserva GA/PG/PA/PGA.
- Editor administrativo con estadísticas editables, previsualizaciones, errores por campo, aviso de cambios pendientes y guardado transaccional FIFA.
- Archivado y restauración de ambos juegos. Los jugadores archivados no se pueden comprar; las compras pasadas siguen legibles.
- Campo con posiciones, arrastrar/intercambiar jugadores, alternativa por toque y 12 suplentes.
- Alineaciones nombradas, autoguardado en servidor y control de versiones. Otro dispositivo no sobrescribe silenciosamente cambios.
- Importación explícita de equipos del navegador, sin borrar los originales. Importación/exportación JSON del equipo actual.
- Carrito con estado de actualización, cantidades/subtotales, confirmación de compra y recuperación de intentos con un identificador persistente.
- Historial administrativo con fechas de Perú, usuario, juego, elemento, operación y valores anteriores/nuevos; PDF paginado con filtros.

## Límites explícitos

La foto no se convierte en un modelo 3D. Para ver la silueta flotando hace falta subir un PNG/WebP sin fondo.
Se incluye `docs/assets/osimhen-cutout.png` como ejemplo generado; revísalo antes de subirlo.
No se han recortado automáticamente todas las fotos ni cambiado sus URL de producción.
La auditoría comienza después del despliegue. No reconstruye el pasado ni registra SQL ejecutado directamente desde Neon/pgAdmin.
Cada cambio de campo genera una fila: el total del informe cuenta campos modificados, no operaciones completas.
La auditoría se guarda en la misma transacción que el cambio: si este falla, el registro también revierte.
Las contraseñas y tokens están excluidos mediante una lista explícita de campos permitidos.
La sincronización de equipos ocurre al guardar/cargar; no es edición colaborativa en tiempo real.
Los jugadores archivados conservados en una alineación siguen visibles como referencia histórica; no se añaden al catálogo activo.
Render gratuito conserva su tiempo de despertar. Este cambio no modifica el sistema de renovación del token.

## Orden para publicar — importante

El backend nuevo necesita nuevas columnas/tablas. **No hagas push antes de aplicar la migración si Render despliega automáticamente.**
La migración es aditiva y compatible con el backend anterior.

1. Revisa los cambios locales y termina tus pruebas.
2. En Neon, abre el editor SQL y selecciona el proyecto, rama y base que realmente usa Render.
3. Abre `docs/migrations/002_experience.sql`, copia TODO su contenido y ejecútalo una vez.
   Incluye BEGIN/COMMIT y no elimina tablas, jugadores, fotos ni compras. Usa IF NOT EXISTS para permitir repetirlo.
   Si aparece un error, no continúes con el despliegue: revisa el mensaje y el estado de la transacción.
4. Comprueba las nuevas tablas y columnas con:

```sql
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND ((table_name IN ('players','jugadores') AND column_name IN ('hologram_url','activo'))
    OR (table_name = 'purchases' AND column_name = 'request_key'));
SELECT count(*) FROM lineups;
SELECT count(*) FROM audit_events;
```

5. En PowerShell, desde `C:\Users\Franco\Desktop\SIMULACION`:

```powershell
git status
git branch --show-current
git diff --check
git add caza-backend/src caza-frontend/src docs scripts/verify-experience.py
git diff --cached --stat
git commit -m "Mejorar fichas, equipos, administracion y auditoria"
```

6. Comprueba que Render y Vercel usan la rama que acabas de revisar. En el despliegue anterior era `codex/preparacion-nube`.
7. Haz `git push origin codex/preparacion-nube` SOLO si esa sigue siendo la rama correcta.
8. Espera a que Render publique el backend y responda `/api/health`.
   Si los despliegues automáticos están activos, Render y Vercel arrancarán al recibir el push.
   Para evitar que el frontend nuevo se publique antes de que esté listo el backend, puedes pausar previamente el despliegue automático de Vercel y desplegarlo manualmente cuando Render esté listo.
9. Publica/reintenta Vercel con el mismo commit. No cambies sus variables de conexión que ya funcionan.
10. Abre la dirección estable de la aplicación y realiza las comprobaciones siguientes.

No se necesitan nuevas claves privadas ni servicios de pago para estas funciones.
Las nuevas tablas e imágenes consumen las cuotas que ya tienen Neon y Cloudinary.

## Comprobar las funciones publicadas

### Jugadores e imágenes
1. Entra como administrador y abre un jugador FIFA y uno eFootball.
2. Confirma nombre, valores, foto y color de cada juego.
3. Pasa el cursor por las tres barras y prueba también con Tab y desde un móvil.
4. En FIFA, verifica que cada gráfico tiene su temporada.
5. Edita Osimhen y sube `docs/assets/osimhen-cutout.png` en **Recorte para holograma**.
6. Guarda. Abre su ficha: debe verse el recorte sobre la base luminosa. La foto original permanece.
7. Prueba una modificación real que quieras conservar; si solo pruebas, anota el valor anterior y restáuralo después.

### Administración e historial
1. Cambia goles/asistencias de un jugador.
2. Abre Administración > Historial de cambios y PDF.
3. Filtra por el jugador: revisa usuario, fecha, campo, antes y después.
4. Descarga el PDF: debe incluir todos los resultados del filtro, incluso en varias páginas.
5. Prueba con un usuario normal: no debe poder consultar `/api/admin/audit` ni `/api/admin/archive`.
6. Archiva un jugador de prueba. Abre Administración > Jugadores archivados y restáuralo.
7. Prueba cerrar el editor después de escribir sin guardar: debe pedir confirmación.

### Equipos
1. Crea una alineación, asígnale nombre y añade titulares/suplentes.
2. Espera al mensaje **Guardado en la nube** antes de cerrar.
3. Mueve un titular a otra posición o al banco arrastrando.
4. Prueba el botón **Mover** y después toca el destino.
5. Cambia de formación: los jugadores permanecen.
6. Abre la misma cuenta en otro navegador y carga la alineación.
7. Edita la misma alineación desde dos dispositivos: el segundo guardado con una versión antigua debe mostrar conflicto.
8. Ante conflicto: recarga la versión de la nube o guarda los cambios como una copia nueva.
9. **Importar equipos de este navegador** copia los equipos antiguos a la nube; no elimina los originales.

### Carrito
1. Añade cantidades distintas y verifica precio unitario, subtotal y total.
2. Compra una vez y revisa el identificador de confirmación.
3. Si pierdes conexión, vuelve al carrito y utiliza **Consultar resultado**.
4. Si hace falta, **Reintentar la misma compra** conserva el identificador y evita un segundo descuento.
5. No borres el almacenamiento del navegador mientras haya una compra pendiente, porque ahí se conserva su identificador.

## Pruebas repetibles para desarrollo

Backend: Java 21 y `mvn test`. Frontend: `npm run build`.
`scripts/verify-experience.py` rechaza URL remotas y solo permite localhost/127.0.0.1.
Necesita un backend de pruebas, administrador y DOS usuarios distintos con saldo disponible.
Configura estas variables en esa sesión de terminal (no las guardes en Git):

- CAZA_TEST_URL (por defecto http://127.0.0.1:18081/api)
- CAZA_TEST_ADMIN_EMAIL (por defecto admin@caza.com)
- CAZA_TEST_ADMIN_PASSWORD
- CAZA_TEST_USER_EMAIL / CAZA_TEST_USER_PASSWORD
- CAZA_TEST_OTHER_EMAIL / CAZA_TEST_OTHER_PASSWORD

Ejecuta `python scripts/verify-experience.py`. Crea jugadores de prueba y los archiva al terminar,
hace una compra ficticia en esa base y comprueba auditoría, rollback, permisos, restauración,
reintentos concurrentes y conflictos de alineaciones. Nunca lo apuntes a una base productiva,
aunque el backend se ejecute en localhost.

## Si necesitas volver al código anterior

Conserva las nuevas tablas y columnas. Son aditivas: no hace falta borrarlas para volver a desplegar
el commit anterior. No uses DROP TABLE ni restaures encima de Neon una copia antigua solo para
revertir el diseño: perderías cambios recientes. Revisa primero el error del despliegue.
