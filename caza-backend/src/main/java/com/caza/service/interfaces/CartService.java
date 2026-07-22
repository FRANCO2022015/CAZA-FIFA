package com.caza.service.interfaces;

import com.caza.dto.request.CartItemRequest;
import com.caza.dto.response.CartResponse;

public interface CartService {

    CartResponse getCart(Long userId);

    CartResponse addItem(Long userId, CartItemRequest request);

    CartResponse updateItem(Long userId, Long itemId, Integer cantidad);

    CartResponse removeItem(Long userId, Long itemId);

    void clearCart(Long userId);
}
