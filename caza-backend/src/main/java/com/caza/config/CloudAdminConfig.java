package com.caza.config;
import com.caza.repository.UserRepository;
import com.caza.model.Role;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
@Component @Profile("prod") @RequiredArgsConstructor
public class CloudAdminConfig implements CommandLineRunner {
 private final UserRepository users;
 private final PasswordEncoder encoder;
 @Value("${CLOUD_ADMIN_EMAIL:admin@caza.com}") private String email;
 @Value("${CLOUD_ADMIN_PASSWORD}") private String password;
 public void run(String... args) {
   if(password.length()<16 || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>72)
     throw new IllegalStateException("CLOUD_ADMIN_PASSWORD debe tener al menos 16 caracteres y máximo 72 bytes");
   var admin=users.findByCorreo(email).orElseThrow(() -> new IllegalStateException("Restaura la base y configura CLOUD_ADMIN_EMAIL con un administrador existente"));
   if(admin.getRol()!=Role.ADMIN) throw new IllegalStateException("CLOUD_ADMIN_EMAIL no corresponde a un administrador");
   if(!encoder.matches(password,admin.getPassword())) {
     admin.setPassword(encoder.encode(password)); users.save(admin);
   }
 }
}
