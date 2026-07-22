import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Star, Trophy } from 'lucide-react';
import type { Player } from '../../types';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

interface PlayerCardProps {
  player: Player;
}

const positionColors: Record<string, string> = {
  PORTERO: 'badge-portero',
  DEFENSA: 'badge-defensa',
  CENTROCAMPISTA: 'badge-centrocampista',
  DELANTERO: 'badge-delantero',
};

const positionLabels: Record<string, string> = {
  PORTERO: 'POR',
  DEFENSA: 'DEF',
  CENTROCAMPISTA: 'MED',
  DELANTERO: 'DEL',
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(player.id, 1);
      toast.success(`${player.nombre} añadido al carrito`);
    } catch {
      toast.error('Error al añadir al carrito');
    }
  };

  // Acumulado de todas las temporadas
  const totalStats = (player.stats ?? []).reduce(
    (acc, s) => ({
      goles: acc.goles + (s.goles ?? 0),
      asistencias: acc.asistencias + (s.asistencias ?? 0),
      partidos: acc.partidos + (s.partidosJugados ?? 0),
    }),
    { goles: 0, asistencias: 0, partidos: 0 }
  );
  const hasStats = (player.stats?.length ?? 0) > 0;

  return (
    <div className="glass-card player-card-hover p-5 flex flex-col gap-4 cursor-pointer group"
         onClick={() => navigate(`/players/${player.id}`)}>
      
      {/* Avatar / Image */}
      <div className="relative">
        <div className="w-full h-44 rounded-xl overflow-hidden flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(255,101,132,0.1))' }}>
          {player.imagenUrl ? (
            <img src={player.imagenUrl} alt={player.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 opacity-60">
              <div className="text-5xl font-black gradient-text">{positionLabels[player.posicion]}</div>
              <div className="text-gray-400 text-4xl">⚽</div>
            </div>
          )}
        </div>
        {/* Position Badge */}
        <span className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold ${positionColors[player.posicion]}`}>
          {positionLabels[player.posicion]}
        </span>
        {/* Price Badge */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-lg text-sm font-bold text-white"
             style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}>
          ${player.precio.toLocaleString('es-ES')}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="text-lg font-bold text-white truncate group-hover:gradient-text transition-all">
          {player.nombre}
        </h3>
        <p className="text-sm text-gray-400 mt-0.5">{player.nacionalidad} · {player.edad} años</p>

        {/* Stats acumuladas de todas las temporadas */}
        {hasStats && (
          <div className="flex gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs text-gray-300 font-medium">{totalStats.goles} goles</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-gray-300 font-medium">{totalStats.asistencias} asist.</span>
            </div>
            {player.stats && player.stats.length > 1 && (
              <span className="text-[10px] text-gray-500 self-center">
                ({player.stats.length} temp.)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Link
          to={`/players/${player.id}`}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all duration-200"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Eye className="w-4 h-4" />
          Ver
        </Link>
        <button
          onClick={handleAddToCart}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #6C63FF, #9C63FF)' }}
        >
          <ShoppingCart className="w-4 h-4" />
          Carrito
        </button>
      </div>
    </div>
  );
};

export default PlayerCard;
