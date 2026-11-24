package com.caza.controller;

import com.caza.dto.response.ApiResponse;
import com.caza.service.ComicStorage;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/api/comics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class ComicController {
 private final JdbcTemplate jdbc;
 private final ComicStorage storage;
 public record FolderInput(@NotBlank @Size(max=120) String name,@NotNull String kind,Long parentId,@Min(0) int order) {}
 public record EditInput(@NotBlank @Size(max=120) String name,@Min(0) int order) {}
 public record PageOrder(@Min(0) int order) {}
 private Map<String,Object> folder(long id) {
  var rows=jdbc.queryForList("SELECT * FROM comic_folders WHERE id=?",id);
  if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Carpeta no encontrada");
  return rows.get(0);
 }
 @GetMapping public ApiResponse<?> tree() {
  return ApiResponse.success(Map.of("folders",jdbc.queryForList("SELECT id,parent_id,kind,name,sort_order FROM comic_folders ORDER BY sort_order,id"),
   "pages",jdbc.queryForList("SELECT id,chapter_id,name,sort_order FROM comic_pages ORDER BY sort_order,id")));
 }
 @PostMapping("/folders") @Transactional
 public ApiResponse<?> create(@Valid @RequestBody FolderInput input) {
  String required=switch(input.kind()){case "SECTION" -> "";case "SAGA" -> "SECTION";case "CHAPTER" -> "SAGA";default -> throw new IllegalArgumentException("Tipo inválido");};
  if(required.isEmpty()) {if(input.parentId()!=null) throw new IllegalArgumentException("Una sección no tiene padre");}
  else if(input.parentId()==null || !required.equals(folder(input.parentId()).get("kind"))) throw new IllegalArgumentException("Jerarquía inválida");
  Long id=jdbc.queryForObject("INSERT INTO comic_folders(parent_id,kind,name,sort_order) VALUES(?,?,?,?) RETURNING id",Long.class,input.parentId(),input.kind(),input.name().trim(),input.order());
  return ApiResponse.success(Map.of("id",id));
 }
 @PatchMapping("/folders/{id}") public ApiResponse<?> edit(@PathVariable long id,@Valid @RequestBody EditInput input) {
  folder(id);jdbc.update("UPDATE comic_folders SET name=?,sort_order=? WHERE id=?",input.name().trim(),input.order(),id);
  return ApiResponse.success("Carpeta actualizada",null);
 }
 @PostMapping(value="/chapters/{id}/pages",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @Transactional
 public ApiResponse<?> upload(@PathVariable long id,@RequestParam MultipartFile file) throws Exception {
  if(!"CHAPTER".equals(folder(id).get("kind"))) throw new IllegalArgumentException("Selecciona un capítulo");
  // Locks only this chapter, so simultaneous uploads get distinct positions.
  jdbc.queryForObject("SELECT id FROM comic_folders WHERE id=? FOR UPDATE",Long.class,id);
  String asset=storage.upload(file);
  String name=Optional.ofNullable(file.getOriginalFilename()).orElse("Página.png").replaceAll("[\\\\/\\p{Cntrl}]","_");
  if(name.length()>200) name=name.substring(0,200);
  Long page=jdbc.queryForObject("INSERT INTO comic_pages(chapter_id,asset_id,name,sort_order) SELECT ?,?,?,coalesce(max(sort_order),-1)+1 FROM comic_pages WHERE chapter_id=? RETURNING id",Long.class,id,asset,name,id);
  return ApiResponse.success(Map.of("id",page));
 }
 public record ReorderInput(@NotNull @Size(max=10000) List<@NotNull Long> ids) {}
 @PutMapping("/chapters/{id}/order") @Transactional
 public ApiResponse<?> reorder(@PathVariable long id,@Valid @RequestBody ReorderInput input) {
  folder(id);jdbc.queryForObject("SELECT id FROM comic_folders WHERE id=? FOR UPDATE",Long.class,id);
  var existing=jdbc.queryForList("SELECT id FROM comic_pages WHERE chapter_id=?",Long.class,id);
  if(input.ids().size()!=existing.size() || !new HashSet<>(input.ids()).equals(new HashSet<>(existing)))
   throw new ResponseStatusException(HttpStatus.CONFLICT,"Las páginas cambiaron. Recarga antes de ordenar.");
  for(int i=0;i<input.ids().size();i++)jdbc.update("UPDATE comic_pages SET sort_order=? WHERE id=? AND chapter_id=?",i,input.ids().get(i),id);
  return ApiResponse.success("Orden actualizado",null);
 }
 @GetMapping("/pages/{id}/url") public ResponseEntity<?> url(@PathVariable long id) throws Exception {
  var rows=jdbc.queryForList("SELECT asset_id FROM comic_pages WHERE id=?",String.class,id);
  if(rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
  return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(ApiResponse.success(Map.of("url",storage.readUrl(rows.get(0)))));
 }
}
