# Publicar posiciones eFootball

## 1. Neon, antes del push
En el SQL Editor selecciona la base de datos y rama que usa tu backend de Render. Copia y ejecuta todo el contenido de `docs/migrations/004_efootball_position.sql`.

La migración añade una columna opcional y restringe sus valores. No modifica fotos, estadísticas ni jugadores FIFA. Se puede ejecutar de nuevo. Los jugadores existentes quedan sin posición hasta que un administrador la seleccione.

## 2. GitHub
Desde PowerShell en C:\Users\Franco\Desktop\SIMULACION:

```powershell
git status
git add .
git diff --cached --stat
git commit -m "Corregir fotos y agregar posiciones eFootball y ajustes de Sonar"
git push origin main
```

`git add .` incluye también las correcciones de Sonar pendientes de la revisión anterior. Revisa el resumen antes de confirmar. Pulsa `q` si Git abre el visor del resumen.

## 3. Render y Vercel
Este cambio requiere publicar tanto backend como frontend. Si ambos tienen despliegue automático desde main, espera a que termine cada despliegue. En caso contrario, despliega el último commit de main desde los paneles de ambos servicios. Conserva las variables de entorno existentes.

## 4. Verificar
Abre https://caza-fifa.vercel.app con una cuenta administradora. En eFootball revisa una foto vertical: debe verse completa, con espacio lateral si hace falta. Abre Editar y selecciona una posición; guarda y recarga. La etiqueta debe conservarse.

Colores: EXI/EXD/DC/SD verdes; MC/MCD/MO/MDI/MDD amarillos; DEF/LI/LD azules; PO rojo. Sin posición se muestra gris. El selector también aparece al crear jugadores. Los usuarios normales no pueden editar directamente. FIFA conserva sus posiciones y temporadas.

## Validación local
Compilación del frontend y pruebas del backend correctas. Migración ejecutada dos veces en una base local de prueba: conserva los 439 jugadores y deja las posiciones sin asignar. No se ha ejecutado esta migración en Neon desde esta tarea.
