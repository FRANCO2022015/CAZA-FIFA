package com.caza.dto.response;

import java.time.LocalDateTime;

public record MeetingResponse(
        Long id,
        String url,
        LocalDateTime fechaInicio,
        LocalDateTime fechaFin,
        String tema,
        Boolean activo,
        String userName,
        Long userId
) {}
