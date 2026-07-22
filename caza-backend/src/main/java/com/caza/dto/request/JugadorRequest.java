package com.caza.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record JugadorRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 200, message = "El nombre no puede superar 200 caracteres")
        String nombre,

        @NotNull(message = "Los partidos son obligatorios")
        @Min(value = 0, message = "Los partidos no pueden ser negativos")
        Integer partidos,

        @NotNull(message = "Los goles son obligatorios")
        @Min(value = 0, message = "Los goles no pueden ser negativos")
        Integer goles,

        @NotNull(message = "Las asistencias son obligatorias")
        @Min(value = 0, message = "Las asistencias no pueden ser negativas")
        Integer asistencias,

        @DecimalMin(value = "0.0", inclusive = true, message = "El precio debe ser positivo")
        @DecimalMax(value = "500.0", inclusive = true, message = "El precio máximo es 500")
        BigDecimal precio,

        /** URL de imagen del jugador (opcional, se obtiene tras hacer upload) */
        @Size(max = 500, message = "La URL no puede superar 500 caracteres")
        String imagenUrl

        // GA, PG, PA y PGA son columnas GENERATED ALWAYS en PostgreSQL — las calcula Postgres
) {}
