package com.caza.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Ítem del carrito. Puede contener un jugador FIFA (player) o un jugador
 * eFootball (jugador). Exactamente uno de los dos debe estar presente.
 */
@Entity
@Table(name = "cart_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    @Column(nullable = false)
    private Integer cantidad = 1;

    @Column(nullable = false, updatable = false)
    private LocalDateTime fechaAgregado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Jugador FIFA — nullable para permitir jugadores eFootball en el mismo carrito */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "player_id", nullable = true)
    private Player player;

    /** Jugador eFootball — nullable para permitir jugadores FIFA en el mismo carrito */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "jugador_id", nullable = true)
    private Jugador jugador;

    @PrePersist
    protected void onCreate() {
        this.fechaAgregado = LocalDateTime.now();
    }
}
