package com.caza.dto.response;

import java.time.LocalDateTime;

public record ChatResponse(
        Long id,
        String pregunta,
        String respuestaIA,
        LocalDateTime fecha,
        Long userId
) {}
