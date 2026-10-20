package com.caza.controller;
import com.caza.dto.request.*;
import com.caza.dto.response.*;
import com.caza.service.interfaces.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
@RestController @RequestMapping("/api/admin/players") @RequiredArgsConstructor @PreAuthorize("hasRole('ADMIN')")
public class PlayerEditorController {
 private final PlayerService players;
 private final PlayerStatsService stats;
 public record Season(Long id, @NotNull @Valid PlayerStatsRequest values) {}
 public record Bundle(@NotNull @Valid PlayerRequest player, @NotNull @Size(max=100) List<@Valid Season> seasons) {}
 @PutMapping("/{id}") @Transactional
 public ApiResponse<PlayerResponse> save(@PathVariable Long id,@Valid @RequestBody Bundle input) {
   Set<String> names=new HashSet<>();
   for(var s:input.seasons()) if(!names.add(s.values().temporada().trim().toLowerCase(Locale.ROOT))) throw new IllegalArgumentException("No repitas la misma temporada");
   players.update(id,input.player());
   for(var s:input.seasons()) {
     if(s.id()==null) stats.addStats(id,s.values()); else stats.updateStats(s.id(),id,s.values());
   }
   return ApiResponse.success(players.getById(id));
 }
}
