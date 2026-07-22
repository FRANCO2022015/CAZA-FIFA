import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, User, Clock, ChevronRight } from 'lucide-react';
import type { ForumThread } from '../../types';

interface ThreadCardProps {
  thread: ForumThread;
}

const ThreadCard: React.FC<ThreadCardProps> = ({ thread }) => {
  const date = new Date(thread.fechaCreacion).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <Link to={`/forum/${thread.id}`} className="block">
      <div className="glass-card player-card-hover p-5 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
             style={{ background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.2)' }}>
          <MessageSquare className="w-5 h-5 text-purple-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate">{thread.titulo}</h3>
          <p className="text-sm text-gray-400 line-clamp-1 mt-0.5">{thread.descripcion}</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <User className="w-3.5 h-3.5" />
              {thread.userName}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              {date}
            </div>
          </div>
        </div>

        {/* Post count & arrow */}
        <div className="flex-shrink-0 flex items-center gap-3">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{thread.postCount}</div>
            <div className="text-xs text-gray-500">posts</div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    </Link>
  );
};

export default ThreadCard;
