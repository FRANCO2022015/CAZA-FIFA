package com.caza.service.impl;
import com.caza.dto.response.*;
import com.caza.exception.*;
import com.caza.model.*;
import com.caza.repository.*;
import com.caza.service.interfaces.PurchaseService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service @RequiredArgsConstructor @Transactional
public class PurchaseServiceImpl implements PurchaseService {
 private final PurchaseRepository purchaseRepository;
 private final CartItemRepository cartItemRepository;
 private final UserRepository userRepository;
 private final ObjectMapper mapper;

 public PurchaseResponse checkout(Long userId) { return checkout(userId, null); }
 public PurchaseResponse getByRequest(Long userId, String key) {
   return response(purchaseRepository.findByUserIdAndRequestKey(userId, key).orElseThrow(() -> new ResourceNotFoundException("Compra", "solicitud", key)));
 }
 public PurchaseResponse checkout(Long userId, String key) {
   if(key != null) java.util.UUID.fromString(key);
   User user = userRepository.findForUpdate(userId).orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
   if(key != null) {
     var existing = purchaseRepository.findByUserIdAndRequestKey(userId, key);
     if(existing.isPresent()) return response(existing.get());
   }
   List<CartItem> items = cartItemRepository.findByUserId(userId);
   if(items.isEmpty()) throw new IllegalStateException("El carrito está vacío");
   List<PlayerResponse> detail = items.stream().map(this::snapshot).toList();
   BigDecimal total = detail.stream().map(p -> p.getPrecio().multiply(BigDecimal.valueOf(p.getCantidad()))).reduce(BigDecimal.ZERO, BigDecimal::add);
   if(user.getSaldo().compareTo(total)<0) throw new InsufficientBalanceException("Saldo insuficiente");
   user.setSaldo(user.getSaldo().subtract(total));
   userRepository.save(user);
   Purchase purchase = Purchase.builder().requestKey(key).user(user).precioTotal(total)
       .players(items.stream().filter(i -> i.getPlayer()!=null).map(CartItem::getPlayer).toList()).build();
   try { purchase.setItemsSnapshot(mapper.writeValueAsString(detail)); }
   catch(Exception e) { throw new IllegalStateException("No se pudo guardar el detalle de compra", e); }
   purchase = purchaseRepository.save(purchase);
   cartItemRepository.deleteByUserId(userId);
   return response(purchase);
 }
 private PlayerResponse snapshot(CartItem i) {
   if(i.getCantidad()==null || i.getCantidad()<1 || i.getCantidad()>100) throw new IllegalArgumentException("Cantidad inválida");
   PlayerResponse p;
   if(i.getJugador()!=null && Boolean.TRUE.equals(i.getJugador().getActivo())) {
     Jugador j=i.getJugador();
     p=PlayerResponse.builder().id(j.getId()).nombre(j.getNombre()).gameType("EFOOTBALL")
         .nacionalidad("eFootball").precio(j.getPrecio()).imagenUrl(j.getImagenUrl()).activo(true).build();
   } else if(i.getPlayer()!=null && Boolean.TRUE.equals(i.getPlayer().getActivo())) {
     p=fifa(i.getPlayer());
   } else throw new IllegalArgumentException("Jugador no disponible");
   if(p.getPrecio()==null || p.getPrecio().signum()<0) throw new IllegalArgumentException("Precio inválido");
   p.setCantidad(i.getCantidad());
   return p;
 }
 private PlayerResponse fifa(Player p) {
   return PlayerResponse.builder().id(p.getId()).nombre(p.getNombre()).gameType("FIFA").cantidad(1)
      .nacionalidad(p.getNacionalidad()).posicion(p.getPosicion()).edad(p.getEdad())
      .precio(p.getPrecio()).imagenUrl(p.getImagenUrl()).activo(p.getActivo()).build();
 }
 @Transactional(readOnly=true)
 public List<PurchaseResponse> getUserPurchases(Long userId) {
   return purchaseRepository.findByUserIdOrderByFechaCompraDesc(userId).stream().map(this::response).toList();
 }
 @Transactional(readOnly=true)
 public PurchaseResponse getPurchaseById(Long id, Long userId, boolean admin) {
   Purchase p=purchaseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Purchase", "id", id));
   if(!admin && !p.getUser().getId().equals(userId)) throw new UnauthorizedException("Esta compra pertenece a otro usuario");
   return response(p);
 }
 private PurchaseResponse response(Purchase p) {
   List<PlayerResponse> detail;
   if(p.getItemsSnapshot()!=null) {
     try { detail=mapper.readValue(p.getItemsSnapshot(), new TypeReference<List<PlayerResponse>>(){}); }
     catch(Exception e) { throw new IllegalStateException("Detalle de compra ilegible",e); }
   } else { detail=p.getPlayers().stream().map(this::fifa).toList(); }
   return PurchaseResponse.builder().id(p.getId()).fechaCompra(p.getFechaCompra()).precioTotal(p.getPrecioTotal()).players(detail).userName(p.getUser().getNombre()).build();
 }
}
