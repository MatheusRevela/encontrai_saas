import React from 'react';
import { Loader2 } from 'lucide-react';

export default function PageLoader({ message = "Carregando..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
        <p className="text-slate-600 font-medium">{message}</p>
      </div>
    </div>
  );
}