package com.caza.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "saldo_requests")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class SaldoRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Monto que el usuario solicita */
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal montoSolicitado;

    /** Mensaje opcional del usuario explicando por qué */
    @Column(length = 500)
    private String mensaje;

    /** Estado: PENDIENTE, APROBADA, RECHAZADA */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EstadoSolicitud estado = EstadoSolicitud.PENDIENTE;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime fechaSolicitud = LocalDateTime.now();

    /** Fecha en que el admin tomó acción */
    private LocalDateTime fechaRespuesta;

    public enum EstadoSolicitud {
        PENDIENTE, APROBADA, RECHAZADA
    }
}
