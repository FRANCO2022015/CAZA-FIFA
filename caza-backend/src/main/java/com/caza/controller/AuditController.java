package com.caza.controller;
import com.caza.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.*;
import java.util.*;
@RestController @RequestMapping("/api/admin/audit") @PreAuthorize("hasRole('ADMIN')") @RequiredArgsConstructor
public class AuditController {
 private final JdbcTemplate jdbc;
 @GetMapping public ApiResponse<?> list(
   @RequestParam(required=false) LocalDate from, @RequestParam(required=false) LocalDate to,
   @RequestParam(required=false) Long actor, @RequestParam(required=false) String game,
   @RequestParam(required=false) String action, @RequestParam(required=false) String player,
   @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size,
   @RequestParam(required=false) Long until) {
   if(page<0 || size<1 || size>200) throw new IllegalArgumentException("Página inválida");
   long cutoff=until==null ? jdbc.queryForObject("SELECT coalesce(max(id),0) FROM audit_events",Long.class) : until;
   StringBuilder where=new StringBuilder(" WHERE id <= ?");
   List<Object> args=new ArrayList<>(); args.add(cutoff);
   var zone=ZoneId.of("America/Lima");
   if(from!=null){where.append(" AND occurred_at >= ?");args.add(java.sql.Timestamp.from(from.atStartOfDay(zone).toInstant()));}
   if(to!=null){where.append(" AND occurred_at < ?");args.add(java.sql.Timestamp.from(to.plusDays(1).atStartOfDay(zone).toInstant()));}
   if(actor!=null){where.append(" AND actor_id = ?");args.add(actor);}
   if(game!=null && !game.isBlank()){where.append(" AND game = ?");args.add(game);}
   if(action!=null && !action.isBlank()){where.append(" AND action = ?");args.add(action);}
   if(player!=null && !player.isBlank()){where.append(" AND entity_name ILIKE ?");args.add("%"+player+"%");}
   long total=jdbc.queryForObject("SELECT count(*) FROM audit_events"+where,Long.class,args.toArray());
   args.add(size);args.add((long)page*size);
   var rows=jdbc.queryForList("SELECT * FROM audit_events"+where+" ORDER BY id DESC LIMIT ? OFFSET ?",args.toArray());
   return ApiResponse.success(Map.of("content",rows,"totalElements",total,"until",cutoff));
 }
}
