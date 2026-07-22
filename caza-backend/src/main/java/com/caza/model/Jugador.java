package com.caza.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.math.BigDecimal;

@Entity
@Table(name = "jugadores")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Jugador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String nombre;

    // ── Columnas que el usuario escribe ───────────────────────────────────────

    @Column(nullable = false)
    private Integer partidos;

    @Column(nullable = false)
    private Integer goles;

    @Column(nullable = false)
    private Integer asistencias;

    /** Precio del jugador en el mercado (máximo 500) */
    @Column(nullable = false, precision = 8, scale = 2)
    private BigDecimal precio;

    /** URL de la imagen del jugador (opcional) */
    @Column(length = 500)
    private String imagenUrl;

    // ── Columnas GENERATED ALWAYS en PostgreSQL ───────────────────────────────
    // Postgres las calcula automáticamente a partir de goles/asistencias/partidos.
    // insertable=false + updatable=false → Hibernate nunca las incluye en INSERT/UPDATE.
    // @Generated → Hibernate las re-lee del DB después de cada INSERT/UPDATE.

    /** GA = goles + asistencias */
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(nullable = true, insertable = false, updatable = false)
    private Integer ga;

    /** PG = goles / partidos  (promedio de goles por partido) */
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(nullable = true, precision = 6, scale = 2, insertable = false, updatable = false)
    private BigDecimal pg;

    /** PA = asistencias / partidos  (promedio de asistencias por partido) */
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(nullable = true, precision = 6, scale = 2, insertable = false, updatable = false)
    private BigDecimal pa;

    /** PGA = (goles + asistencias) / partidos */
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(nullable = true, precision = 6, scale = 2, insertable = false, updatable = false)
    private BigDecimal pga;
}
