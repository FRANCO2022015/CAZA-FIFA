package com.caza.dto.response;

import com.caza.model.Position;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlayerResponse {

    private Long id;
    private String nombre;
    private String nacionalidad;
    private Position posicion;
    private Integer edad;
    private BigDecimal precio;
    private String imagenUrl;
    private Boolean activo;
    private List<PlayerStatsResponse> stats;
}
