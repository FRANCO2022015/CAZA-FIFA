package com.caza.controller;

import com.caza.dto.request.PlayerRequest;
import com.caza.dto.response.ApiResponse;
import com.caza.dto.response.PagedResponse;
import com.caza.dto.response.PlayerResponse;
import com.caza.model.Position;
import com.caza.service.interfaces.PlayerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/players")
@RequiredArgsConstructor
@Tag(name = "Players", description = "Player management endpoints")
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping
    @Operation(summary = "Get all active players (paginated)")
    public ResponseEntity<ApiResponse<PagedResponse<PlayerResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "nombre") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(ApiResponse.success(playerService.getAll(page, size, sortBy, sortDir)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get player by ID")
    public ResponseEntity<ApiResponse<PlayerResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(playerService.getById(id)));
    }

    @GetMapping("/search")
    @Operation(summary = "Search players by filters")
    public ResponseEntity<ApiResponse<PagedResponse<PlayerResponse>>> search(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) Position posicion,
            @RequestParam(required = false) String nacionalidad,
            @RequestParam(required = false) BigDecimal minPrecio,
            @RequestParam(required = false) BigDecimal maxPrecio,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "nombre") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        return ResponseEntity.ok(ApiResponse.success(
                playerService.search(nombre, posicion, nacionalidad, minPrecio, maxPrecio, page, size, sortBy, sortDir)
        ));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new player (authenticated users)")
    public ResponseEntity<ApiResponse<PlayerResponse>> create(@Valid @RequestBody PlayerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Jugador creado exitosamente", playerService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update a player (Admin only)")
    public ResponseEntity<ApiResponse<PlayerResponse>> update(
            @PathVariable Long id, @Valid @RequestBody PlayerRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Jugador actualizado", playerService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Soft-delete a player (Admin only)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        playerService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Jugador eliminado", null));
    }

    /**
     * PATCH /api/players/{id}/imagen
     * Permite actualizar SOLO la imagen del jugador sin tocar el resto de los campos.
     * Accesible para cualquier usuario autenticado (mismo permiso que crear stats).
     */
    @PatchMapping("/{id}/imagen")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Actualizar solo la imagen de un jugador FIFA")
    public ResponseEntity<ApiResponse<PlayerResponse>> updateImagen(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        PlayerResponse updated = playerService.updateImagen(id, body.get("imagenUrl"));
        return ResponseEntity.ok(ApiResponse.success("Imagen actualizada", updated));
    }
}
