package com.caza.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "player_stats")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String temporada;

    @Builder.Default
    @Column(nullable = false)
    private Integer goles = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer asistencias = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer partidosJugados = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;
}
