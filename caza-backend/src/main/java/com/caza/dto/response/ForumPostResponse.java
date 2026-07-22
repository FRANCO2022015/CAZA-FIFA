package com.caza.dto.response;

import java.time.LocalDateTime;

public record ForumPostResponse(
        Long id,
        String contenido,
        LocalDateTime fechaPublicacion,
        Boolean activo,
        String userName,
        Long userId,
        Long threadId
) {}
