package com.caza.service.impl;

import com.caza.dto.request.JugadorRequest;
import com.caza.dto.response.JugadorResponse;
import com.caza.dto.response.PagedResponse;
import com.caza.exception.ResourceNotFoundException;
import com.caza.model.Jugador;
import com.caza.repository.JugadorRepository;
import com.caza.service.interfaces.JugadorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class JugadorServiceImpl implements JugadorService {

    private final JugadorRepository jugadorRepository;

    // ─── Lectura ──────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<JugadorResponse> getAll(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Jugador> jugadores = jugadorRepository.findAll(pageable);
        return PagedResponse.of(jugadores.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public JugadorResponse getById(Long id) {
        Jugador jugador = jugadorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jugador", "id", id));
        return mapToResponse(jugador);
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<JugadorResponse> search(String nombre, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Jugador> jugadores = jugadorRepository.searchJugadores(nombre, pageable);
        return PagedResponse.of(jugadores.map(this::mapToResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<JugadorResponse> searchAdvanced(
            String nombre,
            Integer minGoles, Integer maxGoles,
            Integer minAsist, Integer maxAsist,
            Integer minPartidos, Integer maxPartidos,
            Integer minGa,
            java.math.BigDecimal minPg,
            java.math.BigDecimal minPa,
            java.math.BigDecimal minPga,
            int page, int size, String sortBy, String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Jugador> jugadores = jugadorRepository.searchAdvanced(
                nombre,
                minGoles, maxGoles,
                minAsist, maxAsist,
                minPartidos, maxPartidos,
                minGa, minPg, minPa, minPga,
                pageable
        );
        return PagedResponse.of(jugadores.map(this::mapToResponse));
    }

    // ─── Escritura ────────────────────────────────────────────────────────────

    @Override
    public JugadorResponse create(JugadorRequest request) {
        // Solo escribimos las columnas normales: nombre, partidos, goles, asistencias, precio, imagenUrl.
        // ga, pg, pa y pga son GENERATED ALWAYS en PostgreSQL — las calcula Postgres sola.
        Jugador jugador = Jugador.builder()
                .nombre(request.nombre())
                .partidos(request.partidos())
                .goles(request.goles())
                .asistencias(request.asistencias())
                .precio(request.precio() != null ? request.precio() : new java.math.BigDecimal("500.00"))
                .imagenUrl(request.imagenUrl())
                .build();
        Jugador saved = jugadorRepository.save(jugador);
        log.info("Jugador eFootball creado: {} (id={})", saved.getNombre(), saved.getId());
        return mapToResponse(saved);
    }

    @Override
    public JugadorResponse update(Long id, JugadorRequest request) {
        Jugador jugador = jugadorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jugador", "id", id));

        // Solo actualizamos las columnas normales.
        // Postgres recalcula ga/pg/pa/pga automáticamente al hacer el UPDATE.
        jugador.setNombre(request.nombre());
        jugador.setPartidos(request.partidos());
        jugador.setGoles(request.goles());
        jugador.setAsistencias(request.asistencias());
        if (request.precio() != null) {
            jugador.setPrecio(request.precio());
        }
        // imagenUrl: null = mantener la anterior; string vacío = borrar; URL = actualizar
        if (request.imagenUrl() != null) {
            jugador.setImagenUrl(request.imagenUrl().isBlank() ? null : request.imagenUrl());
        }

        Jugador saved = jugadorRepository.save(jugador);
        log.info("Jugador eFootball actualizado: {} (id={})", saved.getNombre(), saved.getId());
        return mapToResponse(saved);
    }

    @Override
    public void delete(Long id) {
        Jugador jugador = jugadorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Jugador", "id", id));
        jugadorRepository.delete(jugador);
        log.info("Jugador eFootball eliminado: {} (id={})", jugador.getNombre(), jugador.getId());
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private JugadorResponse mapToResponse(Jugador j) {
        return JugadorResponse.builder()
                .id(j.getId())
                .nombre(j.getNombre())
                .partidos(j.getPartidos())
                .goles(j.getGoles())
                .asistencias(j.getAsistencias())
                .precio(j.getPrecio())
                .imagenUrl(j.getImagenUrl())
                // ga/pg/pa/pga vienen del @Generated — Hibernate los lee de Postgres
                .ga(j.getGa())
                .pg(j.getPg())
                .pa(j.getPa())
                .pga(j.getPga())
                .build();
    }
}
