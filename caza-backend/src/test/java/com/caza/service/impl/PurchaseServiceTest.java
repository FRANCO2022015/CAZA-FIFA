package com.caza.service.impl;
import com.caza.model.*;
import com.caza.repository.*;
import com.caza.exception.UnauthorizedException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class PurchaseServiceTest {
 private final PurchaseRepository purchases=mock(PurchaseRepository.class);
 private final CartItemRepository carts=mock(CartItemRepository.class);
 private final UserRepository users=mock(UserRepository.class);
 private final PurchaseServiceImpl service=new PurchaseServiceImpl(purchases,carts,users,new ObjectMapper());
 private User user(){return User.builder().id(1L).nombre("Test").saldo(new BigDecimal("1000")).build();}
 @Test void mixedPurchaseSurvivesReloadWithQuantityAndPrice() {
   var u=user(); when(users.findForUpdate(1L)).thenReturn(Optional.of(u));
   var fifa=Player.builder().id(5L).nombre("Fifa").precio(new BigDecimal("100")).activo(true).build();
   var ef=Jugador.builder().id(5L).nombre("Ef").precio(new BigDecimal("50")).build();
   when(carts.findByUserId(1L)).thenReturn(List.of(CartItem.builder().player(fifa).cantidad(2).build(),CartItem.builder().jugador(ef).cantidad(1).build()));
   when(purchases.save(any())).thenAnswer(a->{Purchase p=a.getArgument(0);p.setId(8L);when(purchases.findById(8L)).thenReturn(Optional.of(p));return p;});
   var bought=service.checkout(1L);
   assertEquals(new BigDecimal("250"),bought.getPrecioTotal()); assertEquals(new BigDecimal("750"),u.getSaldo());
   fifa.setPrecio(BigDecimal.ONE);
   var loaded=service.getPurchaseById(8L,1L,false);
   assertEquals(2,loaded.getPlayers().size()); assertEquals(2,loaded.getPlayers().get(0).getCantidad());
   assertEquals(new BigDecimal("100"),loaded.getPlayers().get(0).getPrecio());
   assertEquals("EFOOTBALL",loaded.getPlayers().get(1).getGameType()); verify(carts).deleteByUserId(1L);
 }
 @Test void negativeQuantityCannotIncreaseBalance() {
   var u=user(); when(users.findForUpdate(1L)).thenReturn(Optional.of(u));
   when(carts.findByUserId(1L)).thenReturn(List.of(CartItem.builder().cantidad(-1).build()));
   assertThrows(IllegalArgumentException.class,()->service.checkout(1L));
   assertEquals(new BigDecimal("1000"),u.getSaldo()); verify(purchases,never()).save(any());
 }
 @Test void anotherUserCannotReadPurchase() {
   when(purchases.findById(8L)).thenReturn(Optional.of(Purchase.builder().user(user()).build()));
   assertThrows(UnauthorizedException.class,()->service.getPurchaseById(8L,2L,false));
 }
 @Test void historicalPurchaseRemainsReadable() {
   var p=Purchase.builder().id(8L).user(user()).precioTotal(new BigDecimal("500")).players(List.of()).build();
   when(purchases.findById(8L)).thenReturn(Optional.of(p));
   assertEquals(new BigDecimal("500"),service.getPurchaseById(8L,1L,false).getPrecioTotal());
 }
}
