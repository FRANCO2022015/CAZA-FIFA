package com.caza.controller;

import com.caza.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/upload")
@Tag(name = "Image Upload", description = "Endpoint para subir imágenes de jugadores")
public class ImageUploadController {

    /** Directorio donde se guardan las imágenes (relativo al directorio de trabajo). */
    private static final String UPLOAD_DIR = "uploads/players";

    /** Tamaño máximo permitido: 10 MB */
    private static final long MAX_SIZE_BYTES = 10 * 1024 * 1024;

    /** Extensiones permitidas */
    private static final List<String> ALLOWED_EXTENSIONS = List.of("jpg", "jpeg", "png", "webp");

    @PostMapping(value = "/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Subir imagen de jugador (JPG/PNG, máx 5 MB, recomendado 400×400px)")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) throws IOException {

        // ── Validaciones ──────────────────────────────────────────────────────
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("El archivo está vacío"));
        }

        if (file.getSize() > MAX_SIZE_BYTES) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("El archivo supera el límite de 5 MB"));
        }

        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename();
        String ext = originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.') + 1).toLowerCase()
                : "";

        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Solo se permiten archivos JPG, PNG o WebP"));
        }

        // ── Guardar archivo ───────────────────────────────────────────────────
        Path uploadPath = Paths.get(UPLOAD_DIR);
        Files.createDirectories(uploadPath);

        String filename = UUID.randomUUID() + "." + ext;
        Path destination = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);

        // ── Construir URL pública ─────────────────────────────────────────────
        String baseUrl = request.getScheme() + "://" + request.getServerName()
                + ":" + request.getServerPort();
        String imageUrl = baseUrl + "/uploads/players/" + filename;

        log.info("Imagen subida: {}", destination.toAbsolutePath());

        return ResponseEntity.ok(ApiResponse.success(
                "Imagen subida correctamente",
                Map.of("url", imageUrl)
        ));
    }
}
