package com.caza.service.impl;

import com.caza.dto.request.LoginRequest;
import com.caza.dto.request.RegisterRequest;
import com.caza.dto.response.AuthResponse;
import com.caza.dto.response.UserResponse;
import com.caza.exception.DuplicateResourceException;
import com.caza.exception.ResourceNotFoundException;
import com.caza.model.Role;
import com.caza.model.User;
import com.caza.repository.UserRepository;
import com.caza.security.JwtTokenProvider;
import com.caza.service.interfaces.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByCorreo(request.correo())) {
            throw new DuplicateResourceException(
                    "An account with email '" + request.correo() + "' already exists"
            );
        }

        User user = User.builder()
                .nombre(request.nombre())
                .correo(request.correo())
                .password(passwordEncoder.encode(request.password()))
                .rol(Role.USER)
                .saldo(new BigDecimal("10000.00"))
                .activo(true)
                .build();

        User savedUser = userRepository.save(user);
        log.info("New user registered: {}", savedUser.getCorreo());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.correo(), request.password())
        );

        String token = jwtTokenProvider.generateToken(authentication);

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(savedUser.getId())
                .nombre(savedUser.getNombre())
                .correo(savedUser.getCorreo())
                .rol(savedUser.getRol())
                .saldo(savedUser.getSaldo())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.correo(), request.password())
        );

        User user = userRepository.findByCorreo(request.correo())
                .orElseThrow(() -> new ResourceNotFoundException("User", "correo", request.correo()));

        String token = jwtTokenProvider.generateToken(authentication);
        log.info("User logged in: {}", user.getCorreo());

        return AuthResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .userId(user.getId())
                .nombre(user.getNombre())
                .correo(user.getCorreo())
                .rol(user.getRol())
                .saldo(user.getSaldo())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String correo) {
        User user = userRepository.findByCorreo(correo)
                .orElseThrow(() -> new ResourceNotFoundException("User", "correo", correo));

        return new UserResponse(
                user.getId(),
                user.getNombre(),
                user.getCorreo(),
                user.getRol(),
                user.getSaldo(),
                user.getFechaRegistro(),
                user.getActivo()
        );
    }
}
