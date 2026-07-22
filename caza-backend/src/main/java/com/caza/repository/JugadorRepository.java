package com.caza.repository;

import com.caza.model.Jugador;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;

@Repository
public interface JugadorRepository extends JpaRepository<Jugador, Long> {

    Page<Jugador> findByNombreContainingIgnoreCase(String nombre, Pageable pageable);

    @Query("""
            SELECT j FROM Jugador j
            WHERE (:nombre IS NULL OR LOWER(j.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            """)
    Page<Jugador> searchJugadores(
            @Param("nombre") String nombre,
            Pageable pageable
    );

    @Query(value = """
            SELECT j FROM Jugador j
            WHERE (:nombre      IS NULL OR LOWER(j.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
              AND (:minGoles     IS NULL OR j.goles       >= :minGoles)
              AND (:maxGoles     IS NULL OR j.goles       <= :maxGoles)
              AND (:minAsist     IS NULL OR j.asistencias >= :minAsist)
              AND (:maxAsist     IS NULL OR j.asistencias <= :maxAsist)
              AND (:minPartidos  IS NULL OR j.partidos    >= :minPartidos)
              AND (:maxPartidos  IS NULL OR j.partidos    <= :maxPartidos)
              AND (:minGa        IS NULL OR j.ga          >= :minGa)
              AND (:minPg        IS NULL OR j.pg          >= :minPg)
              AND (:minPa        IS NULL OR j.pa          >= :minPa)
              AND (:minPga       IS NULL OR j.pga         >= :minPga)
            """,
            countQuery = """
            SELECT COUNT(j) FROM Jugador j
            WHERE (:nombre      IS NULL OR LOWER(j.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
              AND (:minGoles     IS NULL OR j.goles       >= :minGoles)
              AND (:maxGoles     IS NULL OR j.goles       <= :maxGoles)
              AND (:minAsist     IS NULL OR j.asistencias >= :minAsist)
              AND (:maxAsist     IS NULL OR j.asistencias <= :maxAsist)
              AND (:minPartidos  IS NULL OR j.partidos    >= :minPartidos)
              AND (:maxPartidos  IS NULL OR j.partidos    <= :maxPartidos)
              AND (:minGa        IS NULL OR j.ga          >= :minGa)
              AND (:minPg        IS NULL OR j.pg          >= :minPg)
              AND (:minPa        IS NULL OR j.pa          >= :minPa)
              AND (:minPga       IS NULL OR j.pga         >= :minPga)
            """)
    Page<Jugador> searchAdvanced(
            @Param("nombre")      String nombre,
            @Param("minGoles")    Integer minGoles,
            @Param("maxGoles")    Integer maxGoles,
            @Param("minAsist")    Integer minAsist,
            @Param("maxAsist")    Integer maxAsist,
            @Param("minPartidos") Integer minPartidos,
            @Param("maxPartidos") Integer maxPartidos,
            @Param("minGa")       Integer minGa,
            @Param("minPg")       BigDecimal minPg,
            @Param("minPa")       BigDecimal minPa,
            @Param("minPga")      BigDecimal minPga,
            Pageable pageable
    );
}
