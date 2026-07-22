package com.caza.service.impl;

import com.caza.dto.response.PlayerResponse;
import com.caza.dto.response.PurchaseResponse;
import com.caza.exception.InsufficientBalanceException;
import com.caza.exception.ResourceNotFoundException;
import com.caza.model.CartItem;
import com.caza.model.Jugador;
import com.caza.model.Player;
import com.caza.model.Purchase;
import com.caza.model.User;
import com.caza.repository.CartItemRepository;
import com.caza.repository.PurchaseRepository;
import com.caza.repository.UserRepository;
import com.caza.service.interfaces.PurchaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class PurchaseServiceImpl implements PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;

    @Override
    public PurchaseResponse checkout(Long userId) {
        List<CartItem> cartItems = cartItemRepository.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw new IllegalStateException("El carrito está vacío");
        }

        // Calcular total soportando tanto jugadores FIFA (player) como eFootball (jugador)
        BigDecimal total = cartItems.stream()
                .map(item -> getPrecioItem(item).multiply(BigDecimal.valueOf(item.getCantidad())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getSaldo().compareTo(total) < 0) {
            throw new InsufficientBalanceException(
                    "Saldo insuficiente. Necesitas $" + total + " pero tienes $" + user.getSaldo()
            );
        }

        user.setSaldo(user.getSaldo().subtract(total));
        userRepository.save(user);

        // Separar jugadores FIFA de eFootball para guardar en Purchase
        List<Player> players = cartItems.stream()
                .filter(item -> item.getPlayer() != null)
                .map(CartItem::getPlayer)
                .toList();

        Purchase purchase = Purchase.builder()
                .user(user)
                .players(players)
                .precioTotal(total)
                .build();
        purchase = purchaseRepository.save(purchase);

        cartItemRepository.deleteByUserId(userId);

        return mapToResponse(purchase, cartItems);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseResponse> getUserPurchases(Long userId) {
        return purchaseRepository.findByUserIdOrderByFechaCompraDesc(userId)
                .stream().map(p -> mapToResponse(p, List.of())).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseResponse getPurchaseById(Long purchaseId) {
        Purchase purchase = purchaseRepository.findById(purchaseId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", "id", purchaseId));
        return mapToResponse(purchase, List.of());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /**
     * Devuelve el precio del ítem sin importar si es jugador FIFA o eFootball.
     */
    private BigDecimal getPrecioItem(CartItem item) {
        if (item.getJugador() != null) {
            BigDecimal precio = item.getJugador().getPrecio();
            return precio != null ? precio : BigDecimal.ZERO;
        }
        if (item.getPlayer() != null) {
            return item.getPlayer().getPrecio();
        }
        return BigDecimal.ZERO;
    }

    /**
     * Construye el PurchaseResponse combinando jugadores FIFA y eFootball.
     * Si cartItems está vacío (al leer historial), usa solo los players guardados en Purchase.
     */
    private PurchaseResponse mapToResponse(Purchase p, List<CartItem> originalItems) {
        List<PlayerResponse> playerResponses = new ArrayList<>();

        // Jugadores FIFA guardados en la relación ManyToMany de Purchase
        p.getPlayers().forEach(player -> playerResponses.add(
                PlayerResponse.builder()
                        .id(player.getId())
                        .nombre(player.getNombre())
                        .nacionalidad(player.getNacionalidad())
                        .posicion(player.getPosicion())
                        .edad(player.getEdad())
                        .precio(player.getPrecio())
                        .imagenUrl(player.getImagenUrl())
                        .activo(player.getActivo())
                        .build()
        ));

        // Jugadores eFootball del momento del checkout (no guardados en Purchase.players)
        originalItems.stream()
                .filter(item -> item.getJugador() != null)
                .forEach(item -> {
                    Jugador j = item.getJugador();
                    playerResponses.add(
                            PlayerResponse.builder()
                                    .id(j.getId())
                                    .nombre(j.getNombre() + " [eFootball]")
                                    .nacionalidad("eFootball")
                                    .posicion(null)
                                    .edad(0)
                                    .precio(j.getPrecio() != null ? j.getPrecio() : BigDecimal.ZERO)
                                    .imagenUrl(null)
                                    .activo(true)
                                    .build()
                    );
                });

        return PurchaseResponse.builder()
                .id(p.getId())
                .fechaCompra(p.getFechaCompra())
                .precioTotal(p.getPrecioTotal())
                .players(playerResponses)
                .userName(p.getUser().getNombre())
                .build();
    }
}
