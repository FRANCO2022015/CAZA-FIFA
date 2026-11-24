package com.caza.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.client.RestClient;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;
import javax.imageio.ImageIO;

@Service
public class ComicStorage {
 @Value("${CLOUDINARY_CLOUD_NAME:}") private String cloud;
 @Value("${CLOUDINARY_API_KEY:}") private String key;
 @Value("${CLOUDINARY_API_SECRET:}") private String secret;
 private void configured() {
  if(!cloud.matches("[a-zA-Z0-9_-]+") || key.isBlank() || secret.isBlank()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Configura Cloudinary para la historieta");
 }
 private String signature(SortedMap<String,String> params) throws Exception {
  String text=params.entrySet().stream().map(e->e.getKey()+"="+e.getValue()).collect(Collectors.joining("&"));
  return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest((text+secret).getBytes(StandardCharsets.UTF_8)));
 }
 public static void validatePng(byte[] bytes) throws Exception {
  if(bytes.length==0 || bytes.length>7*1024*1024 || !ImageStorage.extension(bytes).equals("png")) throw new IllegalArgumentException("Selecciona un PNG de hasta 7 MB");
  try(var input=ImageIO.createImageInputStream(new java.io.ByteArrayInputStream(bytes))) {
   var readers=ImageIO.getImageReaders(input);
   if(!readers.hasNext()) throw new IllegalArgumentException("PNG inválido");
   var reader=readers.next();
   try {
    reader.setInput(input);
    long pixels=(long)reader.getWidth(0)*reader.getHeight(0);
    if(pixels<=0 || pixels>40000000) throw new IllegalArgumentException("La imagen supera 40 megapíxeles");
   } finally {reader.dispose();}
  }
 }
 public String upload(MultipartFile file) throws Exception {
  configured();
  if(file.getSize()>7*1024*1024) throw new IllegalArgumentException("Máximo 7 MB por PNG");
  byte[] bytes=file.getBytes(); validatePng(bytes);
  String id="caza/comics/"+UUID.randomUUID();
  var params=new TreeMap<String,String>();
  params.put("public_id",id);params.put("type","authenticated");params.put("timestamp",Long.toString(System.currentTimeMillis()/1000));
  var form=new LinkedMultiValueMap<String,Object>();params.forEach(form::add);
  form.add("api_key",key);form.add("signature",signature(params));
  form.add("file",new ByteArrayResource(bytes){@Override public String getFilename(){return "page.png";}});
  var factory=new SimpleClientHttpRequestFactory();factory.setConnectTimeout(10000);factory.setReadTimeout(60000);
  try {
   Map<?,?> result=RestClient.builder().requestFactory(factory).build().post().uri("https://api.cloudinary.com/v1_1/"+cloud+"/image/upload")
    .contentType(MediaType.MULTIPART_FORM_DATA).body(form).retrieve().body(Map.class);
   if(result==null || !id.equals(result.get("public_id")) || !"authenticated".equals(result.get("type"))) throw new IllegalStateException("Respuesta inválida");
   return id;
  } catch(Exception e) {throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,"No se pudo subir el PNG a Cloudinary");}
 }
 public String readUrl(String id) throws Exception {
  configured();
  if(!id.matches("caza/comics/[a-f0-9-]{36}")) throw new IllegalArgumentException("Imagen inválida");
  long now=System.currentTimeMillis()/1000;
  var params=new TreeMap<String,String>();params.put("public_id",id);params.put("format","png");params.put("type","authenticated");
  params.put("timestamp",Long.toString(now));params.put("expires_at",Long.toString(now+300));params.put("attachment","false");
  var uri=UriComponentsBuilder.fromHttpUrl("https://api.cloudinary.com/v1_1/"+cloud+"/image/download");
  params.forEach(uri::queryParam);uri.queryParam("api_key",key).queryParam("signature",signature(params));
  return uri.build().encode().toUriString();
 }
}
