package com.caza.repository;

import com.caza.model.Player;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long>, JpaSpecificationExecutor<Player> {

    Page<Player> findByActivoTrue(Pageable pageable);

    Optional<Player> findByIdAndActivoTrue(Long id);

    @Query(value = """
            SELECT p FROM Player p
            WHERE p.activo = true
            AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            AND (:posicion IS NULL OR CAST(p.posicion AS string) = :posicion)
            AND (:nacionalidad IS NULL OR LOWER(p.nacionalidad) LIKE LOWER(CONCAT('%', CAST(:nacionalidad AS string), '%')))
            AND (:minPrecio IS NULL OR p.precio >= :minPrecio)
            AND (:maxPrecio IS NULL OR p.precio <= :maxPrecio)
            """,
            countQuery = """
            SELECT COUNT(p) FROM Player p
            WHERE p.activo = true
            AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            AND (:posicion IS NULL OR CAST(p.posicion AS string) = :posicion)
            AND (:nacionalidad IS NULL OR LOWER(p.nacionalidad) LIKE LOWER(CONCAT('%', CAST(:nacionalidad AS string), '%')))
            AND (:minPrecio IS NULL OR p.precio >= :minPrecio)
            AND (:maxPrecio IS NULL OR p.precio <= :maxPrecio)
            """)
    Page<Player> searchPlayers(
            @Param("nombre") String nombre,
            @Param("posicion") String posicion,
            @Param("nacionalidad") String nacionalidad,
            @Param("minPrecio") BigDecimal minPrecio,
            @Param("maxPrecio") BigDecimal maxPrecio,
            Pageable pageable
    );

    @Query(value = """
            SELECT p FROM Player p
            LEFT JOIN p.stats s
            WHERE p.activo = true
            AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            AND (:posicion IS NULL OR CAST(p.posicion AS string) = :posicion)
            AND (:nacionalidad IS NULL OR LOWER(p.nacionalidad) LIKE LOWER(CONCAT('%', CAST(:nacionalidad AS string), '%')))
            AND (:minPrecio IS NULL OR p.precio >= :minPrecio)
            AND (:maxPrecio IS NULL OR p.precio <= :maxPrecio)
            GROUP BY p.id, p.nombre, p.nacionalidad, p.posicion, p.edad, p.precio, p.imagenUrl, p.activo
            ORDER BY SUM(COALESCE(s.goles, 0)) DESC
            """,
            countQuery = """
            SELECT COUNT(p) FROM Player p
            WHERE p.activo = true
            AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            AND (:posicion IS NULL OR CAST(p.posicion AS string) = :posicion)
            AND (:nacionalidad IS NULL OR LOWER(p.nacionalidad) LIKE LOWER(CONCAT('%', CAST(:nacionalidad AS string), '%')))
            AND (:minPrecio IS NULL OR p.precio >= :minPrecio)
            AND (:maxPrecio IS NULL OR p.precio <= :maxPrecio)
            """)
    Page<Player> searchPlayersOrderByGolesDesc(
            @Param("nombre") String nombre,
            @Param("posicion") String posicion,
            @Param("nacionalidad") String nacionalidad,
            @Param("minPrecio") BigDecimal minPrecio,
            @Param("maxPrecio") BigDecimal maxPrecio,
            Pageable pageable
    );

    @Query(value = """
            SELECT p FROM Player p
            LEFT JOIN p.stats s
            WHERE p.activo = true
            AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            AND (:posicion IS NULL OR CAST(p.posicion AS string) = :posicion)
            AND (:nacionalidad IS NULL OR LOWER(p.nacionalidad) LIKE LOWER(CONCAT('%', CAST(:nacionalidad AS string), '%')))
            AND (:minPrecio IS NULL OR p.precio >= :minPrecio)
            AND (:maxPrecio IS NULL OR p.precio <= :maxPrecio)
            GROUP BY p.id, p.nombre, p.nacionalidad, p.posicion, p.edad, p.precio, p.imagenUrl, p.activo
            ORDER BY SUM(COALESCE(s.goles, 0)) ASC
            """,
            countQuery = """
            SELECT COUNT(p) FROM Player p
            WHERE p.activo = true
            AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            AND (:posicion IS NULL OR CAST(p.posicion AS string) = :posicion)
            AND (:nacionalidad IS NULL OR LOWER(p.nacionalidad) LIKE LOWER(CONCAT('%', CAST(:nacionalidad AS string), '%')))
            AND (:minPrecio IS NULL OR p.precio >= :minPrecio)
            AND (:maxPrecio IS NULL OR p.precio <= :maxPrecio)
            """)
    Page<Player> searchPlayersOrderByGolesAsc(
            @Param("nombre") String nombre,
            @Param("posicion") String posicion,
            @Param("nacionalidad") String nacionalidad,
            @Param("minPrecio") BigDecimal minPrecio,
            @Param("maxPrecio") BigDecimal maxPrecio,
            Pageable pageable
    );

    @Query(value = """
            SELECT p FROM Player p
            LEFT JOIN p.stats s
            WHERE p.activo = true
            AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            AND (:posicion IS NULL OR CAST(p.posicion AS string) = :posicion)
            AND (:nacionalidad IS NULL OR LOWER(p.nacionalidad) LIKE LOWER(CONCAT('%', CAST(:nacionalidad AS string), '%')))
            AND (:minPrecio IS NULL OR p.precio >= :minPrecio)
            AND (:maxPrecio IS NULL OR p.precio <= :maxPrecio)
            GROUP BY p.id, p.nombre, p.nacionalidad, p.posicion, p.edad, p.precio, p.imagenUrl, p.activo
            ORDER BY SUM(COALESCE(s.asistencias, 0)) DESC
            """,
            countQuery = """
            SELECT COUNT(p) FROM Player p
            WHERE p.activo = true
            AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            AND (:posicion IS NULL OR CAST(p.posicion AS string) = :posicion)
            AND (:nacionalidad IS NULL OR LOWER(p.nacionalidad) LIKE LOWER(CONCAT('%', CAST(:nacionalidad AS string), '%')))
            AND (:minPrecio IS NULL OR p.precio >= :minPrecio)
            AND (:maxPrecio IS NULL OR p.precio <= :maxPrecio)
            """)
    Page<Player> searchPlayersOrderByAsistenciasDesc(
            @Param("nombre") String nombre,
            @Param("posicion") String posicion,
            @Param("nacionalidad") String nacionalidad,
            @Param("minPrecio") BigDecimal minPrecio,
            @Param("maxPrecio") BigDecimal maxPrecio,
            Pageable pageable
    );

    @Query(value = """
            SELECT p FROM Player p
            LEFT JOIN p.stats s
            WHERE p.activo = true
            AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            AND (:posicion IS NULL OR CAST(p.posicion AS string) = :posicion)
            AND (:nacionalidad IS NULL OR LOWER(p.nacionalidad) LIKE LOWER(CONCAT('%', CAST(:nacionalidad AS string), '%')))
            AND (:minPrecio IS NULL OR p.precio >= :minPrecio)
            AND (:maxPrecio IS NULL OR p.precio <= :maxPrecio)
            GROUP BY p.id, p.nombre, p.nacionalidad, p.posicion, p.edad, p.precio, p.imagenUrl, p.activo
            ORDER BY SUM(COALESCE(s.asistencias, 0)) ASC
            """,
            countQuery = """
            SELECT COUNT(p) FROM Player p
            WHERE p.activo = true
            AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', CAST(:nombre AS string), '%')))
            AND (:posicion IS NULL OR CAST(p.posicion AS string) = :posicion)
            AND (:nacionalidad IS NULL OR LOWER(p.nacionalidad) LIKE LOWER(CONCAT('%', CAST(:nacionalidad AS string), '%')))
            AND (:minPrecio IS NULL OR p.precio >= :minPrecio)
            AND (:maxPrecio IS NULL OR p.precio <= :maxPrecio)
            """)
    Page<Player> searchPlayersOrderByAsistenciasAsc(
            @Param("nombre") String nombre,
            @Param("posicion") String posicion,
            @Param("nacionalidad") String nacionalidad,
            @Param("minPrecio") BigDecimal minPrecio,
            @Param("maxPrecio") BigDecimal maxPrecio,
            Pageable pageable
    );

    @Query("SELECT p FROM Player p WHERE p.activo = true ORDER BY p.precio DESC")
    List<Player> findTop5ByActivoTrueOrderByPrecioDesc(Pageable pageable);
}
