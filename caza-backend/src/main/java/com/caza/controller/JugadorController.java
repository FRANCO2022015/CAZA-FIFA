package com.caza.controller;

import com.caza.dto.request.JugadorRequest;
import com.caza.dto.response.ApiResponse;
import com.caza.dto.response.JugadorResponse;
import com.caza.dto.response.PagedResponse;
import com.caza.service.interfaces.JugadorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jugadores")
@RequiredArgsConstructor
@Tag(name = "Jugadores eFootball", description = "Gestión de jugadores de la sección eFootball")
public class JugadorController {

    private final JugadorService jugadorService;

    // ─── Lectura (autenticado) ─────────────────────────────────────────────

    @GetMapping
    @Operation(summary = "Listar todos los jugadores eFootball (paginado)")
    public ResponseEntity<ApiResponse<PagedResponse<JugadorResponse>>> getAll(
            @RequestParam(defaultValue = "0")      int page,
            @RequestParam(defaultValue = "12")     int size,
            @RequestParam(defaultValue = "nombre") String sortBy,
            @RequestParam(defaultValue = "asc")    String sortDir) {
        return ResponseEntity.ok(ApiResponse.success(
                jugadorService.getAll(page, size, sortBy, sortDir)
        ));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener jugador eFootball por ID")
    public ResponseEntity<ApiResponse<JugadorResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(jugadorService.getById(id)));
    }

    @GetMapping("/search")
    @Operation(summary = "Buscar jugadores eFootball por nombre con ordenamiento")
    public ResponseEntity<ApiResponse<PagedResponse<JugadorResponse>>> search(
            @RequestParam(required = false)        String nombre,
            @RequestParam(defaultValue = "0")      int page,
            @RequestParam(defaultValue = "12")     int size,
            @RequestParam(defaultValue = "nombre") String sortBy,
            @RequestParam(defaultValue = "asc")    String sortDir) {
        return ResponseEntity.ok(ApiResponse.success(
                jugadorService.search(nombre, page, size, sortBy, sortDir)
        ));
    }

    @GetMapping("/search/advanced")
    @Operation(summary = "Búsqueda avanzada de jugadores eFootball con filtros de rango")
    public ResponseEntity<ApiResponse<PagedResponse<JugadorResponse>>> searchAdvanced(
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) Integer minGoles,
            @RequestParam(required = false) Integer maxGoles,
            @RequestParam(required = false) Integer minAsist,
            @RequestParam(required = false) Integer maxAsist,
            @RequestParam(required = false) Integer minPartidos,
            @RequestParam(required = false) Integer maxPartidos,
            @RequestParam(required = false) Integer minGa,
            @RequestParam(required = false) java.math.BigDecimal minPg,
            @RequestParam(required = false) java.math.BigDecimal minPa,
            @RequestParam(required = false) java.math.BigDecimal minPga,
            @RequestParam(defaultValue = "0")      int page,
            @RequestParam(defaultValue = "12")     int size,
            @RequestParam(defaultValue = "nombre") String sortBy,
            @RequestParam(defaultValue = "asc")    String sortDir) {
        return ResponseEntity.ok(ApiResponse.success(
                jugadorService.searchAdvanced(
                        nombre,
                        minGoles, maxGoles,
                        minAsist, maxAsist,
                        minPartidos, maxPartidos,
                        minGa, minPg, minPa, minPga,
                        page, size, sortBy, sortDir
                )
        ));
    }

    // ─── Escritura (usuarios autenticados pueden crear) ───────────────────

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Agregar jugador eFootball (usuario autenticado)")
    public ResponseEntity<ApiResponse<JugadorResponse>> create(
            @Valid @RequestBody JugadorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Jugador creado exitosamente", jugadorService.create(request)));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Actualizar jugador eFootball (usuario autenticado)")
    public ResponseEntity<ApiResponse<JugadorResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody JugadorRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Jugador actualizado", jugadorService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Eliminar jugador eFootball (solo Admin)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        jugadorService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Jugador eliminado", null));
    }
}
