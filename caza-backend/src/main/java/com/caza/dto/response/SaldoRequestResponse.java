package com.caza.dto.response;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SaldoRequestResponse {
    private Long id;
    private Long userId;
    private String userName;
    private String userCorreo;
    private BigDecimal montoSolicitado;
    private String mensaje;
    private String estado;
    private LocalDateTime fechaSolicitud;
    private LocalDateTime fechaRespuesta;
}
