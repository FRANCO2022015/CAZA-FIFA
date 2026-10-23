import { positionBadgeClass } from '../../utils/efootballPositions';
import React, { useState } from 'react';
import { Gamepad2, Trophy, Star, Trash2, Pencil, ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Jugador } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

interface JugadorCardProps {
  jugador: Jugador;
  onEdit?: (jugador: Jugador) => void;
  onDelete?: (id: number) => void;
}

const JugadorCard: React.FC<JugadorCardProps> = ({ jugador, onEdit, onDelete }) => {
  const { user } = useAuth();
  const { addJugadorToCart } = useCart();
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const isAdmin = user?.rol === 'ADMIN';
  const detailUrl = `/efootball/${jugador.id}`;

  const handleAddToCart = async () => {
    try {
      await addJugadorToCart(jugador.id, 1);
      toast.success(`${jugador.nombre} añadido al carrito 🎮`);
    } catch {
      toast.error('Error al añadir al carrito');
    }
  };

  return (
    <div className="glass-card player-card-hover p-5 flex flex-col gap-4 group"
      style={{ border: '1px solid rgba(255,165,0,0.15)' }}>
      <Link to={detailUrl} className="flex flex-col gap-4 flex-1 min-w-0">
        <div className="relative">
          <div className="w-full h-44 rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,140,0,0.15), rgba(255,69,0,0.1))' }}>
            {jugador.imagenUrl && failedImage !== jugador.imagenUrl ? (
              <img src={jugador.imagenUrl} alt={jugador.nombre} className="w-full h-full object-contain"
                loading="lazy" onError={() => setFailedImage(jugador.imagenUrl ?? null)} />
            ) : <Gamepad2 className="w-14 h-14 text-orange-400/60" aria-hidden="true" />}
          </div>
          <span className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold border ${positionBadgeClass(jugador.posicion)}`}>
            {jugador.posicion ?? 'Sin posición'}
          </span>
          {jugador.precio != null && (
            <span className="absolute bottom-3 right-3 px-3 py-1 rounded-lg text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #FF8C00, #FF4500)' }}>
              ${Number(jugador.precio).toLocaleString('es-ES')}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate group-hover:text-orange-400 transition-colors" title={jugador.nombre}>
            {jugador.nombre}
          </h3>
          <div className="flex gap-x-3 gap-y-1 mt-3 flex-wrap items-center">
            <span className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
              <Trophy className="w-3.5 h-3.5 text-yellow-400" aria-hidden="true" />{jugador.goles} goles
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
              <Star className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />{jugador.asistencias} asist.
            </span>
            <span className="text-[10px] text-gray-400">({jugador.partidos} {jugador.partidos === 1 ? 'partido' : 'partidos'})</span>
          </div>
        </div>
      </Link>
      <div className="flex gap-2">
        <Link to={detailUrl} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
          <Eye className="w-4 h-4" aria-hidden="true" />Ver
        </Link>
        {user && <button type="button" onClick={() => void handleAddToCart()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #FF8C00, #FF4500)' }}>
          <ShoppingCart className="w-4 h-4" aria-hidden="true" />Carrito
        </button>}
      </div>
      {isAdmin && <div className="flex gap-2 border-t border-white/5 pt-3">
        <button type="button" onClick={() => onEdit?.(jugador)} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-xs py-2">
          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />Editar
        </button>
        <button type="button" onClick={() => onDelete?.(jugador.id)} aria-label={`Archivar a ${jugador.nombre}`}
          className="px-3 py-2 rounded-xl text-red-400 hover:bg-red-500/10 border border-red-400/20">
          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>}
      {user && !isAdmin && <Link to={detailUrl} className="text-xs text-gray-400 hover:text-orange-300 text-center">Solicitar cambio</Link>}
    </div>
  );
};

export default JugadorCard;
