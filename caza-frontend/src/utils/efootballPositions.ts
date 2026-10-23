export const EFOOTBALL_POSITIONS = ['PO', 'DEF', 'LI', 'LD', 'MC', 'MCD', 'MO', 'MDI', 'MDD', 'EXI', 'EXD', 'DC', 'SD'] as const;
export type EfootballPosition = typeof EFOOTBALL_POSITIONS[number];

export function positionBadgeClass(position?: EfootballPosition | null): string {
  if (position === 'PO') return 'text-red-300 bg-red-950/80 border-red-400/40';
  if (position && ['DEF', 'LI', 'LD'].includes(position)) return 'text-blue-300 bg-blue-950/80 border-blue-400/40';
  if (position && ['MC', 'MCD', 'MO', 'MDI', 'MDD'].includes(position)) return 'text-yellow-300 bg-yellow-950/80 border-yellow-400/40';
  if (position && ['EXI', 'EXD', 'DC', 'SD'].includes(position)) return 'text-green-300 bg-green-950/80 border-green-400/40';
  return 'text-gray-300 bg-gray-950/80 border-gray-400/40';
}
