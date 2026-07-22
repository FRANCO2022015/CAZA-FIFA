package com.caza.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record MeetingRequest(
        @NotBlank(message = "Meeting URL is required")
        String url,

        @NotNull(message = "Start date/time is required")
        LocalDateTime fechaInicio,

        @NotNull(message = "End date/time is required")
        LocalDateTime fechaFin,

        @NotBlank(message = "Meeting topic is required")
        String tema
) {}
