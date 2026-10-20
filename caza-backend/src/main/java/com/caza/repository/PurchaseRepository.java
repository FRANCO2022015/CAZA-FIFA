package com.caza.repository;

import com.caza.model.Purchase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PurchaseRepository extends JpaRepository<Purchase, Long> {

    java.util.Optional<Purchase> findByUserIdAndRequestKey(Long userId, String key);

    List<Purchase> findByUserIdOrderByFechaCompraDesc(Long userId);
}
