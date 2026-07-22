package com.caza.controller;

import com.caza.dto.request.PlayerStatsRequest;
import com.caza.dto.response.ApiResponse;
import com.caza.dto.response.PlayerStatsResponse;
import com.caza.service.interfaces.PlayerStatsService;
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
@RequiredArgsConstructor
@Tag(name = "Player Stats", description = "Player statistics endpoints")
public class PlayerStatsController {

    private final PlayerStatsService playerStatsService;

    @GetMapping("/api/players/{playerId}/stats")
    public ResponseEntity<ApiResponse<List<PlayerStatsResponse>>> getByPlayer(@PathVariable Long playerId) {
        return ResponseEntity.ok(ApiResponse.success(playerStatsService.getByPlayer(playerId)));
    }

    @PostMapping("/api/players/{playerId}/stats")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PlayerStatsResponse>> addStats(
            @PathVariable Long playerId,
            @Valid @RequestBody PlayerStatsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Estadísticas añadidas", playerStatsService.addStats(playerId, request)));
    }

    @PutMapping("/api/players/{playerId}/stats/{statsId}")
    @SecurityRequirement(name = "bearerAuth")
    public ResponseEntity<ApiResponse<PlayerStatsResponse>> updateStats(
            @PathVariable Long playerId,
            @PathVariable Long statsId,
            @Valid @RequestBody PlayerStatsRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Estadísticas actualizadas", playerStatsService.updateStats(statsId, playerId, request)));
    }

    @DeleteMapping("/api/players/{playerId}/stats/{statsId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteStats(
            @PathVariable Long playerId,
            @PathVariable Long statsId) {
        playerStatsService.deleteStats(statsId, playerId);
        return ResponseEntity.ok(ApiResponse.success("Estadísticas eliminadas", null));
    }
}
