import { playersApi } from './players';
import { jugadoresApi } from './jugadores';
import type { PagedResponse } from '../types';
async function allPages<T>(fetch: (page: number, size: number) => Promise<PagedResponse<T>>): Promise<T[]> {
  const result: T[] = [];
  for (let page = 0; ; page++) {
    const data = await fetch(page, 100);
    result.push(...data.content);
    if (data.last || page + 1 >= data.totalPages) return result;
  }
}
export const allFifaPlayers = () => allPages(playersApi.getAll);
export const allEfootballPlayers = () => allPages(jugadoresApi.getAll);
