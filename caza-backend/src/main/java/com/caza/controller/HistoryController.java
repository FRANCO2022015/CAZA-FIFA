package com.caza.controller;

import com.caza.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {
 private final JdbcTemplate jdbc;
 private void game(String game) {
  if (!Set.of("FIFA","EFOOTBALL").contains(game)) throw new IllegalArgumentException("Juego inválido");
 }
 @GetMapping("/players")
 public ApiResponse<?> players(@RequestParam String game) {
  game(game);
  return ApiResponse.success(jdbc.queryForList("SELECT DISTINCT ON (player_id) player_id AS id,nombre FROM player_history WHERE game=? ORDER BY player_id,recorded_at DESC,id DESC",game));
 }
 @GetMapping
 public ApiResponse<?> history(@RequestParam String game,@RequestParam long first,@RequestParam long second) {
  game(game);
  if(first<=0 || second<=0 || first==second) throw new IllegalArgumentException("Selecciona dos jugadores diferentes");
  return ApiResponse.success(jdbc.query("SELECT id,player_id,nombre,recorded_at,goles,asistencias,partidos FROM player_history WHERE game=? AND player_id IN (?,?) ORDER BY recorded_at,id",
   (rs,row)->Map.of("id",rs.getLong("id"),"playerId",rs.getLong("player_id"),"nombre",rs.getString("nombre"),"at",rs.getTimestamp("recorded_at").toInstant().toString(),"goles",rs.getLong("goles"),"asistencias",rs.getLong("asistencias"),"partidos",rs.getLong("partidos")),game,first,second));
 }
}
