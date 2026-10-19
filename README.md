# CAZA

Aplicación personal de catálogo, estadísticas, compras con saldo, foro y alineaciones de fútbol FIFA/eFootball.

Backend: Java 21 / Spring Boot 3.2 / PostgreSQL. Frontend: React / TypeScript / Vite.

La guía completa de preparación, respaldo, restauración y despliegue está en [docs/MIGRACION.md](docs/MIGRACION.md).

Antes de arrancar esta versión, aplicar `migration-cloud.sql` a la base restaurada (o local). Hibernate solo valida el esquema; no crea ni borra tablas. No hay usuario ni contraseña por defecto.

Configuración de nube: `caza-backend/.env.example` y `caza-frontend/.env.example`. Las variables se configuran en Render y Vercel; nunca se suben claves reales a Git. El perfil local conserva su configuración en `application-local.yml`, ignorado por Git.

Pruebas: `mvn clean verify` dentro de caza-backend; `npm ci` y `npm run build` dentro de caza-frontend. No requieren conectar a la base original.
