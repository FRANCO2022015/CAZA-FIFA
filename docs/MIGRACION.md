# CAZA: guía de migración a Neon, Render y Vercel

## 1. Qué está preparado y qué falta

Tu aplicación personal puede probarse con Neon Free para PostgreSQL, Render Free para el backend y Vercel Hobby para el frontend. Para conservar las fotos se añade Cloudinary Free. La base contiene direcciones de imágenes; los archivos JPG están fuera de PostgreSQL y necesitan respaldo y almacenamiento propio.

Se preparó el código local. Todavía NO se publicó en tus cuentas, NO se hizo commit/push y NO se subieron datos ni imágenes a servicios externos. La publicación se realiza siguiendo esta guía. Tener cuentas creadas no concede automáticamente acceso desde este chat.

El repositorio puede seguir privado. Render y Vercel se conectan a GitHub con tu autorización para ese repositorio. Neon recibe el respaldo de PostgreSQL, no el repositorio. Cloudinary recibe las imágenes.

Render construirá el backend usando el Dockerfile incluido. No necesitas instalar Docker ni mantener IntelliJ abierto: Render hace la construcción desde GitHub. El contenedor evita depender de que Render ofrezca Java como entorno nativo. No se ha probado la construcción Docker en esta computadora; sí se verificaron Maven, el JAR ejecutable y el perfil de producción.

## 2. Respaldo real y comprobaciones realizadas

Ubicación del respaldo inicial:

`C:\Users\Franco\Documents\Codex\2026-10-18\que\outputs\respaldo_CAZA_20261018`

Incluye `EFOOTBALL.dump`, esquema SQL, listado del archivo, huellas por tabla, inventario y SHA256 de imágenes, `proyecto-original.zip` y `historial-git.bundle`. El ZIP incluye tu configuración local original: es privado y no debe subirse a GitHub.

Segundo respaldo, creado inmediatamente antes de preparar el esquema local:

`C:\Users\Franco\Documents\Codex\2026-10-18\que\outputs\respaldo_preparacion_final`

Incluye `database.dump`, `fingerprints.json`, `images.csv`, `uploads` y `sha256.json`. Esta es la carpeta que usan los ejemplos siguientes. Ambos respaldos son anteriores a la nueva columna; después de restaurar se aplica `migration-cloud.sql`.

La restauración del respaldo inicial se comprobó en PostgreSQL 16 aislado: las 14 tablas coincidieron en número de filas y hash de su contenido. Se comprobaron 65 referencias de fotos locales, todas presentes, y se respaldaron los 76 archivos existentes, incluso los no referenciados. La base ocupa aproximadamente 9 MB; no es una base grande.

| Tabla | Filas en el respaldo |
|---|---:|
| users | 3 |
| jugadores | 431 |
| players | 31 |
| player_stats | 106 |
| purchases | 3 |
| purchase_players | 2 |
| cart_items | 0 |
| saldo_requests | 1 |
| forum_threads | 1 |
| forum_posts | 2 |
| comments | 2 |
| chat_messages | 1 |
| meetings | 0 |
| songs | 0 |

En tu base local se añadió únicamente `purchases.items_snapshot`, una columna nullable. La comparación posterior confirmó que todos los campos y filas originales se conservaron. No se borraron tablas ni se recrearon usuarios. Esta columna permite guardar cantidades, precios y jugadores de ambos juegos en compras nuevas. Los detalles de compras antiguas que el código anterior nunca guardó no pueden reconstruirse con certeza.

Antes de migrar, copia las dos carpetas de respaldo a otro dispositivo o almacenamiento privado. Un respaldo en el mismo disco no protege frente a averías de ese disco. Los hashes detectan diferencias; no sustituyen una segunda copia.

## 3. Cambios del código

- Configuración `local` separada de `prod`; las claves de nube se leen de variables de entorno. `application-local.yml` conserva la configuración de tu PC y queda fuera de Git y del contexto Docker.
- Hibernate usa `validate`: no crea ni elimina tablas al iniciar. La modificación del esquema se hace explícitamente con `migration-cloud.sql`.
- Se eliminó el inicializador de usuario con contraseña conocida y se desactivaron los datos de ejemplo. En producción se cambia la contraseña del administrador ya restaurado mediante variables de Render.
- Pool de tres conexiones, menos hilos y heap Java máximo de 256 MB. Se retiró WebFlux, que no era necesario.
- Endpoint `/api/health` con consulta a la base, CORS configurable y registro público desactivado por defecto.
- Escrituras de catálogo, estadísticas e imágenes restringidas a ADMIN; validación de cantidades y bloqueo de filas para evitar compras/saldos inconsistentes por concurrencia.
- Historial de nuevas compras con ambos juegos, cantidades y precios conservados; acceso a compras limitado a su propietario o administrador.
- Carga paginada del catálogo y consulta de estadísticas por lotes. El frontend obtiene el saldo real después de operaciones y admite la espera inicial de Render.
- Subidas de imágenes a Cloudinary en producción. Las imágenes locales siguen disponibles en desarrollo.
- Vercel tiene la regla de rutas SPA. Se agregaron exportación/importación de alineaciones guardadas en el navegador y actualización de sus imágenes desde el catálogo actual.
- Scripts `migration.py` para respaldar, restaurar, comparar y preparar la migración de fotos; `smoke.py` para comprobaciones de lectura en la nube.

## 4. Probar localmente y exportar tus alineaciones

La columna nueva ya está aplicada en EFOOTBALL local. Abre el proyecto backend con Java 21 y perfil `local` (es el predeterminado). Conserva `application-local.yml` en tu PC. Para ejecutar sin IntelliJ, desde una PowerShell:

```powershell
cd C:\Users\Franco\Desktop\SIMULACION
$env:JAVA_HOME = 'C:\Program Files\JetBrains\IntelliJ IDEA 2024.2.1\jbr'
& 'C:\Program Files\JetBrains\IntelliJ IDEA 2024.2.1\plugins\maven\lib\maven3\bin\mvn.cmd' -f caza-backend\pom.xml clean verify
cd caza-backend
& "$env:JAVA_HOME\bin\java.exe" -Xms64m -Xmx256m -XX:+UseSerialGC -jar target\caza-backend-1.0.0.jar
```

En otra PowerShell:

```powershell
cd C:\Users\Franco\Desktop\SIMULACION\caza-frontend
npm ci
npm run dev
```

Entra al mismo navegador y dirección local que usabas. Comprueba jugadores y fotos. En el constructor de equipos usa **Exportar mis alineaciones** y conserva el JSON fuera del repositorio. Hazlo con cada cuenta/navegador que tenga equipos guardados. Las alineaciones estaban en `localStorage`, no en PostgreSQL: no están incluidas en el dump y no se transfieren automáticamente a otro dominio. La importación requiere el mismo ID de usuario, que conserva la restauración.

No necesitas dejar esto corriendo permanentemente. Detén ambos procesos con Ctrl+C al terminar. Mientras se haga la migración definitiva no realices compras ni ediciones en la versión local, para que las copias no se separen.

## 5. Commit y GitHub privado

Abre PowerShell en `C:\Users\Franco\Desktop\SIMULACION`.

```powershell
git branch --show-current
git status --short
git diff --stat
git diff --cached --stat
```

Se usa la rama `codex/preparacion-nube`. Se retiraron del índice los archivos que ahora ignora `.gitignore` —principalmente `node_modules`, `target` y archivos generados— conservándolos en disco. Por eso puedes ver muchas eliminaciones preparadas: son limpieza del repositorio, no pérdida de datos de PostgreSQL ni de las fotos.

```powershell
git check-ignore caza-backend/src/main/resources/application-local.yml
git ls-files caza-backend/src/main/resources/application-local.yml
git ls-files caza-backend/target caza-frontend/node_modules
```

El primer comando debe mostrar el archivo ignorado; los siguientes no deben mostrar resultados. No añadas dumps, claves, copias de respaldo ni el JSON de tus alineaciones. Los ejemplos `.env.example` contienen nombres de variables, no claves reales. `VITE_*` es público en el navegador: nunca uses ese prefijo para contraseñas o secretos.

```powershell
git add .gitignore README.md docker-compose.yml migration-cloud.sql scripts docs caza-backend caza-frontend
git add uploads/players/b0b269c5-fe09-4d51-8e12-cce8d654330d.jpg
git diff --cached --check
git diff --cached --stat
git commit -m "Preparar migracion de CAZA a Neon Render Vercel"
git push -u origin codex/preparacion-nube
```

Si GitHub solicita acceso, autentícate normalmente. No pegues tokens en el código. Puedes desplegar esa rama directamente; no es necesario fusionarla a main para probar. Si prefieres main, revisa y fusiona después. Las credenciales antiguas pueden seguir en el historial privado: los secretos de producción deben ser nuevos y distintos; cambiar el archivo actual no borra commits antiguos.

## 6. Elegir el respaldo de corte

Si no has cambiado datos desde la preparación, usa `respaldo_preparacion_final`. Si cambiaste algo, crea un respaldo nuevo **con la app detenida** y utiliza sus archivos en todos los pasos posteriores:

```powershell
cd C:\Users\Franco\Desktop\SIMULACION
$pg = 'C:\Program Files\PostgreSQL\16\bin'
$env:PGHOST='localhost'
$env:PGPORT='5432'
$env:PGUSER='caza_user'
$env:PGDATABASE='EFOOTBALL'
$env:PGSSLMODE='prefer'
python scripts\migration.py --pg-bin $pg backup --output C:\Users\Franco\Documents\Codex\respaldo-caza-corte --uploads .\uploads
```

El script pide la contraseña de PostgreSQL sin mostrarla. La carpeta de destino debe ser nueva; se niega a sobrescribir un respaldo. Usa Python 3; si `python` no está en PATH, reemplázalo por `& 'C:\Program Files\Python310\python.exe'`.

Para los ejemplos siguientes define:

```powershell
$respaldo = 'C:\Users\Franco\Documents\Codex\2026-10-18\que\outputs\respaldo_preparacion_final'
```

Si hiciste uno nuevo, cambia esa ruta. No mezcles un dump antiguo con el CSV o las huellas de otro respaldo.

## 7. Neon: restaurar primero, comparar antes de arrancar

1. Crea un proyecto **Free**; elige PostgreSQL 16 si está disponible y una región cercana a la que usarás en Render.
2. Crea una base vacía, por ejemplo `caza`, en la rama elegida. No conectes aún el backend. No ejecutes `init.sql` ni crees usuarios de muestra.
3. En **Connect** selecciona la base y el rol. Desactiva **Connection pooling** para la restauración. Anota host directo, puerto, base, usuario y contraseña. El host directo no lleva `-pooler`.
4. En la PowerShell del proyecto establece los datos de Neon, reemplazando los valores de ejemplo:

```powershell
$env:PGHOST='HOST_DIRECTO_DE_NEON'
$env:PGPORT='5432'
$env:PGUSER='ROL_DE_NEON'
$env:PGDATABASE='caza'
$env:PGSSLMODE='require'
python scripts\migration.py --pg-bin $pg restore --dump "$respaldo\database.dump"
python scripts\migration.py --pg-bin $pg verify --baseline "$respaldo\fingerprints.json"
```

Cada proceso puede pedir la contraseña. Esto evita guardarla en el historial de PowerShell. La restauración usa una transacción y se niega si existen tablas en `public`; nunca hace `DROP`, `--clean` ni reemplaza una base existente. Ante ese error, crea otra base vacía y vuelve a intentarlo allí.

**Punto de control obligatorio:** debe decir `PASS: all 14 tables match baseline`. Si no coincide, no continúes. Compara antes de cambiar imágenes, añadir columnas o arrancar el administrador. Las secuencias y columnas generadas están incluidas en `pg_dump`; no se exportaron solo filas a CSV.

5. Añade la columna de compras en la copia de Neon:

```powershell
& "$pg\psql.exe" -X -W -v ON_ERROR_STOP=1 -f .\migration-cloud.sql
```

Si el respaldo nuevo ya incluye la columna, el script es idempotente y no la recrea. `-W` pide la contraseña. Confirma que PGHOST sigue siendo Neon antes de cada escritura.

## 8. Cloudinary: preservar las fotos

1. Crea una cuenta **Free**. En su consola localiza **Cloud name**, **API key** y **API secret**. La API secret solo se usa en tu PC y Render.
2. Valida las referencias sin subir nada:

```powershell
python scripts\migration.py images --csv "$respaldo\images.csv" --uploads "$respaldo\uploads\players"
```

Con el respaldo actual debe indicar `65 local references, 65 files`. Si falta un archivo, el proceso se detiene; no reemplaza la imagen por otra ni deja una URL vacía. Los otros 11 archivos físicos también están conservados en el respaldo aunque no estén referenciados.

3. Sube y verifica las imágenes:

```powershell
python scripts\migration.py images --csv "$respaldo\images.csv" --uploads "$respaldo\uploads\players" --upload --output .\migration-private\images
```

El script pide las credenciales, sube cada archivo con un identificador derivado de su SHA256 y guarda un manifiesto reanudable. No modifica la base. Si se interrumpe la red, repite el mismo comando y conserva la carpeta generada. Solo genera el SQL final después de comprobar que las URLs responden como imágenes.

4. Revisa `migration-private/images/apply-images.sql`: solo debe actualizar `imagen_url` de los registros esperados. Aplica una sola vez en Neon:

```powershell
& "$pg\psql.exe" -X -W -v ON_ERROR_STOP=1 -f .\migration-private\images\apply-images.sql
```

El SQL comprueba ID y URL anterior y hace todo dentro de una transacción. Si no coincide un registro, se revierte ese lote. No lo reapliques después de una ejecución exitosa. Conserva `rollback-images.sql`, el manifiesto y los respaldos en privado. No borres las fotos originales. El script de nube de la sección 11 verificará todas las imágenes referenciadas.

## 9. Render: backend desde GitHub

1. **New → Web Service → Git Provider**. Conecta GitHub y autoriza el repositorio privado de SIMULACION.
2. Elige rama `codex/preparacion-nube` (o la rama donde hayas integrado los cambios).
3. Configura **Root Directory: `caza-backend`**, entorno **Docker**, **Dockerfile Path: `./Dockerfile`**, contexto Docker `.` relativo a esa raíz si aparece el campo. No selecciones Static Site.
4. Selecciona instancia **Free** y una región cercana a Neon. No crees una base Render Postgres.
5. Configura **Health Check Path: `/api/health`**. El comando de arranque está en el Dockerfile; no agregues `mvn spring-boot:run`.
6. Añade estas variables antes de desplegar:

| Variable | Valor |
|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://HOST_DIRECTO_NEON:5432/caza?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | Rol de Neon |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de ese rol |
| `APPLICATION_JWT_SECRET` | Secreto aleatorio nuevo, generado abajo |
| `CORS_ALLOWED_ORIGINS` | `https://TU-PROYECTO.vercel.app` sin barra final; luego confirmar dominio real |
| `REGISTRATION_ENABLED` | `false` |
| `CLOUD_ADMIN_EMAIL` | Correo del administrador que existe en la base restaurada; actualmente `admin@caza.com` |
| `CLOUD_ADMIN_PASSWORD` | Contraseña nueva y exclusiva, mínimo 16 caracteres y máximo 72 bytes UTF-8 |
| `CLOUDINARY_CLOUD_NAME` | Cloud name de Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |

La URL JDBC no es una URI `postgresql://usuario:clave@...`: lleva `jdbc:` y usuario/contraseña se suministran por separado. Usamos el host directo con un pool pequeño; no es obligatorio usar el pooler de Neon.

Genera el secreto JWT localmente y pégalo únicamente en Render:

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

Render proporciona `PORT` automáticamente; no hace falta fijarlo. No configures `SERVER_ADDRESS=127.0.0.1` en la nube. No uses `SPRING_JPA_HIBERNATE_DDL_AUTO=create`, `create-drop` ni `update`.

7. Pulsa **Create Web Service/Deploy**. Espera a que la construcción y el inicio terminen. Copia la URL `https://TU-BACKEND.onrender.com`.
8. Abre `https://TU-BACKEND.onrender.com/api/health`: debe responder HTTP 200. También prueba `/api/players?size=1`.

En `prod`, el inicio cambia únicamente la contraseña del administrador existente si no coincide con `CLOUD_ADMIN_PASSWORD`; no crea otro usuario. Los IDs, saldos y demás cuentas se conservan. En posteriores reinicios esa variable vuelve a ser la contraseña de referencia. Para cambiarla, cambia también la variable. Tu contraseña local no fue cambiada.

## 10. Vercel: frontend desde el mismo repo

1. **Add New → Project → Import Git Repository**. Autoriza tu repo privado.
2. Plan personal **Hobby**, **Root Directory: `caza-frontend`**, framework **Vite**, build `npm run build`, output `dist`. Usa la instalación de dependencias del lockfile (`npm ci`).
3. Elige la rama preparada como rama de producción en Project Settings → Git si no es la predeterminada. Revisa que el despliegue seleccionado corresponde al commit nuevo.
4. Añade `VITE_API_BASE_URL=https://TU-BACKEND.onrender.com/api` en Production (y Preview solo si también quieres probar previews).
5. Deploy. Anota el dominio estable de producción `https://TU-PROYECTO.vercel.app`.
6. Vuelve a Render y configura `CORS_ALLOWED_ORIGINS` con ese origen exacto, sin `/api` ni barra final. Guarda y espera el reinicio.
7. Si cambias `VITE_API_BASE_URL`, vuelve a desplegar Vercel: Vite incorpora esa variable al compilar. No basta con cambiarla en el panel.

`vercel.json` permite refrescar las rutas internas. Las URLs de preview de Vercel cambian y no quedan autorizadas automáticamente por CORS; para empezar usa el dominio estable de producción. Si autorizas varios orígenes, sepáralos por comas en Render.

## 11. Comprobación completa de la nube

Primero ejecuta comprobaciones de lectura:

```powershell
python scripts\smoke.py --api https://TU-BACKEND.onrender.com/api --origin https://TU-PROYECTO.vercel.app --email admin@caza.com
```

Pide la contraseña nueva del administrador. Comprueba salud, CORS, páginas del catálogo, todas las URLs de imágenes, acceso, perfil e historial. No compra, no cambia saldo y no crea usuarios. Los conteos esperados inicialmente son 31 FIFA y 431 eFootball.

Después prueba la interfaz en el navegador:

1. Inicia sesión, recarga una ruta interna y confirma que no aparece 404. Cierra sesión y vuelve a entrar.
2. Revisa ambos catálogos, filtros, estadísticas y fotos; compara algunas fichas con la copia local. Confirma que tus tres usuarios y sus saldos están presentes.
3. Abre historial, foro, comentarios y reuniones. Algunos módulos tienen cero registros porque así estaban en la base, no porque se hayan perdido.
4. En constructor de equipos, **Importar alineaciones** con el JSON exportado del mismo usuario. Carga cada equipo y comprueba fotos/posiciones. Los equipos siguen siendo locales al navegador; exporta de nuevo si cambias de dispositivo.
5. Para comprobar escrituras, realiza una operación pequeña y reconocible: añade jugadores de ambos juegos al carrito, cambia cantidades y compra una vez. Confirma descuento exacto, historial con ambos juegos y saldo correcto después de recargar. Esta prueba sí modifica los datos de nube: anota la operación; no uses una compra que no quieras conservar.
6. Prueba una solicitud de saldo y su aprobación solo si quieres conservar esa operación. No repitas compras por un timeout: consulta primero historial y saldo.
7. Como ADMIN, prueba subir una foto a una ficha que quieras actualizar. Confirma que su URL comienza con `https://res.cloudinary.com/`.
8. Reinicia el servicio de Render. Comprueba de nuevo usuarios, historial y fotos, incluida la subida nueva. Esto verifica que los archivos no dependan del disco efímero.
9. Apaga IntelliJ y tu frontend local. Abre Vercel desde el celular: debe seguir funcionando. Tras un rato sin uso, el primer acceso puede tardar mientras Render despierta.

No borres la base local ni sus fotos cuando una primera página cargue bien. Mantén la copia local congelada hasta completar todas las comprobaciones.

## 12. Volver atrás y respaldos posteriores

Si falla el despliegue, puedes seguir usando la copia local con perfil `local`. No apunta a Neon. Si ya realizaste cambios en nube, exporta primero un respaldo de Neon; no restaures el dump antiguo encima porque perderías esas operaciones posteriores.

Para recuperar una base de nube, crea otra base vacía, restaura el respaldo elegido, verifica, aplica la columna si hace falta y actualiza Render para apuntar a ella. No es necesario borrar la base que falló. Para un fallo de código, usa un commit compatible con el esquema y las URLs actuales.

Antes de futuras actualizaciones y con la app sin escrituras, ejecuta `migration.py backup` apuntando a Neon. El parámetro `--uploads` copia archivos locales; **no descarga las fotos nuevas de Cloudinary**. Para respaldarlas usa además la exportación/descarga de originales de Cloudinary y conserva el manifiesto. Las fotos antiguas originales ya están en los respaldos locales. Conserva copias fuera de esta PC y no dependas solo de la retención del plan gratuito.

## 13. Capacidad, límites y pendientes conocidos

La base actual es pequeña y el uso personal permite intentar los planes gratuitos. No se midió la causa exacta de la lentitud de tu PC original: IntelliJ, Maven, PostgreSQL y el navegador compiten por memoria y CPU. La prueba del backend preparado consumió aproximadamente 302 MB de memoria residente en Windows con heap de 256 MB y arrancó en unos 7 segundos; esto no garantiza el mismo consumo o tiempo bajo los límites de Render.

Render Free ofrece recursos limitados, se duerme tras 15 minutos sin tráfico y puede tardar alrededor de un minuto en despertar. Su disco es efímero y tiene cuotas de uso. Para este despliegue no se usa su PostgreSQL gratuito, que tiene caducidad. Consulta los límites vigentes en [Render Free](https://render.com/docs/free) y [planes de cómputo](https://render.com/docs/compute-plans).

Neon publica actualmente 1 GB y 100 CU-horas mensuales por proyecto en Free, por encima del tamaño de esta base, aunque el consumo depende del tiempo activo. Comprueba el panel y las condiciones de [Neon](https://neon.com/pricing). Vercel Hobby está orientado a uso personal no comercial; revisa [sus condiciones y cuotas](https://vercel.com/docs/plans/hobby). Cloudinary tiene almacenamiento, transformaciones y transferencia limitados por plan: revisa [Cloudinary Free](https://cloudinary.com/pricing). No es una promesa de alojamiento ilimitado ni permanente sin cambios de condiciones.

La preparación incluye correcciones de dependencias compatibles. El último `npm audit` todavía informó 11 hallazgos (5 moderados y 6 altos) relacionados con el árbol de Vite/esbuild, Tailwind/braces y React Router, cuyas correcciones propuestas implican cambios de versión mayor. No se ejecutó `npm audit fix --force`: esa actualización y sus pruebas quedan pendientes. El backend Spring Boot 3.2.3 también necesita una revisión de actualización separada. Estas pruebas funcionales no son una auditoría de seguridad exhaustiva. Mantén el registro deshabilitado y el repo privado; no confundas eso con protección de los endpoints públicos de catálogo.

Queda por comprobar en tus cuentas: construcción Docker real, límites de memoria en Render, subida efectiva a Cloudinary, restauración en Neon, funcionamiento visual y navegación real en Vercel. No se presentan como pruebas ya realizadas.

## 14. Errores frecuentes

| Síntoma | Qué revisar |
|---|---|
| `Schema-validation: missing column items_snapshot` | Aplicar migration-cloud.sql a la base correcta. |
| Falla de autenticación PostgreSQL | Host/base/rol/clave de Neon, SSL y ausencia de espacios al copiar. |
| Error de administrador al iniciar | Restauración previa, correo de un ADMIN existente y contraseña de 16 caracteres o más. |
| Health 200 pero frontend falla | VITE_API_BASE_URL con `/api`, recompilar Vercel y origen CORS exacto. |
| Fotos apuntan a localhost | Falta aplicar el SQL generado por images en Neon; no volver a subir a ciegas. |
| Fotos nuevas fallan | Tres variables Cloudinary y permisos del usuario ADMIN. |
| 401 al entrar | Contraseña de nube, sesión antigua o token expirado; iniciar sesión de nuevo. |
| 403 al editar | Cuenta sin ADMIN o registro deshabilitado; no quitar permisos para resolverlo. |
| Primera carga lenta | Abrir health, esperar a que Render despierte y reintentar lectura. |
| Reinicios por memoria | Revisar métricas/logs Render; la prueba local no asegura el límite de nube. |
| Restauración rechazada por tablas existentes | Crear otra base vacía; no limpiar la existente. |

La secuencia de aceptación es: respaldo → restauración idéntica → esquema → fotos verificadas → backend → frontend → pruebas desde otro dispositivo → conservar copias y empezar a usar la nube como versión principal.
