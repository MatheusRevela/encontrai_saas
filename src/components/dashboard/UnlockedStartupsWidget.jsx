import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, ExternalLink, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function UnlockedStartupsWidget({ transacoes }) {
  const navigate = useNavigate();
  
  const startupsDesbloqueadas = transacoes
    .filter(t => t.status_pagamento === 'pago' && t.startups_desbloqueadas?.length > 0)
    .flatMap(t => t.startups_desbloqueadas)
    .slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-600" />
          Soluções Desbloqueadas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {startupsDesbloqueadas.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm mb-2">Nenhuma solução desbloqueada ainda</p>
            <p className="text-slate-400 text-xs mb-4">Faça uma busca e desbloqueie soluções para começar</p>
            <Button
              onClick={() => navigate(createPageUrl('Buscar'))}
              className="bg-emerald-600 hover:bg-emerald-700"
              size="sm"
            >
              Buscar Soluções
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {startupsDesbloqueadas.map((startup, index) => (
              <div key={index} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                  {startup.logo_url && (
                    <img
                      src={startup.logo_url}
                      alt={startup.nome}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{startup.nome}</h4>
                    {startup.categoria && (
                      <Badge variant="secondary" className="mb-2 text-xs">
                        {startup.categoria}
                      </Badge>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {startup.site && (
                        <a
                          href={startup.site}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Site
                        </a>
                      )}
                      {startup.email && (
                        <a
                          href={`mailto:${startup.email}`}
                          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </a>
                      )}
                      {startup.whatsapp && (
                        <a
                          href={`https://wa.me/${startup.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(createPageUrl('MinhasBuscas'))}
            >
              Ver Todas as Soluções
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}