import axiosInstance from './axiosConfig';
import type { ApiResponse, Purchase } from '../types';

export const purchasesApi = {
  checkout: async (key: string): Promise<Purchase> => {
    const res = await axiosInstance.post<ApiResponse<Purchase>>('/purchases/checkout', null, {headers: {'Idempotency-Key': key}});
    return res.data.data;
  },

  getByRequest: async (key: string): Promise<Purchase> => {
    const res=await axiosInstance.get<ApiResponse<Purchase>>(`/purchases/requests/${key}`);
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
