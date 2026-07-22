import api from './axiosConfig';
import type { ApiResponse } from '../types';

export interface SaldoRequestPayload {
  montoSolicitado: number;
  mensaje?: string;
}

export interface SaldoRequestItem {
  id: number;
  userId: number;
  userName: string;
  userCorreo: string;
  montoSolicitado: number;
  mensaje?: string;
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fechaSolicitud: string;
  fechaRespuesta?: string;
}

export const saldoRequestsApi = {
  create: async (data: SaldoRequestPayload): Promise<SaldoRequestItem> => {
    const res = await api.post<ApiResponse<SaldoRequestItem>>('/saldo-requests', data);
    return res.data.data;
  },

  getMine: async (): Promise<SaldoRequestItem[]> => {
    const res = await api.get<ApiResponse<SaldoRequestItem[]>>('/saldo-requests/mine');
    return res.data.data;
  },

  getAll: async (): Promise<SaldoRequestItem[]> => {
    const res = await api.get<ApiResponse<SaldoRequestItem[]>>('/saldo-requests');
    return res.data.data;
  },

  getPendientes: async (): Promise<SaldoRequestItem[]> => {
    const res = await api.get<ApiResponse<SaldoRequestItem[]>>('/saldo-requests/pendientes');
    return res.data.data;
  },

  aprobar: async (id: number): Promise<SaldoRequestItem> => {
    const res = await api.put<ApiResponse<SaldoRequestItem>>(`/saldo-requests/${id}/aprobar`);
    return res.data.data;
  },

  rechazar: async (id: number): Promise<SaldoRequestItem> => {
    const res = await api.put<ApiResponse<SaldoRequestItem>>(`/saldo-requests/${id}/rechazar`);
    return res.data.data;
  },
};

export const adminApi = {
  getUsers: async (): Promise<any[]> => {
    const res = await api.get<ApiResponse<any[]>>('/admin/users');
    return res.data.data;
  },
};
