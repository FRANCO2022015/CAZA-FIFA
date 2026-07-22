package com.caza.controller;

import com.caza.dto.request.SaldoRequestDTO;
import com.caza.dto.response.ApiResponse;
import com.caza.dto.response.SaldoRequestResponse;
import com.caza.service.impl.SaldoRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saldo-requests")
@RequiredArgsConstructor
@Tag(name = "Solicitudes de Saldo", description = "Usuarios piden saldo, admins aprueban")
public class SaldoRequestController {

    private final SaldoRequestService service;

    // ── Usuario ────────────────────────────────────────────────────────────────

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Crear solicitud de saldo (usuario autenticado)")
    public ResponseEntity<ApiResponse<SaldoRequestResponse>> create(
            @Valid @RequestBody SaldoRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Solicitud enviada", service.create(dto)));
    }

    @GetMapping("/mine")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Mis solicitudes de saldo")
    public ResponseEntity<ApiResponse<List<SaldoRequestResponse>>> getMine() {
        return ResponseEntity.ok(ApiResponse.success(service.getMine()));
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Todas las solicitudes (Admin)")
    public ResponseEntity<ApiResponse<List<SaldoRequestResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(service.getAll()));
    }

    @GetMapping("/pendientes")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Solicitudes pendientes (Admin)")
    public ResponseEntity<ApiResponse<List<SaldoRequestResponse>>> getPendientes() {
        return ResponseEntity.ok(ApiResponse.success(service.getPendientes()));
    }

    @PutMapping("/{id}/aprobar")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Aprobar solicitud y añadir saldo (Admin)")
    public ResponseEntity<ApiResponse<SaldoRequestResponse>> aprobar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Solicitud aprobada — saldo actualizado", service.aprobar(id)));
    }

    @PutMapping("/{id}/rechazar")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Rechazar solicitud (Admin)")
    public ResponseEntity<ApiResponse<SaldoRequestResponse>> rechazar(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Solicitud rechazada", service.rechazar(id)));
    }
}
