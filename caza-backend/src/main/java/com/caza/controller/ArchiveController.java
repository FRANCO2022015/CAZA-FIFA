package com.caza.controller;
import com.caza.dto.response.ApiResponse;
import com.caza.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.*;
@RestController @RequestMapping("/api/admin/archive")
@PreAuthorize("hasRole('ADMIN')") @RequiredArgsConstructor
public class ArchiveController {
 private final PlayerRepository players;
 private final JugadorRepository jugadores;
 private final JdbcTemplate jdbc;
 @GetMapping public ApiResponse<?> list() {
   return ApiResponse.success(jdbc.queryForList("SELECT id,nombre,'FIFA' AS game FROM players WHERE activo=false UNION ALL SELECT id,nombre,'EFOOTBALL' AS game FROM jugadores WHERE activo=false ORDER BY nombre"));
 }
 @PostMapping("/{game}/{id}/restore") @Transactional
 public ApiResponse<?> restore(@PathVariable String game, @PathVariable Long id) {
   if("FIFA".equals(game)) { var p=players.findById(id).orElseThrow(); p.setActivo(true); players.save(p); }
   else if("EFOOTBALL".equals(game)) { var p=jugadores.findById(id).orElseThrow(); p.setActivo(true); jugadores.save(p); }
   else throw new IllegalArgumentException("Juego inválido");
   return ApiResponse.success("Jugador restaurado", null);
 }
}
