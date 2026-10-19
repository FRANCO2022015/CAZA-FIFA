package com.caza.dto.request;
import jakarta.validation.constraints.*;
public record CartQuantityRequest(@NotNull @Min(1) @Max(100) Integer cantidad) {}
