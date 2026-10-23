package com.caza.service.impl;

import com.caza.dto.request.JugadorRequest;
import com.caza.model.Jugador;
import com.caza.repository.JugadorRepository;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JugadorPositionTest {
    private JugadorRequest request(String position) {
        return new JugadorRequest("Jugador", 90, 25, 137, new BigDecimal("500"), null, null, position);
    }

    @Test void onlyConfiguredPositionsAreAccepted() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (String position : List.of("PO","DEF","LI","LD","MC","MCD","MO","MDI","MDD","EXI","EXD","DC","SD","")) {
                assertTrue(validator.validate(request(position)).isEmpty(), position);
            }
            assertTrue(validator.validate(request(null)).isEmpty());
            for (String position : List.of("DELANTERO","POR","del"," DC ","CUSTOM")) {
                assertFalse(validator.validate(request(position)).isEmpty(), position);
            }
        }
    }

    @Test void createReturnsSelectedPosition() {
        var repository = mock(JugadorRepository.class);
        when(repository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        var response = new JugadorServiceImpl(repository).create(request("LD"));
        assertEquals("LD", response.getPosicion());
        assertEquals(90, response.getPartidos());
    }

    @Test void updatePersistsPositionAndOlderClientPreservesIt() {
        var repository = mock(JugadorRepository.class);
        var player = Jugador.builder().id(1L).nombre("Jugador").posicion("DEF").imagenUrl("https://example.test/photo.png").build();
        when(repository.findByIdAndActivoTrue(1L)).thenReturn(Optional.of(player));
        when(repository.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        var service = new JugadorServiceImpl(repository);
        assertEquals("LD", service.update(1L, request("LD")).getPosicion());
        assertEquals("LD", service.update(1L, request(null)).getPosicion());
        assertEquals("https://example.test/photo.png", player.getImagenUrl());
        assertNull(service.update(1L, request("")).getPosicion());
    }
}
