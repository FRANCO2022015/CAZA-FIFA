import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle2, XCircle, Clock, Wallet, ShoppingBag, ArrowLeft, RefreshCw } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { saldoRequestsApi, adminApi, type SaldoRequestItem } from '../api/saldoRequests';
import toast from 'react-hot-toast';

type Tab = 'solicitudes' | 'usuarios';

const estadoBadge: Record<string, { label: string; color: string }> = {
  PENDIENTE:  { label: 'Pendiente',  color: '#f59e0b' },
  APROBADA:   { label: 'Aprobada',   color: '#22c55e' },
  RECHAZADA:  { label: 'Rechazada',  color: '#ef4444' },
};

const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>('solicitudes');
  const [solicitudes, setSolicitudes] = useState<SaldoRequestItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Leer el usuario directamente desde localStorage como fallback
  // (evita problemas de timing con React state después de window.location.href)
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('caza_user') || 'null'); }
    catch { return null; }
  })();
  const effectiveUser = user ?? storedUser;

  // Guard: solo admin
  useEffect(() => {
    if (!effectiveUser) {
      navigate('/admin/login');
      return;
    }
    if (effectiveUser.rol !== 'ADMIN') {
      toast.error('Acceso denegado');
      navigate('/dashboard');
    }
  }, []); // eslint-disable-line

  const load = async () => {
    setIsLoading(true);
    try {
      const [sol, us] = await Promise.all([
        saldoRequestsApi.getAll(),
        adminApi.getUsers(),
      ]);
      setSolicitudes(sol ?? []);
      setUsers(us ?? []);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Error cargando datos';
      toast.error(msg);
      setSolicitudes([]);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveUser?.rol === 'ADMIN') {
      load();
    }
  }, []); // eslint-disable-line

  const handleAprobar = async (id: number) => {
    setProcessingId(id);
    try {
      const updated = await saldoRequestsApi.aprobar(id);
      setSolicitudes(prev => prev.map(s => s.id === id ? updated : s));
      toast.success(`✅ Solicitud aprobada — saldo actualizado`);
    } catch {
      toast.error('Error al aprobar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRechazar = async (id: number) => {
    setProcessingId(id);
    try {
      const updated = await saldoRequestsApi.rechazar(id);
      setSolicitudes(prev => prev.map(s => s.id === id ? updated : s));
      toast.success('Solicitud rechazada');
    } catch {
      toast.error('Error al rechazar la solicitud');
    } finally {
      setProcessingId(null);
    }
  };

  const pendientes = solicitudes.filter(s => s.estado === 'PENDIENTE');

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    borderRadius: '12px',
    padding: '10px 14px',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
  };

  const tabStyle = (active: boolean, color: string) => ({
    padding: '10px 20px',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    ...(active
      ? { background: `${color}25`, color, border: `1px solid ${color}40` }
      : { background: 'rgba(255,255,255,0.04)', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }),
  });

  if (isLoading) return (
    <Layout>
      <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
    </Layout>
  );

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-black text-white">
            Panel de <span style={{ color: '#facc15' }}>Administración</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona usuarios y solicitudes de saldo</p>
        </div>
        <button onClick={load}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-400 hover:text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total usuarios',  value: users.length,                          color: '#6C63FF', icon: Users },
          { label: 'Solicitudes',     value: solicitudes.length,                    color: '#38BDF8', icon: Wallet },
          { label: 'Pendientes',      value: pendientes.length,                     color: '#f59e0b', icon: Clock },
          { label: 'Aprobadas',       value: solicitudes.filter(s => s.estado === 'APROBADA').length, color: '#22c55e', icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{value}</div>
            <div className="text-xs text-gray-400 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button style={tabStyle(tab === 'solicitudes', '#f59e0b')} onClick={() => setTab('solicitudes')}>
          <span className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Solicitudes de Saldo
            {pendientes.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-500 text-black font-black">
                {pendientes.length}
              </span>
            )}
          </span>
        </button>
        <button style={tabStyle(tab === 'usuarios', '#6C63FF')} onClick={() => setTab('usuarios')}>
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Usuarios ({users.length})
          </span>
        </button>
      </div>

      {/* ── Tab: Solicitudes ── */}
      {tab === 'solicitudes' && (
        <div className="space-y-3">
          {solicitudes.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay solicitudes de saldo todavía.</p>
            </div>
          ) : (
            solicitudes.map(sol => {
              const badge = estadoBadge[sol.estado];
              const isPending = sol.estado === 'PENDIENTE';
              const isProcessing = processingId === sol.id;
              return (
                <div key={sol.id}
                  className="glass-card p-5"
                  style={isPending ? { border: '1px solid rgba(245,158,11,0.25)' } : {}}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                             style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}>
                          {sol.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{sol.userName}</p>
                          <p className="text-gray-400 text-xs">{sol.userCorreo}</p>
                        </div>
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ml-auto"
                              style={{ background: `${badge.color}20`, color: badge.color }}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="pl-12">
                        <p className="text-green-400 text-xl font-black">
                          +${Number(sol.montoSolicitado).toLocaleString('es-ES')}
                        </p>
                        {sol.mensaje && (
                          <p className="text-gray-400 text-sm mt-1 italic">"{sol.mensaje}"</p>
                        )}
                        <p className="text-gray-600 text-xs mt-2">
                          {new Date(sol.fechaSolicitud).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                    {/* Acciones */}
                    {isPending && (
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleAprobar(sol.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg, #22c55e, #43E97B)' }}>
                          {isProcessing
                            ? <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            : <CheckCircle2 className="w-3.5 h-3.5" />}
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleRechazar(sol.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50"
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>
                          <XCircle className="w-3.5 h-3.5" /> Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Tab: Usuarios ── */}
      {tab === 'usuarios' && (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="glass-card px-5 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                   style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}>
                {u.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-bold text-sm truncate">{u.nombre}</p>
                  {u.rol === 'ADMIN' && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold text-yellow-400"
                          style={{ background: 'rgba(234,179,8,0.15)' }}>ADMIN</span>
                  )}
                </div>
                <p className="text-gray-400 text-xs truncate">{u.correo}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-green-400 font-bold text-sm">
                  ${Number(u.saldo ?? 0).toLocaleString('es-ES')}
                </p>
                <p className="text-gray-500 text-xs">saldo</p>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${u.activo ? 'bg-green-400' : 'bg-red-400'}`}
                   title={u.activo ? 'Activo' : 'Inactivo'} />
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default AdminPage;
