package com.caza.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SongRequest(
        @NotBlank(message = "Song title is required")
        String titulo,

        @NotBlank(message = "Artist name is required")
        String artista,

        String album,

        @NotBlank(message = "Genre is required")
        String genero,

        @NotNull(message = "Year is required")
        Integer anio,

        String duracion
) {}
