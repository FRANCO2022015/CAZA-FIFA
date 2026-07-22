import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Star, Trophy, Users, Calendar } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { playersApi } from '../api/players';
import { commentsApi } from '../api/comments';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import type { Player, Comment } from '../types';
import toast from 'react-hot-toast';

const positionColors: Record<string, string> = {
  PORTERO: '#f87171', DEFENSA: '#60a5fa',
  CENTROCAMPISTA: '#fbbf24', DELANTERO: '#4ade80',
};

const PlayerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [player, setPlayer] = useState<Player | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ contenido: '', rating: 5 });
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const p = await playersApi.getById(Number(id));
        setPlayer(p);
        const c = await commentsApi.getComments(Number(id), 0, 20);
        setComments(c.content);
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
    if (!player) return;
    try {
      setAddingToCart(true);
      await addToCart(player.id, 1);
      toast.success(`${player.nombre} añadido al carrito`);
    } catch { toast.error('Error al añadir al carrito'); }
    finally { setAddingToCart(false); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.contenido.trim()) return;
    try {
      setSubmittingComment(true);
      const c = await commentsApi.addComment(Number(id), newComment);
      setComments(prev => [c, ...prev]);
      setNewComment({ contenido: '', rating: 5 });
      toast.success('Comentario publicado');
    } catch { toast.error('Error al publicar el comentario'); }
    finally { setSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentsApi.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comentario eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  if (isLoading) return <Layout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;
  if (!player) return null;

  const latestStats = player.stats?.[0];

  return (
    <Layout>
      <button onClick={() => navigate('/players')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a jugadores
      </button>

      <div className="grid lg:grid-cols-3 gap-8 mb-10">
        {/* Left — image */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 flex flex-col items-center">
            <div className="w-48 h-48 rounded-2xl flex items-center justify-center mb-6 overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.15), rgba(255,101,132,0.1))' }}>
              {player.imagenUrl
                ? <img src={player.imagenUrl} alt={player.nombre} className="w-full h-full object-cover" />
                : <span className="text-6xl font-black gradient-text">{player.nombre.charAt(0)}</span>}
            </div>
            <span className="px-3 py-1 rounded-xl text-sm font-bold mb-4"
                  style={{ background: `${positionColors[player.posicion]}20`, color: positionColors[player.posicion] }}>
              {player.posicion}
            </span>
            <div className="text-3xl font-black text-white text-center mb-1"
                 style={{ textShadow: '0 0 20px rgba(108,99,255,0.3)' }}>
              ${player.precio.toLocaleString('es-ES')}
            </div>
            <p className="text-gray-400 text-sm mb-6">precio de mercado</p>
            <button onClick={handleAddToCart} disabled={addingToCart}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {addingToCart
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <ShoppingCart className="w-5 h-5" />}
              Añadir al carrito
            </button>
          </div>
        </div>

        {/* Right — info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card p-6">
            <h1 className="text-4xl font-black gradient-text mb-2">{player.nombre}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {[
                { icon: '🌍', label: 'Nacionalidad', value: player.nacionalidad },
                { icon: '🎂', label: 'Edad', value: `${player.edad} años` },
                { icon: '📋', label: 'Posición', value: player.posicion },
              ].map(({ icon, label, value }) => (
                <div key={label} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="text-lg mb-1">{icon}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                  <div className="text-sm font-semibold text-white mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          {player.stats && player.stats.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" /> Estadísticas
              </h2>
              {player.stats.map(stat => (
                <div key={stat.id} className="mb-4 pb-4 border-b last:border-0" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-sm text-purple-400 font-semibold mb-3">{stat.temporada}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Goles', value: stat.goles },
                      { label: 'Asistencias', value: stat.asistencias },
                      { label: 'Partidos', value: stat.partidosJugados },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center p-3 rounded-xl"
                           style={{ background: 'rgba(108,99,255,0.1)' }}>
                        <div className="text-2xl font-black text-white">{value}</div>
                        <div className="text-xs text-gray-400 mt-1">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" /> Comentarios ({comments.length})
        </h2>

        {/* Add comment form */}
        <form onSubmit={handleComment} className="mb-8 p-4 rounded-xl" style={{ background: 'rgba(108,99,255,0.06)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-300">Rating:</span>
            {[1,2,3,4,5].map(n => (
              <button key={n} type="button" onClick={() => setNewComment(p => ({ ...p, rating: n }))}>
                <Star className="w-5 h-5" fill={n <= newComment.rating ? '#fbbf24' : 'none'}
                      stroke={n <= newComment.rating ? '#fbbf24' : '#6b7280'} />
              </button>
            ))}
          </div>
          <textarea value={newComment.contenido} onChange={e => setNewComment(p => ({ ...p, contenido: e.target.value }))}
            placeholder="Comparte tu opinión sobre este jugador..."
            className="input-dark resize-none h-24 mb-3" maxLength={500} />
          <button type="submit" disabled={submittingComment} className="btn-primary px-6 py-2 text-sm">
            {submittingComment ? 'Publicando...' : 'Publicar comentario'}
          </button>
        </form>

        {/* Comment list */}
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold"
                   style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)', color: 'white' }}>
                {c.userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{c.userName}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className="w-3.5 h-3.5"
                              fill={n <= c.rating ? '#fbbf24' : 'none'}
                              stroke={n <= c.rating ? '#fbbf24' : '#6b7280'} />
                      ))}
                    </div>
                    {(user?.id === c.userId || user?.rol === 'ADMIN') && (
                      <button onClick={() => handleDeleteComment(c.id)}
                        className="text-xs text-red-400 hover:text-red-300">✕</button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-300">{c.contenido}</p>
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-center text-gray-500 py-6">Sé el primero en comentar sobre este jugador</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PlayerDetailPage;
