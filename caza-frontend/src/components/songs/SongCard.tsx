import React from 'react';
import { Music, Clock } from 'lucide-react';
import type { Song } from '../../types';

const genreColors: Record<string, { bg: string; text: string }> = {
  pop:     { bg: 'rgba(255, 101, 132, 0.15)', text: '#FF6584' },
  rock:    { bg: 'rgba(239, 68, 68, 0.15)',   text: '#f87171' },
  reggaeton: { bg: 'rgba(234, 179, 8, 0.15)', text: '#fbbf24' },
  electronic: { bg: 'rgba(108, 99, 255, 0.15)', text: '#a78bfa' },
  jazz:    { bg: 'rgba(59, 130, 246, 0.15)',  text: '#60a5fa' },
  clasica: { bg: 'rgba(34, 197, 94, 0.15)',   text: '#4ade80' },
  default: { bg: 'rgba(255, 255, 255, 0.08)', text: '#9ca3af' },
};

interface SongCardProps {
  song: Song;
}

const SongCard: React.FC<SongCardProps> = ({ song }) => {
  const genreKey = (song.genero ?? '').toLowerCase();
  const colors = genreColors[genreKey] ?? genreColors.default;

  return (
    <div className="glass-card player-card-hover p-5 flex items-center gap-4">
      {/* Music icon */}
      <div
        className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: colors.bg, border: `1px solid ${colors.text}33` }}
      >
        <Music className="w-5 h-5" style={{ color: colors.text }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-white truncate">{song.titulo}</h3>
        <p className="text-xs text-gray-400 truncate mt-0.5">{song.artista} · {song.album}</p>
        <div className="flex items-center gap-2 mt-2">
          <span
            className="px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ background: colors.bg, color: colors.text }}
          >
            {song.genero}
          </span>
          <span className="text-xs text-gray-500">{song.anio}</span>
        </div>
      </div>

      {/* Duration */}
      {song.duracion && (
        <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          {song.duracion}
        </div>
      )}
    </div>
  );
};

export default SongCard;
