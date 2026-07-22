package com.caza.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Expone la carpeta local "uploads/" como recursos estáticos accesibles
 * en la URL http://localhost:8080/uploads/**
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Construir la ruta absoluta con barra final — requerida por Spring para directorios
        String absolutePath = Paths.get("uploads")
                .toAbsolutePath()
                .toString()
                .replace("\\", "/");      // Windows usa backslash; Spring necesita forward slash
        if (!absolutePath.endsWith("/")) {
            absolutePath += "/";
        }
        String resourceLocation = "file:///" + absolutePath;

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }
}
