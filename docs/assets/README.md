# Recorte de ejemplo

`osimhen-cutout.png` es un ejemplo con canal alfa preparado con la herramienta integrada de imágenes.
La fotografía original en uploads/players no se reemplazó.
Revísalo visualmente antes de utilizarlo: un recorte generado puede reinterpretar detalles.

Uso: editar Osimhen > Recorte para holograma > subir este PNG > Guardar todos los cambios.
La subida irá al proveedor configurado (Cloudinary en producción). No se subió a la nube durante esta implementación.
Para otros jugadores, subir un PNG/WebP con fondo transparente en el mismo campo.

Prompt utilizado:
Use case: background-extraction. Edit target: the supplied photo of Osimhen.
Remove only the stadium, spectators and all background, leaving a clean transparent PNG
cutout of the single foreground player. Preserve his actual face, mask, hair, red/yellow
jersey, shorts, markings, pose and visible body exactly as photographed. Do not invent legs
or any body outside the crop. Crop canvas around the player with small transparent margins.
No added glow, rings, text, shadow, platform or background; these are provided by CSS in the app.
Production asset for an optional hologram-photo view.
