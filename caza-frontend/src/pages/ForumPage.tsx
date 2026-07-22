import React, { useEffect, useState } from 'react';
import { Plus, MessageSquare, X } from 'lucide-react';
import Layout from '../components/layout/Layout';
import ThreadCard from '../components/forum/ThreadCard';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { forumApi } from '../api/forum';
import type { ForumThread } from '../types';
import toast from 'react-hot-toast';

const ForumPage: React.FC = () => {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titulo: '', descripcion: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async (page = 0) => {
    try {
      setIsLoading(true);
      const data = await forumApi.getThreads(page, 10);
      setThreads(data.content);
      setTotalPages(data.totalPages);
      setCurrentPage(page);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const thread = await forumApi.createThread(form);
      setThreads(prev => [thread, ...prev]);
      setForm({ titulo: '', descripcion: '' });
      setShowModal(false);
      toast.success('¡Hilo creado exitosamente!');
    } catch { toast.error('Error al crear el hilo'); }
    finally { setSubmitting(false); }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Foro</h1>
          <p className="text-gray-400 text-sm mt-1">Comparte y debate con la comunidad</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo hilo
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : threads.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-8 h-8" />}
          title="No hay hilos aún"
          description="¡Sé el primero en crear un hilo de discusión!"
          action={{ label: 'Crear hilo', onClick: () => setShowModal(true) }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {threads.map(thread => <ThreadCard key={thread.id} thread={thread} />)}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={load} />
        </>
      )}

      {/* Create thread modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
             onClick={() => setShowModal(false)}>
          <div className="glass-card-elevated w-full max-w-lg p-6 animate-slideUp"
               onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Crear nuevo hilo</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Título</label>
                <input type="text" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="¿De qué quieres hablar?" className="input-dark" required maxLength={200} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Describe el tema del hilo..." className="input-dark resize-none h-28" required maxLength={2000} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                  {submitting ? 'Creando...' : 'Crear hilo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ForumPage;
