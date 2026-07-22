import axiosInstance from './axiosConfig';
import type { ApiResponse, Purchase } from '../types';

export const purchasesApi = {
  checkout: async (): Promise<Purchase> => {
    const res = await axiosInstance.post<ApiResponse<Purchase>>('/purchases/checkout');
    return res.data.data;
  },

  getPurchases: async (): Promise<Purchase[]> => {
    const res = await axiosInstance.get<ApiResponse<Purchase[]>>('/purchases');
    return res.data.data;
  },

  getPurchaseById: async (id: number): Promise<Purchase> => {
    const res = await axiosInstance.get<ApiResponse<Purchase>>(`/purchases/${id}`);
    return res.data.data;
  },
};
