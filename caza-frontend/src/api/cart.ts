import axiosInstance from './axiosConfig';
import type { ApiResponse, CartSummary } from '../types';

export const cartApi = {
  getCart: async (): Promise<CartSummary> => {
    const res = await axiosInstance.get<ApiResponse<CartSummary>>('/cart');
    return res.data.data;
  },

  /** Agrega un jugador FIFA al carrito */
  addToCart: async (playerId: number, cantidad = 1): Promise<CartSummary> => {
    const res = await axiosInstance.post<ApiResponse<CartSummary>>('/cart', { playerId, cantidad });
    return res.data.data;
  },

  /** Agrega un jugador eFootball al carrito */
  addJugadorToCart: async (jugadorId: number, cantidad = 1): Promise<CartSummary> => {
    const res = await axiosInstance.post<ApiResponse<CartSummary>>('/cart', { jugadorId, cantidad });
    return res.data.data;
  },

  updateCartItem: async (itemId: number, cantidad: number): Promise<CartSummary> => {
    const res = await axiosInstance.put<ApiResponse<CartSummary>>(`/cart/${itemId}`, { cantidad });
    return res.data.data;
  },

  removeFromCart: async (itemId: number): Promise<CartSummary> => {
    const res = await axiosInstance.delete<ApiResponse<CartSummary>>(`/cart/${itemId}`);
    return res.data.data;
  },

  clearCart: async (): Promise<void> => {
    await axiosInstance.delete('/cart');
  },
};
