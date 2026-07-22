import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, ArrowLeft, Trophy, Star, Target,
  TrendingUp, Gamepad2, DollarSign,
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { jugadoresApi } from '../api/jugadores';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import type { Jugador } from '../types';
import toast from 'react-hot-toast';

const fmt = (v: number | undefined | null): string => {
  if (v == null) return '—';
  const n = Number(v);
  return isNaN(n) ? '—' : n.toFixed(2).replace(/\.?0+$/, '') || '0';
};

const JugadorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addJugadorToCart } = useCart();

  const [jugador, setJugador] = useState<Jugador | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const j = await jugadoresApi.getById(Number(id));
        setJugador(j);
      } catch {
        toast.error('Error al cargar el jugador');
        navigate('/players');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!jugador) return;
    try {
      setAddingToCart(true);
      await addJugadorToCart(jugador.id, 1);
      toast.success(`${jugador.nombre} añadido al carrito 🎮`);
    } catch {
      toast.error('Error al añadir al carrito');
    } finally {
      setAddingToCart(false);
    }
  };

  if (isLoading) return (
    <Layout>
      <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
    </Layout>
  );
  if (!jugador) return null;

  const statItems = [
    { icon: <Trophy className="w-5 h-5 text-yellow-400" />, label: 'Goles', value: jugador.goles, big: true },
    { icon: <Star className="w-5 h-5 text-blue-400" />, label: 'Asistencias', value: jugador.asistencias, big: true },
    { icon: <Target className="w-5 h-5 text-green-400" />, label: 'Partidos', value: jugador.partidos, big: true },
  ];

  const ratingItems = [
    { label: 'GA',  value: jugador.ga ?? '—',    hint: 'Goles + Asistencias', color: '#f59e0b' },
    { label: 'PG',  value: fmt(jugador.pg),        hint: 'Goles por partido',   color: '#6C63FF' },
    { label: 'PA',  value: fmt(jugador.pa),        hint: 'Asist. por partido',  color: '#22c55e' },
    { label: 'PGA', value: fmt(jugador.pga),       hint: '(G+A) por partido',   color: '#FF6584' },
  ];

  return (
    <Layout>
      <button
        onClick={() => navigate('/players')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a jugadores
      </button>

      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        {/* Left — imagen / acción */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 flex flex-col items-center"
               style={{ border: '1px solid rgba(255,140,0,0.2)' }}>

            {/* Avatar / foto */}
            <div
              className="w-48 h-48 rounded-2xl flex items-center justify-center mb-6 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(255,140,0,0.25), rgba(255,69,0,0.15))' }}
            >
              {jugador.imagenUrl ? (
                <img
                  src={jugador.imagenUrl}
                  alt={jugador.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Gamepad2 className="w-20 h-20 text-orange-400 opacity-60" />
              )}
            </div>

            {/* Badge eFootball */}
            <span
              className="px-3 py-1 rounded-xl text-sm font-bold mb-4"
              style={{ background: 'rgba(255,140,0,0.2)', color: '#FF8C00' }}
            >
              🎮 eFootball
            </span>

            {/* Precio */}
            {jugador.precio != null && (
              <>
                <div
                  className="text-3xl font-black text-white text-center mb-1"
                  style={{ textShadow: '0 0 20px rgba(255,140,0,0.3)' }}
                >
                  ${Number(jugador.precio).toLocaleString('es-ES')}
                </div>
                <p className="text-gray-400 text-sm mb-6">precio de mercado</p>
              </>
            )}

            {/* Botón carrito */}
            {user && (
              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #FF8C00, #FF4500)' }}
              >
                {addingToCart
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <ShoppingCart className="w-5 h-5" />}
                Añadir al carrito
              </button>
            )}
          </div>
        </div>

        {/* Right — info */}
        <div className="lg:col-span-2 space-y-6">

          {/* Nombre */}
          <div className="glass-card p-6" style={{ border: '1px solid rgba(255,140,0,0.15)' }}>
            <h1
              className="text-4xl font-black mb-4"
              style={{ background: 'linear-gradient(135deg, #FF8C00, #FF4500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
            >
              {jugador.nombre}
            </h1>

            {/* Estadísticas principales */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              {statItems.map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="flex flex-col items-center py-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-center gap-2 mb-1">{icon}</div>
                  <div className="text-3xl font-black text-white">{value}</div>
                  <div className="text-xs text-gray-400 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas avanzadas */}
          <div className="glass-card p-6" style={{ border: '1px solid rgba(255,140,0,0.15)' }}>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-400" /> Métricas avanzadas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {ratingItems.map(({ label, value, hint, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center py-4 rounded-xl"
                  title={hint}
                  style={{ background: `${color}10`, border: `1px solid ${color}25` }}
                >
                  <div className="text-2xl font-black" style={{ color }}>{value}</div>
                  <div className="text-xs font-bold mt-1" style={{ color }}>{label}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5 text-center px-1">{hint}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default JugadorDetailPage;
