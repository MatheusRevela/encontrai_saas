import React from 'react';
import { Bot, User, Loader2 } from 'lucide-react';

export default function MessageBubble({ sender, text, isLoading }) {
  const isBot = sender === 'bot';

  return (
    <div className={`flex w-full items-start gap-4 ${isBot ? '' : 'justify-end'}`}>
      {isBot && (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-6 h-6 text-white" />
        </div>
      )}
      
      <div className={`max-w-2xl p-4 rounded-2xl ${
        isBot 
          ? 'bg-white shadow-sm border border-slate-100' 
          : 'bg-blue-500 text-white'
      }`}>
        {isLoading ? (
          <div className="flex items-center gap-3 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="italic">{text || 'Analisando...'}</span>
          </div>
        ) : (
          <p className="whitespace-pre-wrap leading-relaxed">{text}</p>
        )}
      </div>

      {!isBot && (
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-slate-600" />
        </div>
      )}
    </div>
  );
}