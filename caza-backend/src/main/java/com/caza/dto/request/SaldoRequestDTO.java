package com.caza.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record SaldoRequestDTO(

        @NotNull(message = "El monto es obligatorio")
        @DecimalMin(value = "1.0", inclusive = true, message = "El monto mínimo es 1")
        @DecimalMax(value = "100000.0", inclusive = true, message = "El monto máximo por solicitud es 100.000")
        BigDecimal montoSolicitado,

        @Size(max = 500, message = "El mensaje no puede superar 500 caracteres")
        String mensaje
) {}
