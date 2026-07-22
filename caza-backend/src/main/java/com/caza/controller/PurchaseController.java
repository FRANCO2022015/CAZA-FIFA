package com.caza.controller;

import com.caza.dto.response.ApiResponse;
import com.caza.dto.response.PurchaseResponse;
import com.caza.model.User;
import com.caza.service.interfaces.PurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Purchases", description = "Purchase checkout endpoints")
public class PurchaseController {

    private final PurchaseService purchaseService;

    @PostMapping("/checkout")
    @Operation(summary = "Checkout: buy all items in cart")
    public ResponseEntity<ApiResponse<PurchaseResponse>> checkout(@AuthenticationPrincipal User user) {
        PurchaseResponse response = purchaseService.checkout(user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Compra realizada exitosamente", response));
    }

    @GetMapping
    @Operation(summary = "Get user purchase history")
    public ResponseEntity<ApiResponse<List<PurchaseResponse>>> getUserPurchases(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getUserPurchases(user.getId())));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase by ID")
    public ResponseEntity<ApiResponse<PurchaseResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(purchaseService.getPurchaseById(id)));
    }
}
