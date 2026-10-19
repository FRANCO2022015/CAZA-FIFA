package com.caza.service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
@Service
public class ImageStorage {
 @Value("${application.uploads.provider:local}") private String provider;
 @Value("${application.uploads.directory:uploads/players}") private String directory;
 @Value("${CLOUDINARY_CLOUD_NAME:}") private String cloud;
 @Value("${CLOUDINARY_API_KEY:}") private String key;
 @Value("${CLOUDINARY_API_SECRET:}") private String secret;

 public static String extension(byte[] b) {
   if(b.length>=3 && (b[0]&255)==255 && (b[1]&255)==216 && (b[2]&255)==255) return "jpg";
   if(b.length>=8 && Arrays.equals(Arrays.copyOf(b,8),new byte[]{(byte)137,80,78,71,13,10,26,10})) return "png";
   if(b.length>=12 && new String(b,0,4,StandardCharsets.US_ASCII).equals("RIFF") && new String(b,8,4,StandardCharsets.US_ASCII).equals("WEBP")) return "webp";
   throw new IllegalArgumentException("Solo imágenes JPG, PNG o WebP válidas");
 }
 public String save(MultipartFile file, String base) throws Exception {
   if(file.isEmpty() || file.getSize()>10*1024*1024) throw new IllegalArgumentException("Imagen vacía o mayor a 10 MB");
   byte[] bytes=file.getBytes();
   String ext=extension(bytes);
   if(provider.equals("local")) {
     Path path=Paths.get(directory); Files.createDirectories(path);
     String name=UUID.randomUUID()+"."+ext;
     Files.write(path.resolve(name),bytes,StandardOpenOption.CREATE_NEW);
     return base+"/uploads/players/"+name;
   }
   if(!provider.equals("cloudinary") || !cloud.matches("[a-zA-Z0-9_-]+") || key.isBlank() || secret.isBlank())
     throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Configura Cloudinary para guardar fotos de forma permanente");
   String timestamp=Long.toString(System.currentTimeMillis()/1000);
   String signed="folder=caza/players&timestamp="+timestamp;
   String signature=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-1").digest((signed+secret).getBytes(StandardCharsets.UTF_8)));
   var form=new LinkedMultiValueMap<String,Object>();
   form.add("folder","caza/players"); form.add("timestamp",timestamp); form.add("api_key",key); form.add("signature",signature);
   form.add("file",new ByteArrayResource(bytes){@Override public String getFilename(){return "player."+ext;}});
   var factory=new SimpleClientHttpRequestFactory(); factory.setConnectTimeout(10000); factory.setReadTimeout(60000);
   try {
     Map<?,?> result=RestClient.builder().requestFactory(factory).build().post()
       .uri("https://api.cloudinary.com/v1_1/"+cloud+"/image/upload").contentType(MediaType.MULTIPART_FORM_DATA).body(form).retrieve().body(Map.class);
     if(result==null || !(result.get("secure_url") instanceof String url) || !url.startsWith("https://"))
       throw new IllegalStateException("Respuesta inválida del almacenamiento");
     return url;
   } catch(Exception e) {
     throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"No se pudo guardar la imagen; vuelve a intentarlo");
   }
 }
}
