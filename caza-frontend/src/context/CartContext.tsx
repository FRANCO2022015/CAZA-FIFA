import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { cartApi } from '../api/cart';
import type { CartSummary } from '../types';
import { useAuthContext } from './AuthContext';

interface CartContextType {
  cart: CartSummary | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (playerId: number, cantidad?: number) => Promise<void>;
  addJugadorToCart: (jugadorId: number, cantidad?: number) => Promise<void>;
  updateItem: (itemId: number, cantidad: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthContext();
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      const data = await cartApi.getCart();
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (playerId: number, cantidad = 1) => {
    const data = await cartApi.addToCart(playerId, cantidad);
    setCart(data);
  }, []);

  const addJugadorToCart = useCallback(async (jugadorId: number, cantidad = 1) => {
    const data = await cartApi.addJugadorToCart(jugadorId, cantidad);
    setCart(data);
  }, []);

  const updateItem = useCallback(async (itemId: number, cantidad: number) => {
    const data = await cartApi.updateCartItem(itemId, cantidad);
    setCart(data);
  }, []);

  const removeItem = useCallback(async (itemId: number) => {
    const data = await cartApi.removeFromCart(itemId);
    setCart(data);
  }, []);

  const clearCart = useCallback(async () => {
    await cartApi.clearCart();
    setCart({ items: [], total: 0, itemCount: 0 });
  }, []);

  return (
    <CartContext.Provider value={{ cart, isLoading, fetchCart, addToCart, addJugadorToCart, updateItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCartContext = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
};
