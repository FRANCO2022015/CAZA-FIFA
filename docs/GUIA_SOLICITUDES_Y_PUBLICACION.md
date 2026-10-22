# Publicar solicitudes, permisos y diseño

## 1. Neon: antes de hacer push

En SQL Editor selecciona la rama/base usada por Render (anteriormente production/neondb). Copia y ejecuta todo `docs/migrations/003_player_change_requests.sql`. Debe completar COMMIT. No borra datos ni restaura un respaldo sobre la nube. Si falla, no despliegues; conserva el error para revisarlo.

Comprobación de solo lectura:

```sql
SELECT to_regclass('public.player_change_requests');
```

Debe devolver `player_change_requests`. La tabla comienza sin solicitudes. Si no habías aplicado `002_experience.sql`, aplícala primero.

## 2. Commit y publicación sobre la rama actual

```powershell
cd C:\Users\Franco\Desktop\SIMULACION
git status
git branch --show-current
git diff --check
git add caza-backend/src caza-frontend/src README.md docs .github/workflows/verify.yml scripts/verify-player-requests.py scripts/verify-player-requests-ui.cjs
git diff --cached --stat
git commit -m "Agregar solicitudes de cambios, permisos y renovar interfaz y documentacion"
git push origin codex/preparacion-nube
```

Este último comando supone que `git branch --show-current` devolvió `codex/preparacion-nube`. Si Git abre el resumen en un paginador, `q` lo cierra. Si hay errores, no sigas con los siguientes comandos.

Espera Render Live y Vercel Ready del nuevo commit. Si el autodespliegue está desactivado, despliega ese commit manualmente. Mantén los servicios y sus variables actuales. No necesitas otro proyecto en Neon, Render o Vercel. `REGISTRATION_ENABLED` conserva el valor que tú hayas elegido.

## 3. Comprobar los dos roles

- Registro: escribe nombre, correo y contraseñas; confirma que los iconos no pisan el texto. No aparece Gemini.
- Usuario normal: no debe ver Agregar/Editar/Archivar. Puede consultar, comprar, guardar equipos y proponer cambios desde la ficha de un jugador.
- Envía una propuesta con un motivo: el valor del jugador no debe cambiar todavía.
- Como administrador, abre Solicitudes: revisa el antes/propuesto y aprueba. Comprueba el cambio y el historial/PDF. Rechazar otra propuesta debe conservar el valor del jugador.
- Abre Mis solicitudes con la cuenta normal: debe mostrar la resolución y respuesta del administrador, y no propuestas de otros usuarios.
- Conflictos: si un administrador modifica el mismo campo antes de aprobar, la propuesta antigua debe rechazarse con aviso de conflicto, sin sobrescribir. Se puede rechazar la solicitud y enviar una nueva.
- Comprueba catálogo y ficha en teléfono y escritorio. Los datos, fotos y alineaciones previas siguen en sus servicios originales.

## 4. Integrar en main después de comprobar esta versión

No se ha cambiado la rama de producción ni se ha hecho un commit automáticamente: estos pasos se ejecutan después de guardar los cambios anteriores. La referencia local de main estaba detrás de la rama de trabajo; se debe actualizar antes de fusionar.

```powershell
git fetch origin
git switch main
git pull --ff-only origin main
git merge --ff-only codex/preparacion-nube
git push origin main
```

Si `--ff-only` falla, las ramas han divergido. No uses reset, force push ni borres una rama: revisa la divergencia y prepara un pull request para integrar sin perder cambios. Si GitHub exige un PR, utilízalo en lugar de un push directo a main.

Después de publicar main:

1. GitHub: confirma que main sea la rama predeterminada del repositorio.
2. Render, servicio existente: configura main como rama de despliegue y despliega su último commit.
3. Vercel, proyecto existente: configura main como rama de producción y comprueba un despliegue Production / Ready del mismo commit.
4. Abre https://caza-fifa.vercel.app y repite las comprobaciones anteriores. El dominio puede seguir siendo el mismo al conservar el proyecto.
5. Conserva la rama anterior hasta confirmar ambos despliegues. No es necesario borrarla para que main funcione.

La captura antigua de Vercel mostraba main/6779466 fallido. Al desplegar debe seleccionarse el commit nuevo, no reintentar aquel commit antiguo.

Si prefieres llamar `fifa` a la rama principal, se puede preparar ese cambio aparte. Esta guía adopta main, la recomendación aprobada, y evita renombrar una rama que Render/Vercel todavía estén usando.
