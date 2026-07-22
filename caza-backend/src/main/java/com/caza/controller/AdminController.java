package com.caza.controller;

import com.caza.dto.response.ApiResponse;
import com.caza.dto.response.UserResponse;
import com.caza.model.User;
import com.caza.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Endpoints exclusivos del administrador")
public class AdminController {

    private final UserRepository userRepository;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Listar todos los usuarios registrados")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> users = userRepository.findAll().stream()
                .map(u -> new UserResponse(
                        u.getId(),
                        u.getNombre(),
                        u.getCorreo(),
                        u.getRol(),
                        u.getSaldo(),
                        u.getFechaRegistro(),
                        u.getActivo()
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(users));
    }
}
