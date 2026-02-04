import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ExternalLink, Edit, Trash2, Eye, EyeOff, 
  CheckCircle, XCircle, AlertTriangle, Globe, Mail, MessageSquare, Tag, CircleDollarSign, CalendarClock, Star, Award, CheckCheck
} from "lucide-react";
import { formatDateBrasiliaShort } from '../utils/dateUtils';
import { base44 } from '@/api/base44Client';

export default function StartupCard({ startup, onEdit, onDelete, onToggleStatus, onManualVerify, isProcessing, onMarkResolved }) {
  const [isUpdatingRating, setIsUpdatingRating] = useState(false);
  
  const categoryColors = {
    gestao: "bg-blue-100 text-blue-800",
    vendas: "bg-green-100 text-green-800",
    marketing: "bg-purple-100 text-purple-800",
    financeiro: "bg-emerald-100 text-emerald-800",
    operacional: "bg-orange-100 text-orange-800",
    rh: "bg-pink-100 text-pink-800",
    tecnologia: "bg-indigo-100 text-indigo-800",
    logistica: "bg-yellow-100 text-yellow-800"
  };

  // Verifica se há problema real e não foi aprovado manualmente
  const hasVerificationIssue = startup.status_verificacao && 
    (startup.status_verificacao.site_online === false ||
     startup.status_verificacao.ssl_valido === false ||
     startup.status_verificacao.email_valido === false) &&
    (!startup.verificacao_manual || !startup.verificacao_manual.status_aprovado);
  const tagsToShow = startup.tags?.slice(0, 5) || [];
  const remainingTags = startup.tags?.length > 5 ? startup.tags.length - 5 : 0;

  const handleStarClick = async (rating) => {
    if (isUpdatingRating) return;
    
    setIsUpdatingRating(true);
    try {
      await base44.entities.Startup.update(startup.id, {
        avaliacao_especialista: rating,
        data_avaliacao_especialista: new Date().toISOString(),
        avaliado_por: 'admin'
      });
      
      // Atualiza localmente para feedback imediato
      startup.avaliacao_especialista = rating;
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
    } finally {
      setIsUpdatingRating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      whileHover={{ y: -2 }}
      className="h-full"
    >
      <Card className={`h-full flex flex-col border-0 shadow-md hover:shadow-lg transition-all duration-300 ${
        !startup.ativo ? 'opacity-60 bg-slate-50' : 'bg-white'
      } ${hasVerificationIssue ? 'ring-2 ring-red-200' : ''}`}>
        
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            {startup.logo_url ? (
              <img src={startup.logo_url} alt={`${startup.nome} logo`} className="w-12 h-12 object-contain rounded-md border border-slate-100 flex-shrink-0" />
            ) : (
              <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6 text-slate-400"/>
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-lg font-bold text-slate-900 line-clamp-2">
                {startup.nome}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {startup.ativo ? (
                <Eye className="w-5 h-5 text-green-500" />
              ) : (
                <EyeOff className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </div>

          {/* Sistema de Avaliação de Especialista */}
          <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Avaliação Especialista</span>
              </div>
              {startup.avaliacao_especialista && (
                <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                  {startup.avaliacao_especialista}/5
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  disabled={isUpdatingRating}
                  className="transition-all duration-200 hover:scale-110 disabled:opacity-50"
                  title={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}
                >
                  <Star 
                    className={`w-5 h-5 transition-colors ${
                      star <= (startup.avaliacao_especialista || 0)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-amber-300 hover:text-amber-400'
                    }`}
                  />
                </button>
              ))}
            </div>
            
            <p className="text-xs text-amber-700 mt-1">
              Baseado em: equipe, investimentos, fundadores, funcionários e carteira de clientes
            </p>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-0">
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={`${categoryColors[startup.categoria] || 'bg-slate-100 text-slate-800'} text-xs capitalize`}>
                {startup.categoria}
              </Badge>
              
              {startup.vertical_atuacao && (
                <Badge variant="outline" className="text-xs capitalize">
                  {startup.vertical_atuacao.replace(/_/g, ' ')}
                </Badge>
              )}
              
              {startup.modelo_negocio && (
                <Badge variant="outline" className="text-xs capitalize border-dashed">
                  {startup.modelo_negocio.replace(/_/g, ' ')}
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-slate-600 line-clamp-3">
              {startup.descricao || 'Sem descrição disponível.'}
            </p>

            {/* Tags */}
            {startup.tags && startup.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {tagsToShow.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="font-normal text-xs">{tag}</Badge>
                ))}
                {remainingTags > 0 && (
                  <Badge variant="secondary" className="font-normal text-xs">+{remainingTags}</Badge>
                )}
              </div>
            )}
            
            {/* Info contacts and price */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              {startup.site && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <a 
                    href={startup.site} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline truncate"
                  >
                    {startup.site.replace(/^https?:\/\//, '')}
                  </a>
                  <ExternalLink className="w-3 h-3 text-slate-400 flex-shrink-0" />
                </div>
              )}
              <div className="flex justify-between items-center text-xs text-slate-600">
                  <div className="flex items-center gap-4">
                      {startup.email && (
                          <a 
                            href={`mailto:${startup.email}`}
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            title={`Enviar email para ${startup.email}`}
                          >
                              <Mail className="w-3.5 h-3.5"/>
                              <span>Email</span>
                          </a>
                      )}
                      {startup.whatsapp && (
                          <a 
                            href={`https://wa.me/${startup.whatsapp.replace(/\D/g,'')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-green-600 hover:text-green-800 hover:underline transition-colors"
                            title={`Conversar no WhatsApp: ${startup.whatsapp}`}
                          >
                              <MessageSquare className="w-3.5 h-3.5"/>
                              <span>WhatsApp</span>
                          </a>
                      )}
                  </div>
                  {startup.preco_base && (
                      <div className="flex items-center gap-1.5 font-medium">
                          <CircleDollarSign className="w-3.5 h-3.5 text-slate-400"/>
                          <span>{startup.preco_base}</span>
                      </div>
                  )}
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 space-y-2">
            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(startup)}
                disabled={isProcessing}
                className="flex-1 text-xs"
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                Editar
              </Button>
              
              {hasVerificationIssue && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkResolved(startup.id)}
                  disabled={isProcessing}
                  className="w-10 p-0 text-xs hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                  title="Marcar problema como resolvido"
                >
                  <CheckCheck className="w-4 h-4 text-green-600" />
                </Button>
              )}
              
              <Button
                variant={startup.ativo ? "outline" : "default"}
                size="sm"
                onClick={() => onToggleStatus(startup.id, !startup.ativo)}
                disabled={isProcessing}
                className={`w-10 p-0 text-xs transition-all ${
                  startup.ativo 
                    ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-200' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                title={startup.ativo ? 'Desativar startup' : 'Ativar startup'}
              >
                {startup.ativo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(startup.id)}
                disabled={isProcessing}
                className="w-10 p-0 text-xs"
                title="Excluir startup"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Last Verification Date */}
            {startup.ultima_verificacao && (
              <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs mt-2">
                <CalendarClock className="w-3 h-3" />
                <span>Verificado em: {formatDateBrasiliaShort(startup.ultima_verificacao)}</span>
              </div>
            )}

            {/* Manual Verification */}
            {hasVerificationIssue && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-red-700">Problema na verificação!</p>
                    <p className="text-xs text-red-600">{startup.status_verificacao.ultimo_erro}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="xs" variant="outline" onClick={() => onManualVerify(startup, 'confirm_ok')} disabled={isProcessing}>
                        <CheckCircle className="w-3 h-3 mr-1" /> Ignorar
                      </Button>
                      <Button size="xs" variant="destructive" onClick={() => onManualVerify(startup, 'confirm_problem')} disabled={isProcessing}>
                        <XCircle className="w-3 h-3 mr-1"/> Desativar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}