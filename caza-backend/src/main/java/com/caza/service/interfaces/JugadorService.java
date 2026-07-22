package com.caza.service.interfaces;

import com.caza.dto.request.JugadorRequest;
import com.caza.dto.response.JugadorResponse;
import com.caza.dto.response.PagedResponse;

import java.math.BigDecimal;

public interface JugadorService {

    PagedResponse<JugadorResponse> getAll(int page, int size, String sortBy, String sortDir);

    JugadorResponse getById(Long id);

    JugadorResponse create(JugadorRequest request);

    JugadorResponse update(Long id, JugadorRequest request);

    void delete(Long id);

    PagedResponse<JugadorResponse> search(String nombre, int page, int size, String sortBy, String sortDir);

    PagedResponse<JugadorResponse> searchAdvanced(
            String nombre,
            Integer minGoles, Integer maxGoles,
            Integer minAsist, Integer maxAsist,
            Integer minPartidos, Integer maxPartidos,
            Integer minGa,
            BigDecimal minPg,
            BigDecimal minPa,
            BigDecimal minPga,
            int page, int size, String sortBy, String sortDir
    );
}
