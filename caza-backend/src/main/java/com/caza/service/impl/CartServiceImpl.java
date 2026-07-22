package com.caza.service.impl;

import com.caza.dto.request.CartItemRequest;
import com.caza.dto.response.CartItemResponse;
import com.caza.dto.response.CartResponse;
import com.caza.dto.response.PlayerResponse;
import com.caza.exception.ResourceNotFoundException;
import com.caza.exception.UnauthorizedException;
import com.caza.model.CartItem;
import com.caza.model.Jugador;
import com.caza.model.Player;
import com.caza.model.User;
import com.caza.repository.CartItemRepository;
import com.caza.repository.JugadorRepository;
import com.caza.repository.PlayerRepository;
import com.caza.repository.UserRepository;
import com.caza.service.interfaces.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final PlayerRepository  playerRepository;
    private final JugadorRepository jugadorRepository;
    private final UserRepository    userRepository;

    @Override
    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {
        List<CartItem> items = cartItemRepository.findByUserId(userId);
        return buildCartResponse(items);
    }

    @Override
    public CartResponse addItem(Long userId, CartItemRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (request.jugadorId() != null) {
            // ── eFootball jugador ──────────────────────────────────────────
            Jugador jugador = jugadorRepository.findById(request.jugadorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Jugador", "id", request.jugadorId()));

            Optional<CartItem> existing = cartItemRepository.findByUserIdAndJugadorId(userId, request.jugadorId());
            if (existing.isPresent()) {
                CartItem item = existing.get();
                item.setCantidad(item.getCantidad() + request.cantidad());
                cartItemRepository.save(item);
            } else {
                cartItemRepository.save(CartItem.builder()
                        .user(user)
                        .jugador(jugador)
                        .cantidad(request.cantidad())
                        .build());
            }
        } else {
            // ── FIFA player ────────────────────────────────────────────────
            Player player = playerRepository.findById(request.playerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Player", "id", request.playerId()));

            Optional<CartItem> existing = cartItemRepository.findByUserIdAndPlayerId(userId, request.playerId());
            if (existing.isPresent()) {
                CartItem item = existing.get();
                item.setCantidad(item.getCantidad() + request.cantidad());
                cartItemRepository.save(item);
            } else {
                cartItemRepository.save(CartItem.builder()
                        .user(user)
                        .player(player)
                        .cantidad(request.cantidad())
                        .build());
            }
        }

        return getCart(userId);
    }

    @Override
    public CartResponse updateItem(Long userId, Long itemId, Integer cantidad) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));
        if (!item.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("No tienes permisos para modificar este item");
        }
        item.setCantidad(cantidad);
        cartItemRepository.save(item);
        return getCart(userId);
    }

    @Override
    public CartResponse removeItem(Long userId, Long itemId) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("CartItem", "id", itemId));
        if (!item.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("No tienes permisos para eliminar este item");
        }
        cartItemRepository.delete(item);
        return getCart(userId);
    }

    @Override
    public void clearCart(Long userId) {
        cartItemRepository.deleteByUserId(userId);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private CartResponse buildCartResponse(List<CartItem> items) {
        List<CartItemResponse> itemResponses = items.stream()
                .map(this::mapItemToResponse)
                .toList();
        BigDecimal total = itemResponses.stream()
                .map(CartItemResponse::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return CartResponse.builder()
                .items(itemResponses)
                .total(total)
                .itemCount(items.size())
                .build();
    }

    private CartItemResponse mapItemToResponse(CartItem item) {
        if (item.getJugador() != null) {
            // ── ítem eFootball ─────────────────────────────────────────────
            Jugador j = item.getJugador();
            BigDecimal precio   = j.getPrecio() != null ? j.getPrecio() : BigDecimal.ZERO;
            BigDecimal subtotal = precio.multiply(BigDecimal.valueOf(item.getCantidad()));

            PlayerResponse jugadorAsPlayer = PlayerResponse.builder()
                    .id(j.getId())
                    .nombre(j.getNombre())
                    .nacionalidad("eFootball")
                    .posicion(null)
                    .edad(0)
                    .precio(precio)
                    .imagenUrl(null)
                    .activo(true)
                    .build();

            return CartItemResponse.builder()
                    .id(item.getId())
                    .cantidad(item.getCantidad())
                    .fechaAgregado(item.getFechaAgregado())
                    .player(jugadorAsPlayer)
                    .subtotal(subtotal)
                    .build();
        } else {
            // ── ítem FIFA ──────────────────────────────────────────────────
            Player p = item.getPlayer();
            BigDecimal subtotal = p.getPrecio().multiply(BigDecimal.valueOf(item.getCantidad()));
            PlayerResponse playerResponse = PlayerResponse.builder()
                    .id(p.getId())
                    .nombre(p.getNombre())
                    .nacionalidad(p.getNacionalidad())
                    .posicion(p.getPosicion())
                    .edad(p.getEdad())
                    .precio(p.getPrecio())
                    .imagenUrl(p.getImagenUrl())
                    .activo(p.getActivo())
                    .build();
            return CartItemResponse.builder()
                    .id(item.getId())
                    .cantidad(item.getCantidad())
                    .fechaAgregado(item.getFechaAgregado())
                    .player(playerResponse)
                    .subtotal(subtotal)
                    .build();
        }
    }
}
