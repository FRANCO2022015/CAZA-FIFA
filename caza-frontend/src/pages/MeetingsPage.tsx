import React, { useEffect, useState } from 'react';
import { Plus, Video, X, ExternalLink, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { meetingsApi } from '../api/meetings';
import { useAuth } from '../hooks/useAuth';
import type { Meeting } from '../types';
import toast from 'react-hot-toast';

const MeetingsPage: React.FC = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ url: '', tema: '', fechaInicio: '', fechaFin: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const data = await meetingsApi.getMeetings();
      setMeetings(data);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const meeting = await meetingsApi.createMeeting({
        ...form,
        fechaInicio: new Date(form.fechaInicio).toISOString(),
        fechaFin: new Date(form.fechaFin).toISOString(),
      });
      setMeetings(prev => [meeting, ...prev]);
      setForm({ url: '', tema: '', fechaInicio: '', fechaFin: '' });
      setShowModal(false);
      toast.success('Reunión creada');
    } catch { toast.error('Error al crear la reunión'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await meetingsApi.deleteMeeting(id);
      setMeetings(prev => prev.filter(m => m.id !== id));
      toast.success('Reunión eliminada');
    } catch { toast.error('Error al eliminar'); }
  };

  const formatDate = (str: string) =>
    new Date(str).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  if (isLoading) return <Layout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Reuniones</h1>
          <p className="text-gray-400 text-sm mt-1">Gestiona tus reuniones virtuales</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva reunión
        </button>
      </div>

      {meetings.length === 0 ? (
        <EmptyState
          icon={<Video className="w-8 h-8" />}
          title="No hay reuniones"
          description="Crea tu primera reunión virtual"
          action={{ label: 'Crear reunión', onClick: () => setShowModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {meetings.map(meeting => (
            <div key={meeting.id} className="glass-card player-card-hover p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(108,99,255,0.15)' }}>
                    <Video className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{meeting.tema}</h3>
                    <p className="text-xs text-gray-400">{meeting.userName}</p>
                  </div>
                </div>
                {(user?.id === meeting.userId || user?.rol === 'ADMIN') && (
                  <button onClick={() => handleDelete(meeting.id)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="space-y-1.5 text-sm text-gray-400">
                <div>🕐 <span className="text-gray-300">{formatDate(meeting.fechaInicio)}</span></div>
                <div>🏁 <span className="text-gray-300">{formatDate(meeting.fechaFin)}</span></div>
              </div>
              <a href={meeting.url} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2 btn-primary text-sm py-2.5 justify-center">
                <ExternalLink className="w-4 h-4" /> Unirse a la reunión
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
             onClick={() => setShowModal(false)}>
          <div className="glass-card-elevated w-full max-w-lg p-6 animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Nueva reunión</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Tema de la reunión</label>
                <input type="text" value={form.tema} onChange={e => setForm(p => ({ ...p, tema: e.target.value }))}
                  placeholder="Ej: Revisión de jugadores" className="input-dark" required />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">URL de la reunión</label>
                <input type="url" value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                  placeholder="https://meet.google.com/..." className="input-dark" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Inicio</label>
                  <input type="datetime-local" value={form.fechaInicio}
                    onChange={e => setForm(p => ({ ...p, fechaInicio: e.target.value }))}
                    className="input-dark" required />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Fin</label>
                  <input type="datetime-local" value={form.fechaFin}
                    onChange={e => setForm(p => ({ ...p, fechaFin: e.target.value }))}
                    className="input-dark" required />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Creando...' : 'Crear reunión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default MeetingsPage;
