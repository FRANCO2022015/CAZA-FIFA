package com.caza.config;

import com.caza.model.Role;
import com.caza.model.User;
import com.caza.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Inicializa la base de datos con un usuario administrador por defecto
 * si no existe ninguno con el correo especificado.
 *
 * Credenciales de acceso al panel de administrador:
 *   Correo  : admin@caza.com
 *   Password: Admin2024!
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        final String adminEmail = "admin@caza.com";

        if (userRepository.findByCorreo(adminEmail).isEmpty()) {
            User admin = User.builder()
                    .nombre("Administrador")
                    .correo(adminEmail)
                    .password(passwordEncoder.encode("Admin2024!"))
                    .rol(Role.ADMIN)
                    .saldo(BigDecimal.valueOf(999999))
                    .fechaRegistro(LocalDateTime.now())
                    .activo(true)
                    .build();

            userRepository.save(admin);
            log.info("=======================================================");
            log.info("  ✅ ADMIN creado exitosamente");
            log.info("  📧 Correo  : {}", adminEmail);
            log.info("  🔑 Password: Admin2024!");
            log.info("=======================================================");
        } else {
            log.info("Admin '{}' ya existe — no se crea de nuevo.", adminEmail);
        }
    }
}
