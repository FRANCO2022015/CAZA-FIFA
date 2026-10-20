package com.caza.service.interfaces;

import com.caza.dto.response.PurchaseResponse;

import java.util.List;

public interface PurchaseService {

    PurchaseResponse checkout(Long userId);
    PurchaseResponse checkout(Long userId, String key);
    PurchaseResponse getByRequest(Long userId, String key);

    List<PurchaseResponse> getUserPurchases(Long userId);

    PurchaseResponse getPurchaseById(Long id, Long userId, boolean admin);
}
