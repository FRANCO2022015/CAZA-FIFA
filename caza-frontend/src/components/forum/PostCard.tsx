import React from 'react';
import { Trash2 } from 'lucide-react';
import type { ForumPost } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface PostCardProps {
  post: ForumPost;
  onDelete: (id: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const { user } = useAuth();
  const canDelete = user?.id === post.userId || user?.rol === 'ADMIN';

  const date = new Date(post.fechaPublicacion).toLocaleString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="glass-card p-5 flex gap-4 animate-fadeIn">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
           style={{ background: 'linear-gradient(135deg, #6C63FF, #FF6584)' }}>
        {post.userName.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-semibold text-white">{post.userName}</span>
            <span className="text-xs text-gray-500 ml-3">{date}</span>
          </div>
          {canDelete && (
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{post.contenido}</p>
      </div>
    </div>
  );
};

export default PostCard;
