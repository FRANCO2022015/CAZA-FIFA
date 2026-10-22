import { purchasesApi } from './purchases';
import type { PagedResponse } from '../types';
// Filter the complete matching catalogue BEFORE pagination, never just the visible page.
export async function ownedCatalogue<T extends {id: number}>(game: string, page: number, size: number, fetch: (page: number, size: number) => Promise<PagedResponse<T>>): Promise<PagedResponse<T>> {
  const purchases = await purchasesApi.getPurchases();
  const ids = new Set(purchases.flatMap(p => p.players.filter(x => (x.gameType ?? 'FIFA') === game).map(x => x.id)));
  const found = new Map<number, T>();
  if (ids.size) for (let n = 0; ; n++) {
    const batch = await fetch(n, 100);
    batch.content.forEach(p => { if (ids.has(p.id)) found.set(p.id, p); });
    if (batch.last || n + 1 >= batch.totalPages) break;
  }
  const rows = [...found.values()];
  const totalPages = Math.ceil(rows.length / size);
  return {content: rows.slice(page * size, (page + 1) * size), pageNo: page, pageSize: size, totalElements: rows.length, totalPages, last: page + 1 >= totalPages};
}
