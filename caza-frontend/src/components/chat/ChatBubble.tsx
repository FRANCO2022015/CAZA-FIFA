import React from 'react';
import { Bot } from 'lucide-react';
import type { ChatMessage } from '../../types';

interface ChatBubbleProps {
  message: ChatMessage;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const time = new Date(message.fecha).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* User message — right */}
      <div className="flex justify-end">
        <div className="max-w-[75%]">
          <div
            className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white leading-relaxed"
            style={{ background: 'linear-gradient(135deg, #6C63FF, #9C63FF)' }}
          >
            {message.pregunta}
          </div>
          <p className="text-xs text-gray-500 text-right mt-1">{time}</p>
        </div>
      </div>

      {/* AI response — left */}
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(67,233,123,0.15)', border: '1px solid rgba(67,233,123,0.3)' }}
        >
          <Bot className="w-4 h-4 text-green-400" />
        </div>
        <div className="max-w-[75%]">
          <div className="glass-card px-4 py-3 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
            {message.respuestaIA}
          </div>
          <p className="text-xs text-gray-500 mt-1">{time} · Gemini AI</p>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
