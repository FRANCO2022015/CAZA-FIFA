package com.caza.service.impl;

import com.caza.dto.request.PlayerRequest;
import com.caza.dto.response.PagedResponse;
import com.caza.dto.response.PlayerResponse;
import com.caza.dto.response.PlayerStatsResponse;
import com.caza.exception.ResourceNotFoundException;
import com.caza.model.Player;
import com.caza.model.PlayerStats;
import com.caza.model.Position;
import com.caza.repository.PlayerRepository;
import com.caza.repository.PlayerStatsRepository;
import com.caza.service.interfaces.PlayerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PlayerServiceImpl implements PlayerService {

    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository playerStatsRepository;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PlayerResponse> getAll(int page, int size, String sortBy, String sortDir) {
        return search(null, null, null, null, null, page, size, sortBy, sortDir);
    }

    @Override
    @Transactional(readOnly = true)
    public PlayerResponse getById(Long id) {
        Player player = playerRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", id));
        return mapToResponse(player);
    }

    @Override
    public PlayerResponse create(PlayerRequest request) {
        Player player = Player.builder()
                .nombre(request.nombre())
                .nacionalidad(request.nacionalidad())
                .posicion(request.posicion())
                .edad(request.edad())
                .precio(request.precio())
                .imagenUrl(request.imagenUrl())
                .activo(true)
                .build();
        Player saved = playerRepository.save(player);
        log.info("Player created: {} (id={})", saved.getNombre(), saved.getId());
        return mapToResponse(saved);
    }

    @Override
    public PlayerResponse update(Long id, PlayerRequest request) {
        Player player = playerRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", id));

        player.setNombre(request.nombre());
        player.setNacionalidad(request.nacionalidad());
        player.setPosicion(request.posicion());
        player.setEdad(request.edad());
        player.setPrecio(request.precio());
        if (request.imagenUrl() != null) {
            player.setImagenUrl(request.imagenUrl());
        }

        Player saved = playerRepository.save(player);
        log.info("Player updated: {} (id={})", saved.getNombre(), saved.getId());
        return mapToResponse(saved);
    }

    @Override
    public PlayerResponse updateImagen(Long id, String imagenUrl) {
        Player player = playerRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", id));
        player.setImagenUrl(imagenUrl);
        Player saved = playerRepository.save(player);
        log.info("Player imagen updated: {} (id={})", saved.getNombre(), saved.getId());
        return mapToResponse(saved);
    }

    @Override
    public void delete(Long id) {
        Player player = playerRepository.findByIdAndActivoTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", id));
        player.setActivo(false);
        playerRepository.save(player);
        log.info("Player soft-deleted: {} (id={})", player.getNombre(), player.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<PlayerResponse> search(
            String nombre,
            Position posicion,
            String nacionalidad,
            BigDecimal minPrecio,
            BigDecimal maxPrecio,
            int page,
            int size,
            String sortBy,
            String sortDir) {

        Pageable pageable;
        Page<Player> players;
        boolean isDesc = sortDir != null && sortDir.equalsIgnoreCase("desc");
        String posicionStr = posicion != null ? posicion.name() : null;

        if ("goles".equalsIgnoreCase(sortBy)) {
            pageable = PageRequest.of(page, size);
            players = isDesc
                    ? playerRepository.searchPlayersOrderByGolesDesc(nombre, posicionStr, nacionalidad, minPrecio, maxPrecio, pageable)
                    : playerRepository.searchPlayersOrderByGolesAsc(nombre, posicionStr, nacionalidad, minPrecio, maxPrecio, pageable);
        } else if ("asistencias".equalsIgnoreCase(sortBy)) {
            pageable = PageRequest.of(page, size);
            players = isDesc
                    ? playerRepository.searchPlayersOrderByAsistenciasDesc(nombre, posicionStr, nacionalidad, minPrecio, maxPrecio, pageable)
                    : playerRepository.searchPlayersOrderByAsistenciasAsc(nombre, posicionStr, nacionalidad, minPrecio, maxPrecio, pageable);
        } else {
            String cleanSortBy = (sortBy == null || sortBy.isBlank()) ? "nombre" : sortBy;
            Sort sort = isDesc ? Sort.by(cleanSortBy).descending() : Sort.by(cleanSortBy).ascending();
            pageable = PageRequest.of(page, size, sort);
            players = playerRepository.searchPlayers(nombre, posicionStr, nacionalidad, minPrecio, maxPrecio, pageable);
        }

        Page<PlayerResponse> responses = players.map(this::mapToResponse);
        return PagedResponse.of(responses);
    }

    private PlayerResponse mapToResponse(Player player) {
        List<PlayerStats> stats = playerStatsRepository.findByPlayerId(player.getId());
        List<PlayerStatsResponse> statsResponses = stats.stream()
                .map(s -> new PlayerStatsResponse(
                        s.getId(),
                        s.getTemporada(),
                        s.getGoles(),
                        s.getAsistencias(),
                        s.getPartidosJugados(),
                        player.getId()
                ))
                .toList();

        return PlayerResponse.builder()
                .id(player.getId())
                .nombre(player.getNombre())
                .nacionalidad(player.getNacionalidad())
                .posicion(player.getPosicion())
                .edad(player.getEdad())
                .precio(player.getPrecio())
                .imagenUrl(player.getImagenUrl())
                .activo(player.getActivo())
                .stats(statsResponses)
                .build();
    }
}
