package com.caza.service.impl;

import com.caza.dto.request.SaldoRequestDTO;
import com.caza.dto.response.SaldoRequestResponse;
import com.caza.exception.ResourceNotFoundException;
import com.caza.model.SaldoRequest;
import com.caza.model.User;
import com.caza.repository.SaldoRequestRepository;
import com.caza.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SaldoRequestService {

    private final SaldoRequestRepository repo;
    private final UserRepository userRepository;

    /** Usuario autenticado crea una solicitud */
    public SaldoRequestResponse create(SaldoRequestDTO dto) {
        String correo = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByCorreo(correo)
                .orElseThrow(() -> new ResourceNotFoundException("User", "correo", correo));

        SaldoRequest sr = SaldoRequest.builder()
                .user(user)
                .montoSolicitado(dto.montoSolicitado())
                .mensaje(dto.mensaje())
                .estado(SaldoRequest.EstadoSolicitud.PENDIENTE)
                .fechaSolicitud(LocalDateTime.now())
                .build();

        SaldoRequest saved = repo.save(sr);
        log.info("Solicitud de saldo creada: {} → ${} (id={})", user.getCorreo(), dto.montoSolicitado(), saved.getId());
        return map(saved);
    }

    /** Mis solicitudes (usuario autenticado) */
    @Transactional(readOnly = true)
    public List<SaldoRequestResponse> getMine() {
        String correo = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByCorreo(correo)
                .orElseThrow(() -> new ResourceNotFoundException("User", "correo", correo));
        return repo.findByUserIdOrderByFechaSolicitudDesc(user.getId()).stream().map(this::map).toList();
    }

    /** Todas las solicitudes (solo Admin) */
    @Transactional(readOnly = true)
    public List<SaldoRequestResponse> getAll() {
        return repo.findAllByOrderByFechaSolicitudDesc().stream().map(this::map).toList();
    }

    /** Solicitudes pendientes (solo Admin) */
    @Transactional(readOnly = true)
    public List<SaldoRequestResponse> getPendientes() {
        return repo.findByEstadoOrderByFechaSolicitudDesc(SaldoRequest.EstadoSolicitud.PENDIENTE)
                .stream().map(this::map).toList();
    }

    /** Admin aprueba la solicitud y añade saldo al usuario */
    public SaldoRequestResponse aprobar(Long id) {
        SaldoRequest sr = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SaldoRequest", "id", id));

        if (sr.getEstado() != SaldoRequest.EstadoSolicitud.PENDIENTE) {
            throw new IllegalStateException("La solicitud ya fue procesada: " + sr.getEstado());
        }

        User user = sr.getUser();
        user.setSaldo(user.getSaldo().add(sr.getMontoSolicitado()));
        userRepository.save(user);

        sr.setEstado(SaldoRequest.EstadoSolicitud.APROBADA);
        sr.setFechaRespuesta(LocalDateTime.now());
        SaldoRequest saved = repo.save(sr);

        log.info("Solicitud #{} aprobada: +${} para {}", id, sr.getMontoSolicitado(), user.getCorreo());
        return map(saved);
    }

    /** Admin rechaza la solicitud */
    public SaldoRequestResponse rechazar(Long id) {
        SaldoRequest sr = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SaldoRequest", "id", id));

        if (sr.getEstado() != SaldoRequest.EstadoSolicitud.PENDIENTE) {
            throw new IllegalStateException("La solicitud ya fue procesada: " + sr.getEstado());
        }

        sr.setEstado(SaldoRequest.EstadoSolicitud.RECHAZADA);
        sr.setFechaRespuesta(LocalDateTime.now());
        return map(repo.save(sr));
    }

    private SaldoRequestResponse map(SaldoRequest sr) {
        return SaldoRequestResponse.builder()
                .id(sr.getId())
                .userId(sr.getUser().getId())
                .userName(sr.getUser().getNombre())
                .userCorreo(sr.getUser().getCorreo())
                .montoSolicitado(sr.getMontoSolicitado())
                .mensaje(sr.getMensaje())
                .estado(sr.getEstado().name())
                .fechaSolicitud(sr.getFechaSolicitud())
                .fechaRespuesta(sr.getFechaRespuesta())
                .build();
    }
}
