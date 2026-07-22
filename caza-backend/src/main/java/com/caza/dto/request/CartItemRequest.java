package com.caza.dto.request;

import jakarta.validation.constraints.Min;

/**
 * Request para agregar al carrito.
 * Exactamente uno de playerId o jugadorId debe estar presente.
 */
public record CartItemRequest(
        Long playerId,   // FIFA — puede ser null si es eFootball

        Long jugadorId,  // eFootball — puede ser null si es FIFA

        @Min(value = 1, message = "La cantidad debe ser al menos 1")
        Integer cantidad
) {
    public CartItemRequest {
        if (playerId == null && jugadorId == null) {
            throw new IllegalArgumentException("Se requiere playerId o jugadorId");
        }
        if (playerId != null && jugadorId != null) {
            throw new IllegalArgumentException("Solo se puede especificar playerId o jugadorId, no ambos");
        }
        if (cantidad == null) cantidad = 1;
    }
}
