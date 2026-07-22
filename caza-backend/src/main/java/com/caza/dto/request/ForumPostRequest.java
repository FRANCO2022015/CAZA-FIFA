package com.caza.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ForumPostRequest(
        @NotBlank(message = "Content is required")
        @Size(max = 2000, message = "Post content cannot exceed 2000 characters")
        String contenido
) {}
