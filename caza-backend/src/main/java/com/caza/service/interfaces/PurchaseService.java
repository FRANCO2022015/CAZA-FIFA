package com.caza.service.interfaces;

import com.caza.dto.response.PurchaseResponse;

import java.util.List;

public interface PurchaseService {

    PurchaseResponse checkout(Long userId);

    List<PurchaseResponse> getUserPurchases(Long userId);

    PurchaseResponse getPurchaseById(Long id);
}
