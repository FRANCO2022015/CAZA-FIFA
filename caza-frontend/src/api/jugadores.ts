import axiosInstance from './axiosConfig';
import type { ApiResponse, PagedResponse, Jugador, JugadorSearchParams } from '../types';

// Solo los campos que el usuario introduce — el resto se calcula en el backend
export interface JugadorCreatePayload {
  nombre: string;
  partidos: number;
  goles: number;
  asistencias: number;
  precio?: number;
  imagenUrl?: string;
}

export const jugadoresApi = {
  getAll: async (page = 0, size = 12, sortBy = 'nombre', sortDir = 'asc'): Promise<PagedResponse<Jugador>> => {
    const res = await axiosInstance.get<ApiResponse<PagedResponse<Jugador>>>('/jugadores', {
      params: { page, size, sortBy, sortDir },
    });
    return res.data.data;
  },

  getById: async (id: number): Promise<Jugador> => {
    const res = await axiosInstance.get<ApiResponse<Jugador>>(`/jugadores/${id}`);
    return res.data.data;
  },

  search: async (params: JugadorSearchParams): Promise<PagedResponse<Jugador>> => {
    const res = await axiosInstance.get<ApiResponse<PagedResponse<Jugador>>>('/jugadores/search', {
      params: {
        nombre: params.nombre,
        page: params.page ?? 0,
        size: params.size ?? 12,
        ...(params.sortBy ? { sortBy: params.sortBy, sortDir: params.sortDir ?? 'asc' } : {}),
      },
    });
    return res.data.data;
  },

  // Crear: solo nombre + partidos + goles + asistencias
  create: async (data: JugadorCreatePayload): Promise<Jugador> => {
    const res = await axiosInstance.post<ApiResponse<Jugador>>('/jugadores', data);
    return res.data.data;
  },

  // Actualizar: igual que crear (backend recalcula GA/PG/PA/PGA)
  update: async (id: number, data: JugadorCreatePayload): Promise<Jugador> => {
    const res = await axiosInstance.put<ApiResponse<Jugador>>(`/jugadores/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/jugadores/${id}`);
  },
};
