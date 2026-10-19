package com.caza.controller;
import com.caza.dto.response.ApiResponse;
import com.caza.service.ImageStorage;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
@RestController @RequestMapping("/api/upload") @RequiredArgsConstructor
public class ImageUploadController {
 private final ImageStorage storage;
 @PostMapping(value="/image", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
 public ApiResponse<Map<String,String>> upload(@RequestParam("file") MultipartFile file, HttpServletRequest request) throws Exception {
   String base = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort();
   return ApiResponse.success("Imagen guardada", Map.of("url",storage.save(file,base)));
 }
}
