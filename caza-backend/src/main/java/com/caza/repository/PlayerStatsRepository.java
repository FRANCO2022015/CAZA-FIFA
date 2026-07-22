package com.caza.repository;

import com.caza.model.PlayerStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerStatsRepository extends JpaRepository<PlayerStats, Long> {

    List<PlayerStats> findByPlayerId(Long playerId);

    Optional<PlayerStats> findByIdAndPlayerId(Long id, Long playerId);
}
