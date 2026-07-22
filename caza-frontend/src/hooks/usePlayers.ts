import { useState, useCallback } from 'react';
import { playersApi } from '../api/players';
import type { Player, PagedResponse, PlayerSearchParams } from '../types';

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [paged, setPaged] = useState<Omit<PagedResponse<Player>, 'content'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async (
    page = 0,
    size = 12,
    sortBy = 'nombre',
    sortDir: 'asc' | 'desc' = 'asc'
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await playersApi.getAll(page, size, sortBy, sortDir);
      setPlayers(data.content);
      const { content: _c, ...rest } = data;
      setPaged(rest);
    } catch {
      setError('Error al cargar los jugadores');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchPlayers = useCallback(async (params: PlayerSearchParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await playersApi.search(params);
      setPlayers(data.content);
      const { content: _c, ...rest } = data;
      setPaged(rest);
    } catch {
      setError('Error al buscar jugadores');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { players, paged, isLoading, error, fetchPlayers, searchPlayers };
};
