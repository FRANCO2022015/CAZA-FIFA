package com.caza.dto.request;

import com.caza.model.Position;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record PlayerRequest(
        @NotBlank(message = "El nombre del jugador es obligatorio")
        String nombre,

        @NotBlank(message = "La nacionalidad es obligatoria")
        String nacionalidad,

        @NotNull(message = "La posición es obligatoria")
        Position posicion,

        @NotNull(message = "La edad es obligatoria")
        @Min(value = 16, message = "El jugador debe tener al menos 16 años")
        @Max(value = 45, message = "La edad no puede superar 45 años")
        Integer edad,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.0", inclusive = true, message = "El precio debe ser positivo")
        @DecimalMax(value = "500.0", inclusive = true, message = "El precio máximo para jugadores FIFA es 500")
        BigDecimal precio,

        String imagenUrl
) {}
