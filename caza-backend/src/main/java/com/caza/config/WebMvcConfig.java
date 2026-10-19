package com.caza.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.nio.file.Paths;
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Value("${application.uploads.directory:uploads/players}") private String directory;
    @Override public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Paths.get(directory).toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/uploads/players/**").addResourceLocations(location.endsWith("/") ? location : location + "/");
    }
}
