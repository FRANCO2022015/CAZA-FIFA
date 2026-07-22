import axiosInstance from './axiosConfig';
import type { ApiResponse, PagedResponse, Jugador } from '../types';

export interface AdvancedFilterParams {
  nombre?: string;
  minGoles?: number;
  maxGoles?: number;
  minAsist?: number;
  maxAsist?: number;
  minPartidos?: number;
  maxPartidos?: number;
  minGa?: number;
  minPg?: number;
  minPa?: number;
  minPga?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

/** Llama a GET /api/jugadores/search/advanced con los filtros de rango */
export async function searchAdvancedJugadores(params: AdvancedFilterParams): Promise<PagedResponse<Jugador>> {
  // Eliminar claves con valor undefined/null/'' para no enviar params vacíos
  const clean: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      clean[k] = v as string | number;
    }
  }
  const res = await axiosInstance.get<ApiResponse<PagedResponse<Jugador>>>(
    '/jugadores/search/advanced',
    { params: clean }
  );
  return res.data.data;
}
