import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingCart, Trophy, MessageSquare, Coins, TrendingUp, Gamepad2, Wallet, CheckCircle2, Clock, XCircle, Send } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { playersApi } from '../api/players';
import { purchasesApi } from '../api/purchases';
import { forumApi } from '../api/forum';
import { saldoRequestsApi, type SaldoRequestItem } from '../api/saldoRequests';
import toast from 'react-hot-toast';

const estadoBadge: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDIENTE:  { label: 'Pendiente',  color: '#f59e0b', icon: <Clock className="w-3 h-3" /> },
  APROBADA:   { label: 'Aprobada',   color: '#22c55e', icon: <CheckCircle2 className="w-3 h-3" /> },
  RECHAZADA:  { label: 'Rechazada',  color: '#ef4444', icon: <XCircle className="w-3 h-3" /> },
};

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { cart } = useCart();
  const [stats, setStats] = useState({ players: 0, purchases: 0, threads: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Saldo request state
  const [mySolicitudes, setMySolicitudes] = useState<SaldoRequestItem[]>([]);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestMonto, setRequestMonto] = useState('');
  const [requestMensaje, setRequestMensaje] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, pur, f, sol] = await Promise.all([
          playersApi.getAll(0, 1),
          purchasesApi.getPurchases(),
          forumApi.getThreads(0, 1),
          saldoRequestsApi.getMine(),
        ]);
        setStats({ players: p.totalElements, purchases: pur.length, threads: f.totalElements });
        setMySolicitudes(sol);
      } catch { /* fail silently */ }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(requestMonto);
    if (!monto || monto <= 0) { toast.error('Ingresa un monto válido'); return; }
    setSubmittingRequest(true);
    try {
      const nueva = await saldoRequestsApi.create({ montoSolicitado: monto, mensaje: requestMensaje || undefined });
      setMySolicitudes(prev => [nueva, ...prev]);
      setShowRequestForm(false);
      setRequestMonto('');
      setRequestMensaje('');
      toast.success('¡Solicitud enviada! El admin la revisará pronto.');
    } catch {
      toast.error('Error al enviar la solicitud');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const statCards = [
    { icon: Users,        label: 'Jugadores disponibles', value: stats.players,         color: '#6C63FF', to: '/players' },
    { icon: ShoppingCart, label: 'Items en carrito',       value: cart?.itemCount ?? 0,  color: '#FF6584', to: '/cart' },
    { icon: Trophy,       label: 'Compras realizadas',     value: stats.purchases,       color: '#43E97B', to: '/purchases' },
    { icon: MessageSquare,label: 'Hilos en el foro',       value: stats.threads,         color: '#38BDF8', to: '/forum' },
  ];

  const quickActions = [
    { icon: '⚽', label: 'Jugadores FIFA',   to: '/players',  color: '#6C63FF' },
    { icon: '🎮', label: 'eFootball',        to: '/players',  color: '#FF8C00' },
    { icon: '💬', label: 'Foro Comunidad',   to: '/forum',    color: '#FF6584' },
    { icon: '🏆', label: 'Mis Compras',      to: '/purchases',color: '#43E97B' },
  ];

  if (isLoading) return (
    <Layout>
      <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
    </Layout>
  );

  const pendientes = mySolicitudes.filter(s => s.estado === 'PENDIENTE').length;

  return (
    <Layout>
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl p-8 mb-8"
           style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.2) 0%, rgba(255,101,132,0.1) 100%)', border: '1px solid rgba(108,99,255,0.2)' }}>
        <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full opacity-5"
             style={{ background: 'radial-gradient(circle, #6C63FF, transparent)' }} />
        <div className="relative z-10">
          <p className="text-gray-400 mb-1">Bienvenido de vuelta,</p>
          <h1 className="text-4xl font-black mb-4">
            <span className="text-white">{user?.nombre} </span>
            <span className="gradient-text">🏆</span>
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                 style={{ background: 'rgba(67,233,123,0.15)', border: '1px solid rgba(67,233,123,0.3)' }}>
              <Coins className="w-5 h-5 text-green-400" />
              <span className="text-lg font-bold text-green-400">
                ${(user?.saldo ?? 0).toLocaleString('es-ES')} saldo
              </span>
            </div>
            {user?.rol === 'ADMIN' && (
              <span className="px-3 py-1 rounded-lg text-xs font-bold text-yellow-400"
                    style={{ background: 'rgba(234,179,8,0.15)' }}>⭐ ADMIN</span>
            )}
            {pendientes > 0 && (
              <span className="px-3 py-1 rounded-lg text-xs font-bold text-amber-400"
                    style={{ background: 'rgba(245,158,11,0.15)' }}>
                ⏳ {pendientes} solicitud{pendientes > 1 ? 'es' : ''} pendiente{pendientes > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ icon: Icon, label, value, color, to }) => (
          <Link key={label} to={to}>
            <div className="glass-card p-5 player-card-hover">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: `${color}20` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <TrendingUp className="w-4 h-4 text-gray-600" />
              </div>
              <div className="text-2xl font-black text-white">{value}</div>
              <div className="text-xs text-gray-400 mt-1">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-lg font-bold text-white mb-4">Acceso rápido</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map(({ icon, label, to, color }) => (
          <Link key={label} to={to}>
            <div className="glass-card p-6 text-center player-card-hover">
              <div className="text-3xl mb-3">{icon}</div>
              <div className="text-sm font-semibold text-gray-300">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Solicitar más saldo ──────────────────────────────────────────────── */}
      <div className="glass-card p-6 mb-8" style={{ border: '1px solid rgba(67,233,123,0.15)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(67,233,123,0.15)' }}>
              <Wallet className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Solicitar más saldo</h2>
              <p className="text-xs text-gray-400">Pide al administrador que aumente tu saldo</p>
            </div>
          </div>
          <button
            onClick={() => setShowRequestForm(v => !v)}
            className="px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #43E97B, #38f9d7)', color: '#000' }}
          >
            + Nueva solicitud
          </button>
        </div>

        {/* Formulario */}
        {showRequestForm && (
          <form onSubmit={handleSendRequest} className="mb-4 p-4 rounded-xl space-y-3"
                style={{ background: 'rgba(67,233,123,0.06)', border: '1px solid rgba(67,233,123,0.15)' }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Monto solicitado *
                </label>
                <input
                  type="number" min={1} required
                  placeholder="Ej: 5000"
                  value={requestMonto}
                  onChange={e => setRequestMonto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">
                  Mensaje (opcional)
                </label>
                <input
                  type="text" maxLength={300}
                  placeholder="¿Por qué necesitas más saldo?"
                  value={requestMensaje}
                  onChange={e => setRequestMensaje(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowRequestForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                Cancelar
              </button>
              <button type="submit" disabled={submittingRequest}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #43E97B, #38f9d7)' }}>
                {submittingRequest
                  ? <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  : <Send className="w-3.5 h-3.5" />}
                Enviar
              </button>
            </div>
          </form>
        )}

        {/* Historial de solicitudes */}
        {mySolicitudes.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Mis solicitudes</p>
            {mySolicitudes.slice(0, 5).map(sol => {
              const badge = estadoBadge[sol.estado];
              return (
                <div key={sol.id} className="flex items-center justify-between px-4 py-3 rounded-xl"
                     style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <span className="text-white font-bold">${Number(sol.montoSolicitado).toLocaleString('es-ES')}</span>
                    {sol.mensaje && <span className="text-gray-400 text-xs ml-2">— {sol.mensaje}</span>}
                  </div>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold"
                        style={{ background: `${badge.color}20`, color: badge.color }}>
                    {badge.icon} {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No has enviado solicitudes aún. Haz clic en "+ Nueva solicitud" para comenzar.
          </p>
        )}
      </div>

      {/* Admin quick access */}
      {user?.rol === 'ADMIN' && (
        <div className="glass-card p-5" style={{ border: '1px solid rgba(234,179,8,0.2)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xl">⭐</span>
            <h2 className="text-base font-bold text-yellow-400">Panel de Administración</h2>
          </div>
          <Link to="/admin"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
            style={{ background: 'rgba(234,179,8,0.15)', color: '#facc15', border: '1px solid rgba(234,179,8,0.25)' }}>
            <Gamepad2 className="w-4 h-4" /> Ir al panel de administrador
          </Link>
        </div>
      )}
    </Layout>
  );
};

export default DashboardPage;
