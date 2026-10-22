import { ownedCatalogue } from '../api/ownedCatalogue';
import { useState, useCallback, useRef } from 'react';
import { jugadoresApi } from '../api/jugadores';
import { searchAdvancedJugadores, type AdvancedFilterParams } from '../api/jugadoresAdvanced';
import type { Jugador, PagedResponse, JugadorSearchParams } from '../types';

export const useJugadores = (owned = false) => {
  const sequence = useRef(0);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [paged, setPaged] = useState<Omit<PagedResponse<Jugador>, 'content'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJugadores = useCallback(async (
    page = 0,
    size = 12,
    sortBy = 'goles',
    sortDir: 'asc' | 'desc' = 'desc'
  ) => {
    const request = ++sequence.current;
    try {
      setIsLoading(true);
      setError(null);
      const data = owned ? await ownedCatalogue('EFOOTBALL', page, size, (p, n) => jugadoresApi.getAll(p, n, sortBy, sortDir)) : await jugadoresApi.getAll(page, size, sortBy, sortDir);
      if (request !== sequence.current) return;
      setJugadores(data.content);
      const { content: _c, ...rest } = data;
      setPaged(rest);
    } catch {
      if (request !== sequence.current) return;
      setError('Error al cargar los jugadores eFootball');
    } finally {
      if (request === sequence.current) setIsLoading(false);
    }
  }, [owned]);

  const searchJugadores = useCallback(async (params: JugadorSearchParams) => {
    const request = ++sequence.current;
    try {
      setIsLoading(true);
      setError(null);
      const data = owned ? await ownedCatalogue('EFOOTBALL', params.page ?? 0, params.size ?? 12, (p, n) => jugadoresApi.search({...params, page: p, size: n})) : await jugadoresApi.search(params);
      if (request !== sequence.current) return;
      setJugadores(data.content);
      const { content: _c, ...rest } = data;
      setPaged(rest);
    } catch {
      if (request !== sequence.current) return;
      setError('Error al buscar jugadores');
    } finally {
      if (request === sequence.current) setIsLoading(false);
    }
  }, [owned]);

  const searchAdvanced = useCallback(async (params: AdvancedFilterParams) => {
    const request = ++sequence.current;
    try {
      setIsLoading(true);
      setError(null);
      const data = owned ? await ownedCatalogue('EFOOTBALL', params.page ?? 0, params.size ?? 12, (p, n) => searchAdvancedJugadores({...params, page: p, size: n})) : await searchAdvancedJugadores(params);
      if (request !== sequence.current) return;
      setJugadores(data.content);
      const { content: _c, ...rest } = data;
      setPaged(rest);
    } catch {
      if (request !== sequence.current) return;
      setError('Error al filtrar jugadores');
    } finally {
      if (request === sequence.current) setIsLoading(false);
    }
  }, [owned]);

  return { jugadores, paged, isLoading, error, fetchJugadores, searchJugadores, searchAdvanced };
};
