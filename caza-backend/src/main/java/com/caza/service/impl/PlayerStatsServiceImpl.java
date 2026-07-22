package com.caza.service.impl;

import com.caza.dto.request.PlayerStatsRequest;
import com.caza.dto.response.PlayerStatsResponse;
import com.caza.exception.ResourceNotFoundException;
import com.caza.model.Player;
import com.caza.model.PlayerStats;
import com.caza.repository.PlayerRepository;
import com.caza.repository.PlayerStatsRepository;
import com.caza.service.interfaces.PlayerStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PlayerStatsServiceImpl implements PlayerStatsService {

    private final PlayerStatsRepository playerStatsRepository;
    private final PlayerRepository playerRepository;

    @Override
    @Transactional(readOnly = true)
    public List<PlayerStatsResponse> getByPlayer(Long playerId) {
        // Ensure player exists
        playerRepository.findByIdAndActivoTrue(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", playerId));

        return playerStatsRepository.findByPlayerId(playerId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public PlayerStatsResponse addStats(Long playerId, PlayerStatsRequest request) {
        Player player = playerRepository.findByIdAndActivoTrue(playerId)
                .orElseThrow(() -> new ResourceNotFoundException("Player", "id", playerId));

        PlayerStats stats = PlayerStats.builder()
                .temporada(request.temporada())
                .goles(request.goles())
                .asistencias(request.asistencias())
                .partidosJugados(request.partidosJugados())
                .player(player)
                .build();

        PlayerStats saved = playerStatsRepository.save(stats);
        log.info("Stats added for player {} (season: {})", playerId, request.temporada());
        return mapToResponse(saved);
    }

    @Override
    public PlayerStatsResponse updateStats(Long statsId, Long playerId, PlayerStatsRequest request) {
        PlayerStats stats = playerStatsRepository.findByIdAndPlayerId(statsId, playerId)
                .orElseThrow(() -> new ResourceNotFoundException("PlayerStats", "id", statsId));

        stats.setTemporada(request.temporada());
        stats.setGoles(request.goles());
        stats.setAsistencias(request.asistencias());
        stats.setPartidosJugados(request.partidosJugados());

        PlayerStats saved = playerStatsRepository.save(stats);
        log.info("Stats updated: statsId={}, playerId={}", statsId, playerId);
        return mapToResponse(saved);
    }

    @Override
    public void deleteStats(Long statsId, Long playerId) {
        PlayerStats stats = playerStatsRepository.findByIdAndPlayerId(statsId, playerId)
                .orElseThrow(() -> new ResourceNotFoundException("PlayerStats", "id", statsId));
        playerStatsRepository.delete(stats);
        log.info("Stats deleted: statsId={}, playerId={}", statsId, playerId);
    }

    private PlayerStatsResponse mapToResponse(PlayerStats stats) {
        return new PlayerStatsResponse(
                stats.getId(),
                stats.getTemporada(),
                stats.getGoles(),
                stats.getAsistencias(),
                stats.getPartidosJugados(),
                stats.getPlayer().getId()
        );
    }
}
