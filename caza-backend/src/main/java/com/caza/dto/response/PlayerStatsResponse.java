package com.caza.dto.response;

public record PlayerStatsResponse(
        Long id,
        String temporada,
        Integer goles,
        Integer asistencias,
        Integer partidosJugados,
        Long playerId
) {}
