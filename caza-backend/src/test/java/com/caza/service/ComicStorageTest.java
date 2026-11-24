package com.caza.service;
import org.junit.jupiter.api.Test;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import static org.junit.jupiter.api.Assertions.*;
class ComicStorageTest {
 @Test void acceptsActualPngAndRejectsNonImages() throws Exception {
  var output=new ByteArrayOutputStream();ImageIO.write(new BufferedImage(2,3,BufferedImage.TYPE_INT_RGB),"png",output);
  assertDoesNotThrow(()->ComicStorage.validatePng(output.toByteArray()));
  assertThrows(Exception.class,()->ComicStorage.validatePng("<script>test</script>".getBytes(java.nio.charset.StandardCharsets.UTF_8)));
  assertThrows(Exception.class,()->ComicStorage.validatePng(new byte[0]));
  assertThrows(Exception.class,()->ComicStorage.validatePng(new byte[7*1024*1024+1]));
 }
}
