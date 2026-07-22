package com.caza.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JugadorResponse {

    private Long id;
    private String nombre;
    private Integer partidos;
    private Integer goles;
    private Integer asistencias;
    private BigDecimal precio;
    private String imagenUrl;
    private Integer ga;
    private BigDecimal pg;
    private BigDecimal pa;
    private BigDecimal pga;
}
