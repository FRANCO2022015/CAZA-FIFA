package com.caza.repository;

import com.caza.model.SaldoRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SaldoRequestRepository extends JpaRepository<SaldoRequest, Long> {

    List<SaldoRequest> findByUserIdOrderByFechaSolicitudDesc(Long userId);

    List<SaldoRequest> findAllByOrderByFechaSolicitudDesc();

    List<SaldoRequest> findByEstadoOrderByFechaSolicitudDesc(SaldoRequest.EstadoSolicitud estado);
}
