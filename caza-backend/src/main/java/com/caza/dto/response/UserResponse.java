package com.caza.dto.response;

import com.caza.model.Role;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String nombre,
        String correo,
        Role rol,
        BigDecimal saldo,
        LocalDateTime fechaRegistro,
        Boolean activo
) {}
