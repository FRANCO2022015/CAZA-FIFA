package com.caza.repository;

import com.caza.model.SaldoRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SaldoRequestRepository extends JpaRepository<SaldoRequest, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("select s from SaldoRequest s where s.id = :id")
    java.util.Optional<SaldoRequest> findForUpdate(@org.springframework.data.repository.query.Param("id") Long id);

    List<SaldoRequest> findByUserIdOrderByFechaSolicitudDesc(Long userId);

    List<SaldoRequest> findAllByOrderByFechaSolicitudDesc();

    List<SaldoRequest> findByEstadoOrderByFechaSolicitudDesc(SaldoRequest.EstadoSolicitud estado);
}
