package com.caza.controller;
import com.caza.service.ComicStorage;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class ComicSecurityTest {
 @Configuration @EnableMethodSecurity static class Config {
  @Bean JdbcTemplate jdbc(){return mock(JdbcTemplate.class);}
  @Bean ComicStorage storage(){return mock(ComicStorage.class);}
  @Bean ComicController comics(JdbcTemplate jdbc,ComicStorage storage){return new ComicController(jdbc,storage);}
 }
 @Test void normalUsersCannotReadOrWriteComics() {
  try(var context=new AnnotationConfigApplicationContext(Config.class)) {
   var controller=context.getBean(ComicController.class);
   clearInvocations(context.getBean(JdbcTemplate.class),context.getBean(ComicStorage.class));
   SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("user","",List.of(new SimpleGrantedAuthority("ROLE_USER"))));
   assertThrows(AccessDeniedException.class,controller::tree);
   assertThrows(AccessDeniedException.class,()->controller.create(new ComicController.FolderInput("Test","SECTION",null,0)));
   assertThrows(AccessDeniedException.class,()->controller.url(1));
   assertThrows(AccessDeniedException.class,()->controller.upload(1,null));
   assertThrows(AccessDeniedException.class,()->controller.reorder(1,new ComicController.ReorderInput(List.of())));
   verifyNoInteractions(context.getBean(JdbcTemplate.class),context.getBean(ComicStorage.class));
   SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("admin","",List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
   assertNotNull(controller.tree());
  } finally {SecurityContextHolder.clearContext();}
 }
}
