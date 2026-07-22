package com.caza.dto.response;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        String contenido,
        Integer rating,
        LocalDateTime fecha,
        Boolean activo,
        String userName,
        Long userId,
        Long playerId
) {}
