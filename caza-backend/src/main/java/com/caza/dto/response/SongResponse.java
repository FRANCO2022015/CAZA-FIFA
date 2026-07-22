package com.caza.dto.response;

public record SongResponse(
        Long id,
        String titulo,
        String artista,
        String album,
        String genero,
        Integer anio,
        String duracion,
        Boolean activo
) {}
