# Correcciones de seguridad y fiabilidad — 2026-10-23

## Cambios

- Migración: las imágenes se seleccionan de un inventario de archivos reales del directorio autorizado; se rechazan nombres con separadores, enlaces simbólicos y archivos ausentes.
- URLs: verificación estricta de HTTPS, dominio Cloudinary, cuenta en la migración y ruta de imagen. Se deshabilitan redirecciones de las herramientas para no saltar a destinos sin validar. El smoke test de imágenes admite ahora únicamente URLs directas de Cloudinary.
- Firma de cargas de la utilidad de migración: SHA-256, compatible con la API de Cloudinary. No se ha vuelto a ejecutar una carga ni una migración sobre producción.
- Pruebas de solicitudes: rutas permitidas explícitas y servidor exclusivamente local.
- Sesión: no se persiste ni se usa el perfil/rol de localStorage. Al recargar, la identidad se obtiene de /auth/me antes de autorizar la navegación. El token tiene validación de formato y longitud; su firma y permisos siguen siendo responsabilidad del backend. El JWT sigue almacenado en localStorage: esto no sustituye una protección frente a XSS ni implementa cookies HttpOnly.
- UI: etiquetas asociadas, botones con tipo explícito, control de carga operable con teclado, enlaces nativos en tarjetas, eliminación de listeners redundantes, manejo de errores en cargas y formateo numérico sin regex.
- Imágenes nuevas: 7 MB por archivo y 8 MB por solicitud; límite coherente entre frontend, servicio y configuración multipart. Las imágenes existentes no se modifican.
- npm ci --ignore-scripts en CI y Dockerfile frontend. La instalación y build funcionan sin scripts de instalación.
- Python 3.10 en .sonarcloud.properties y en el nuevo job de pruebas de scripts.

## Validación local

- npm ci --ignore-scripts y npm run build: correctos.
- Maven test: 7 pruebas, sin fallos ni errores.
- unittest de scripts: 4 pruebas con múltiples entradas adversarias; correctas.
- Navegador Edge con API simulada: rol ADMIN falsificado en caché ignorado, login administrador correcto, perfil inválido rechazado, token malformado rechazado; sin errores JavaScript.
- Sintaxis Python y git diff --check: correctos.

## Publicación y alcance

No requiere SQL, migraciones de datos ni cambios de variables en Neon. Publicar los cambios en main y comprobar Render, Vercel y un nuevo análisis de SonarCloud. Solo ese nuevo análisis puede confirmar el Quality Gate; las incidencias no se han marcado como aceptadas ni se han excluido archivos para ocultarlas.

La instalación npm informó además 8 vulnerabilidades de dependencias (6 moderadas y 2 altas). No se han actualizado paquetes en esta corrección: requieren revisar npm audit y compatibilidad por separado.

## Segunda revisión de incidencias

- Salidas de migración limitadas a cuatro nombres fijos, comprobación de carpeta y enlaces, escritura temporal exclusiva y reemplazo atómico. Los datos del CSV no determinan nombres de salida.
- Verificación de imágenes mediante conexión HTTPS a res.cloudinary.com fijo, ruta validada y rechazo de redirecciones. No se envían credenciales a esas comprobaciones.
- Login administrador integrado con AuthContext, con verificación de rol antes de persistir la sesión. Eliminada la implementación duplicada del almacenamiento en la página.
- Tipo submit del registro, promesas del constructor de equipos y Number.parseFloat corregidos.
- Archivos de pruebas declarados en sonar.tests con inclusiones y separación de fuentes; no se desactivan reglas de seguridad.
- Validación: build frontend correcto, 6 pruebas Python aprobadas y 1 omitida por permisos de enlaces simbólicos en Windows; 4 escenarios de sesión en navegador con API simulada. No se ejecutaron migraciones ni peticiones a producción.

Esta revisión solo requiere publicar frontend y código para el análisis; no cambia el backend ni el esquema de Neon. El Quality Gate debe confirmarse con un nuevo análisis remoto.
