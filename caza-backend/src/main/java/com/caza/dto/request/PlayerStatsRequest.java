package com.caza.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record PlayerStatsRequest(
        @NotBlank(message = "Season is required")
        String temporada,

        @NotNull(message = "Goals is required")
        @Min(value = 0, message = "Goals cannot be negative")
        Integer goles,

        @NotNull(message = "Assists is required")
        @Min(value = 0, message = "Assists cannot be negative")
        Integer asistencias,

        @NotNull(message = "Matches played is required")
        @Min(value = 0, message = "Matches played cannot be negative")
        Integer partidosJugados
) {}
