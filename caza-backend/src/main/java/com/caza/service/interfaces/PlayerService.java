package com.caza.service.interfaces;

import com.caza.dto.request.PlayerRequest;
import com.caza.dto.response.PagedResponse;
import com.caza.dto.response.PlayerResponse;
import com.caza.model.Position;

import java.math.BigDecimal;

public interface PlayerService {

    PagedResponse<PlayerResponse> getAll(int page, int size, String sortBy, String sortDir);

    PlayerResponse getById(Long id);

    PlayerResponse create(PlayerRequest request);

    PlayerResponse update(Long id, PlayerRequest request);

    PlayerResponse updateImagen(Long id, String imagenUrl);

    void delete(Long id);

    PagedResponse<PlayerResponse> search(
            String nombre,
            Position posicion,
            String nacionalidad,
            BigDecimal minPrecio,
            BigDecimal maxPrecio,
            int page,
            int size,
            String sortBy,
            String sortDir
    );
}
