package com.caza.service.interfaces;

import com.caza.dto.request.PlayerStatsRequest;
import com.caza.dto.response.PlayerStatsResponse;

import java.util.List;

public interface PlayerStatsService {

    List<PlayerStatsResponse> getByPlayer(Long playerId);

    PlayerStatsResponse addStats(Long playerId, PlayerStatsRequest request);

    PlayerStatsResponse updateStats(Long statsId, Long playerId, PlayerStatsRequest request);

    void deleteStats(Long statsId, Long playerId);
}
