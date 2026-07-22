import axiosInstance from './axiosConfig';
import type { ApiResponse, PagedResponse, Player, PlayerSearchParams, PlayerStats } from '../types';

export const playersApi = {
  getAll: async (page = 0, size = 12, sortBy = 'nombre', sortDir = 'asc'): Promise<PagedResponse<Player>> => {
    const res = await axiosInstance.get<ApiResponse<PagedResponse<Player>>>('/players', {
      params: { page, size, sortBy, sortDir },
    });
    return res.data.data;
  },

  getById: async (id: number): Promise<Player> => {
    const res = await axiosInstance.get<ApiResponse<Player>>(`/players/${id}`);
    return res.data.data;
  },

  search: async (params: PlayerSearchParams): Promise<PagedResponse<Player>> => {
    const res = await axiosInstance.get<ApiResponse<PagedResponse<Player>>>('/players/search', {
      params,
    });
    return res.data.data;
  },

  create: async (data: Partial<Player>): Promise<Player> => {
    const res = await axiosInstance.post<ApiResponse<Player>>('/players', data);
    return res.data.data;
  },

  update: async (id: number, data: Partial<Player>): Promise<Player> => {
    const res = await axiosInstance.put<ApiResponse<Player>>(`/players/${id}`, data);
    return res.data.data;
  },

  /** Solo actualiza la imagen — no requiere enviar todos los campos */
  patchImagen: async (id: number, imagenUrl: string | null): Promise<Player> => {
    const res = await axiosInstance.patch<ApiResponse<Player>>(`/players/${id}/imagen`, { imagenUrl });
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/players/${id}`);
  },

  getStats: async (playerId: number): Promise<PlayerStats[]> => {
    const res = await axiosInstance.get<ApiResponse<PlayerStats[]>>(`/players/${playerId}/stats`);
    return res.data.data;
  },

  addStats: async (playerId: number, data: Omit<PlayerStats, 'id' | 'playerId'>): Promise<PlayerStats> => {
    const res = await axiosInstance.post<ApiResponse<PlayerStats>>(`/players/${playerId}/stats`, data);
    return res.data.data;
  },

  updateStats: async (playerId: number, statsId: number, data: Omit<PlayerStats, 'id' | 'playerId'>): Promise<PlayerStats> => {
    const res = await axiosInstance.put<ApiResponse<PlayerStats>>(`/players/${playerId}/stats/${statsId}`, data);
    return res.data.data;
  },
};
