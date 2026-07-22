import { useState, useCallback } from 'react';
import { jugadoresApi } from '../api/jugadores';
import { searchAdvancedJugadores, type AdvancedFilterParams } from '../api/jugadoresAdvanced';
import type { Jugador, PagedResponse, JugadorSearchParams } from '../types';

export const useJugadores = () => {
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [paged, setPaged] = useState<Omit<PagedResponse<Jugador>, 'content'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJugadores = useCallback(async (
    page = 0,
    size = 12,
    sortBy = 'nombre',
    sortDir: 'asc' | 'desc' = 'asc'
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await jugadoresApi.getAll(page, size, sortBy, sortDir);
      setJugadores(data.content);
      const { content: _c, ...rest } = data;
      setPaged(rest);
    } catch {
      setError('Error al cargar los jugadores eFootball');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchJugadores = useCallback(async (params: JugadorSearchParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await jugadoresApi.search(params);
      setJugadores(data.content);
      const { content: _c, ...rest } = data;
      setPaged(rest);
    } catch {
      setError('Error al buscar jugadores');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchAdvanced = useCallback(async (params: AdvancedFilterParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await searchAdvancedJugadores(params);
      setJugadores(data.content);
      const { content: _c, ...rest } = data;
      setPaged(rest);
    } catch {
      setError('Error al filtrar jugadores');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { jugadores, paged, isLoading, error, fetchJugadores, searchJugadores, searchAdvanced };
};
