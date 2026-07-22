import React from 'react';
import { Gamepad2, Trophy, Star, Target, Trash2, Pencil, ShoppingCart, DollarSign, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Jugador } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import toast from 'react-hot-toast';

interface JugadorCardProps {
  jugador: Jugador;
  onEdit?: (jugador: Jugador) => void;
  onDelete?: (id: number) => void;
}

// Formatea un decimal mostrando máximo 2 cifras significativas
const fmt = (v: number | undefined | null): string => {
  if (v == null) return '—';
  const n = Number(v);
  return isNaN(n) ? '—' : n.toFixed(2).replace(/\.?0+$/, '') || '0';
};

const JugadorCard: React.FC<JugadorCardProps> = ({ jugador, onEdit, onDelete }) => {
  const { user } = useAuth();
  const { addJugadorToCart } = useCart();
  const navigate = useNavigate();
  const isAdmin = user?.rol === 'ADMIN';

  // GA, PG, PA, PGA vienen calculados por PostgreSQL (columnas GENERATED ALWAYS)
  const ga  = jugador.ga;
  const pg  = jugador.pg;
  const pa  = jugador.pa;
  const pga = jugador.pga;

  const statRows = [
    { icon: <Trophy className="w-3.5 h-3.5 text-yellow-400" />, label: 'Goles',       value: jugador.goles },
    { icon: <Star   className="w-3.5 h-3.5 text-blue-400"   />, label: 'Asistencias', value: jugador.asistencias },
    { icon: <Target className="w-3.5 h-3.5 text-green-400"  />, label: 'Partidos',    value: jugador.partidos },
  ];

  const ratingRows = [
    { label: 'GA',  value: ga   ?? '—', hint: 'G + A' },
    { label: 'PG',  value: fmt(pg),      hint: 'Goles/Partido' },
    { label: 'PA',  value: fmt(pa),      hint: 'Asist./Partido' },
    { label: 'PGA', value: fmt(pga),     hint: '(G+A)/Partido' },
  ];

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addJugadorToCart(jugador.id, 1);
      toast.success(`${jugador.nombre} añadido al carrito 🎮`);
    } catch {
      toast.error('Error al añadir al carrito');
    }
  };

  return (
    <div
      className="glass-card p-5 flex flex-col gap-4 group transition-all duration-300 hover:scale-[1.02]"
      style={{ border: '1px solid rgba(255,165,0,0.15)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={jugador.imagenUrl ? { background: 'linear-gradient(135deg, #FF8C00, #FF4500)' } : { background: 'linear-gradient(135deg, #FF8C00, #FF4500)' }}
        >
          {jugador.imagenUrl ? (
            <img
              src={jugador.imagenUrl}
              alt={jugador.nombre}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={(e) => {
                // Si la imagen no carga, ocultar el img y mostrar el icono de fondo
                const img = e.currentTarget as HTMLImageElement;
                const parent = img.parentElement as HTMLElement;
                img.style.display = 'none';
                // Insertar el ícono de fallback si no existe ya
                if (!parent.querySelector('.fallback-icon')) {
                  const icon = document.createElement('span');
                  icon.className = 'fallback-icon';
                  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="18" y2="12"/><line x1="12" y1="6" x2="12" y2="18"/><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="17" cy="10" r="1" fill="white" stroke="none"/><circle cx="19" cy="12" r="1" fill="white" stroke="none"/></svg>`;
                  parent.appendChild(icon);
                }
              }}
            />
          ) : (
            <Gamepad2 className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-white truncate group-hover:text-orange-400 transition-colors">
            {jugador.nombre}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="inline-block px-2 py-0.5 rounded-md text-xs font-semibold"
              style={{ background: 'rgba(255,140,0,0.2)', color: '#FF8C00' }}
            >
              eFootball
            </span>
            {jugador.precio != null && (
              <span className="flex items-center gap-0.5 text-xs font-bold text-green-400">
                <DollarSign className="w-3 h-3" />
                {Number(jugador.precio).toLocaleString('es-ES')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats principales: G / A / P */}
      <div className="flex justify-between">
        {statRows.map(({ icon, label, value }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              {icon}
              <span className="text-lg font-black text-white">{value}</span>
            </div>
            <span className="text-[11px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Separador */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      {/* Promedios calculados: GA, PG, PA, PGA */}
      <div className="grid grid-cols-4 gap-2">
        {ratingRows.map(({ label, value, hint }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-0.5 rounded-lg p-2"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            title={hint}
          >
            <span className="text-xs font-bold text-white">{value}</span>
            <span className="text-[10px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Acciones */}
      {user && (
        <div className="flex gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
          {/* Agregar al carrito — disponible para todos los usuarios */}
          <button
            onClick={handleAddToCart}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #FF8C00, #FF4500)' }}
            title="Agregar al carrito"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>

          {/* Botón Ver */}
          <button
            onClick={() => navigate(`/efootball/${jugador.id}`)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            title="Ver detalle del jugador"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver
          </button>

          {/* Actualizar stats — todos los usuarios */}
          <button
            onClick={() => onEdit?.(jugador)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Actualizar Stats
          </button>

          {/* Eliminar — solo admin */}
          {isAdmin && (
            <button
              onClick={() => onDelete?.(jugador.id)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-white hover:bg-red-500/20 transition-all duration-200"
              style={{ border: '1px solid rgba(255,100,100,0.2)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default JugadorCard;
