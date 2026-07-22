import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import Layout from '../components/layout/Layout';
import PostCard from '../components/forum/PostCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { forumApi } from '../api/forum';
import { useAuth } from '../hooks/useAuth';
import type { ForumThread, ForumPost } from '../types';
import toast from 'react-hot-toast';

const ForumThreadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  const [thread, setThread] = useState<ForumThread | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [t, p] = await Promise.all([
          forumApi.getThread(Number(id)),
          forumApi.getPostsByThread(Number(id)),
        ]);
        setThread(t);
        setPosts(p);
      } catch {
        toast.error('Hilo no encontrado');
        navigate('/forum');
      } finally { setIsLoading(false); }
    };
    load();
  }, [id, navigate]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    try {
      setSubmitting(true);
      const post = await forumApi.addPost(Number(id), { contenido: reply });
      setPosts(prev => [...prev, post]);
      setReply('');
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      toast.success('Respuesta publicada');
    } catch { toast.error('Error al publicar'); }
    finally { setSubmitting(false); }
  };

  const handleDeletePost = async (postId: number) => {
    try {
      await forumApi.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const handleDeleteThread = async () => {
    if (!thread) return;
    if (!confirm('¿Eliminar este hilo?')) return;
    try {
      await forumApi.deleteThread(thread.id);
      toast.success('Hilo eliminado');
      navigate('/forum');
    } catch { toast.error('Error al eliminar el hilo'); }
  };

  if (isLoading) return <Layout><div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div></Layout>;
  if (!thread) return null;

  const isOwnerOrAdmin = user?.id === thread.userId || user?.rol === 'ADMIN';

  return (
    <Layout>
      <button onClick={() => navigate('/forum')}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al foro
      </button>

      {/* Thread header */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white mb-2">{thread.titulo}</h1>
            <p className="text-gray-300">{thread.descripcion}</p>
            <p className="text-sm text-gray-500 mt-2">
              Por <span className="text-purple-400">{thread.userName}</span> ·{' '}
              {new Date(thread.fechaCreacion).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          {isOwnerOrAdmin && (
            <button onClick={handleDeleteThread}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 className="w-4 h-4" /> Eliminar hilo
            </button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-3 mb-6">
        {posts.length === 0 && (
          <div className="text-center py-10 text-gray-500">No hay respuestas aún. ¡Sé el primero!</div>
        )}
        {posts.map(post => (
          <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply form */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Tu respuesta</h3>
        <form onSubmit={handleReply} className="flex gap-3">
          <textarea value={reply} onChange={e => setReply(e.target.value)}
            placeholder="Escribe tu respuesta..." className="input-dark flex-1 resize-none h-20"
            maxLength={2000} />
          <button type="submit" disabled={submitting || !reply.trim()}
            className="btn-primary px-4 flex items-center gap-2 self-start">
            {submitting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default ForumThreadPage;
