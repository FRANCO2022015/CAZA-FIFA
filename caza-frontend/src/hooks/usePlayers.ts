import { ownedCatalogue } from '../api/ownedCatalogue';
import { useState, useCallback, useRef } from 'react';
import { playersApi } from '../api/players';
import type { Player, PagedResponse, PlayerSearchParams } from '../types';

export const usePlayers = (owned = false) => {
  const sequence = useRef(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [paged, setPaged] = useState<Omit<PagedResponse<Player>, 'content'> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = useCallback(async (
    page = 0,
    size = 12,
    sortBy = 'goles',
    sortDir: 'asc' | 'desc' = 'desc'
  ) => {
    const request = ++sequence.current;
    try {
      setIsLoading(true);
      setError(null);
      const data = owned ? await ownedCatalogue('FIFA', page, size, (p, n) => playersApi.getAll(p, n, sortBy, sortDir)) : await playersApi.getAll(page, size, sortBy, sortDir);
      if (request !== sequence.current) return;
      setPlayers(data.content);
      const { content: _c, ...rest } = data;
      setPaged(rest);
    } catch {
      if (request !== sequence.current) return;
      setError('Error al cargar los jugadores');
    } finally {
      if (request === sequence.current) setIsLoading(false);
    }
  }, [owned]);

  const searchPlayers = useCallback(async (params: PlayerSearchParams) => {
    const request = ++sequence.current;
    try {
      setIsLoading(true);
      setError(null);
      const data = owned ? await ownedCatalogue('FIFA', params.page ?? 0, params.size ?? 12, (p, n) => playersApi.search({...params, page: p, size: n})) : await playersApi.search(params);
      if (request !== sequence.current) return;
      setPlayers(data.content);
      const { content: _c, ...rest } = data;
      setPaged(rest);
    } catch {
      if (request !== sequence.current) return;
      setError('Error al buscar jugadores');
    } finally {
      if (request === sequence.current) setIsLoading(false);
    }
  }, [owned]);

  return { players, paged, isLoading, error, fetchPlayers, searchPlayers };
};
