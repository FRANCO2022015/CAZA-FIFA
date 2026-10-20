package com.caza.controller;
import com.caza.dto.response.ApiResponse;
import com.caza.model.*;
import com.caza.repository.LineupRepository;
import com.fasterxml.jackson.databind.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.*;
@RestController @RequestMapping("/api/lineups") @RequiredArgsConstructor
public class LineupController {
 private final LineupRepository repo;
 private final ObjectMapper mapper;
 public record Input(@NotBlank @Size(max=100) String name, @NotBlank @Size(max=100000) String payload, Long version) {}
 @GetMapping public ApiResponse<?> list(@AuthenticationPrincipal User user) {
   return ApiResponse.success(repo.findByUserIdOrderByUpdatedAtDesc(user.getId()));
 }
 @PutMapping("/{id}") @Transactional
 public ApiResponse<Lineup> save(@AuthenticationPrincipal User user, @PathVariable UUID id, @Valid @RequestBody Input input) throws Exception {
   JsonNode data;
   try { data=mapper.readTree(input.payload()); } catch(Exception e) { throw new IllegalArgumentException("JSON de alineación inválido"); }
   if(!Set.of("FIFA","EFOOTBALL").contains(data.path("gameType").asText()) ||
      !Set.of("MI_EQUIPO","POTENCIAL").contains(data.path("teamMode").asText()) ||
      !Set.of("4-3-3","4-4-2","4-2-3-1","3-5-2","5-3-2","3-4-3","5-4-1","4-3-2-1","5-2-3","4-1-4-1","4-2-4","4-5-1","3-4-1-2").contains(data.path("formationKey").asText()) ||
      !data.path("lineup").isObject() || data.path("lineup").size()>23)
     throw new IllegalArgumentException("Alineación inválida");
   Set<Long> ids=new HashSet<>();
   var fields=data.path("lineup").fields();
   while(fields.hasNext()) {
     var e=fields.next();
     int slot=Integer.parseInt(e.getKey());
     long playerId=e.getValue().path("id").asLong();
     if(slot<0 || slot>22 || playerId<=0 || !ids.add(playerId)) throw new IllegalArgumentException("Posición o jugador duplicado");
   }
   var found=repo.findByIdAndUserId(id,user.getId());
   Lineup entity;
   if(found.isPresent()) {
     entity=found.get();
     if(!Objects.equals(entity.getVersion(),input.version())) throw new ResponseStatusException(HttpStatus.CONFLICT,"Esta alineación cambió en otro dispositivo. Recarga o guarda una copia.");
   } else {
     if(input.version()!=null || repo.existsById(id)) throw new ResponseStatusException(HttpStatus.CONFLICT,"No se puede sobrescribir esta alineación");
     if(repo.countByUserId(user.getId())>=100) throw new IllegalArgumentException("Máximo 100 alineaciones");
     entity=new Lineup(); entity.setId(id); entity.setUserId(user.getId());
   }
   entity.setName(input.name().trim()); entity.setPayload(input.payload());
   return ApiResponse.success(repo.saveAndFlush(entity));
 }
 @DeleteMapping("/{id}") @Transactional
 public ApiResponse<?> delete(@AuthenticationPrincipal User user,@PathVariable UUID id,@RequestParam Long version) {
   var item=repo.findByIdAndUserId(id,user.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
   if(!Objects.equals(item.getVersion(),version)) throw new ResponseStatusException(HttpStatus.CONFLICT,"La alineación cambió. Recarga antes de eliminar.");
   repo.delete(item); repo.flush();
   return ApiResponse.success("Alineación eliminada",null);
 }
}
