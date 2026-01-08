import React, { useState, useEffect } from 'react';
import { StartupLab } from '@/entities/all';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload, 
  Play, 
  Pause, 
  Trash2, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2,
  Building2,
  BarChart3
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function LaboratorioStartups() {
  const [labs, setLabs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [activeLabId, setActiveLabId] = useState(null);

  useEffect(() => {
    loadLabs();
    const interval = setInterval(loadLabs, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadLabs = async () => {
    setIsLoading(true);
    try {
      const data = await StartupLab.list('-created_date');
      setLabs(data || []);
    } catch (error) {
      console.error("Erro ao carregar laboratórios:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await base44.functions.invoke('uploadStartupCSV', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data) {
        const { labId, total_registros } = response.data;
        alert(`✅ Arquivo processado com sucesso!\n📊 ${total_registros} startups encontradas no CSV`);
        setFile(null);
        await loadLabs();
        setShowUploadDialog(false);
        
        if (labId) {
            handleProcessLab(labId);
        }
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert(`Erro no upload: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessLab = async (targetLabId) => {
    const idToProcess = targetLabId;
    if (!idToProcess) return;

    if (isProcessing && activeLabId === idToProcess) {
        console.log(`Lab ${idToProcess} já está em processamento.`);
        return;
    }
    
    setIsProcessing(true);
    setActiveLabId(idToProcess);

    try {
      while (true) {
        const response = await base44.functions.invoke('processNextBatch', { 
          labId: idToProcess, 
          action: 'start' 
        });
        
        await loadLabs();

        const currentLab = labs.find(l => l.id === idToProcess);
        
        if (!currentLab) {
            console.log(`Lab ${idToProcess} não encontrado. Encerrando processamento.`);
            break;
        }
        
        const { processados, criados, erros, concluido, status } = response.data;
        
        if (concluido || status === 'concluido' || status === 'pausado') {
          if (status === 'concluido') {
             alert(`✅ Laboratório processado completamente!\n📊 ${processados} startups processadas\n✅ ${criados} criadas com sucesso\n❌ ${erros} com erros`);
          } else if (status === 'pausado') {
             alert(`⏸️ Laboratório pausado!\n📊 ${processados} startups processadas até agora.`);
          }
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Erro ao processar laboratório:", error);
      alert(`Erro: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsProcessing(false);
      setActiveLabId(null);
    }
  };

  const handleDeleteLab = async (labId) => {
    try {
      await StartupLab.delete(labId);
      await loadLabs();
    } catch (error) {
      console.error("Erro ao excluir laboratório:", error);
      alert("Erro ao excluir laboratório.");
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await base44.functions.invoke('cleanupRecentImports');
      alert(response.data.message);
      await loadLabs();
    } catch (error) {
      console.error("Erro na limpeza:", error);
      alert(`Erro: ${error.response?.data?.error || error.message}`);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      aguardando: { text: 'Aguardando', color: 'bg-slate-100 text-slate-800', icon: Clock },
      processando: { text: 'Processando', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
      pausado: { text: 'Pausado', color: 'bg-amber-100 text-amber-800', icon: Pause },
      concluido: { text: 'Concluído', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      erro: { text: 'Erro', color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusMap[status] || statusMap.aguardando;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className={`w-3 h-3 ${status === 'processando' ? 'animate-spin' : ''}`} />
        {config.text}
      </Badge>
    );
  };

  const calculateProgress = (lab) => {
    if (!lab.total_registros || lab.total_registros === 0) return 0;
    return Math.round((lab.processados / lab.total_registros) * 100);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Laboratório de Startups</h1>
            <p className="text-slate-600">Processamento em lote de CSVs de startups</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCleanup}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Concluídos
            </Button>
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
              <DialogTrigger asChild>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Novo Upload CSV
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload de Arquivo CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Selecione o arquivo CSV
                    </label>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="cursor-pointer"
                    />
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Formato esperado:</h4>
                    <p className="text-sm text-blue-800">
                      <strong>Colunas obrigatórias:</strong> Nome | Site | Descrição | Logo URL
                    </p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      onClick={handleUpload}
                      disabled={!file || isUploading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        'Fazer Upload'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Lotes Ativos</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {labs.filter(l => ['aguardando', 'processando', 'pausado'].includes(l.status)).length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total de Startups</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {labs.reduce((sum, l) => sum + (l.total_registros || 0), 0)}
                  </p>
                </div>
                <Building2 className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Processadas</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {labs.reduce((sum, l) => sum + (l.processados || 0), 0)}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Criadas</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {labs.reduce((sum, l) => sum + (l.criados_com_sucesso || 0), 0)}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Lotes */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Lotes de Processamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            {labs.length > 0 ? (
              <div className="space-y-6">
                {labs.map((lab) => (
                  <Card key={lab.id} className="border border-slate-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{lab.nome_arquivo}</h3>
                          <p className="text-sm text-slate-600">
                            Criado em {new Date(lab.created_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {getStatusBadge(lab.status)}
                      </div>

                      {lab.status !== 'aguardando' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-slate-600 mb-2">
                            <span>Progresso: {lab.processados || 0} de {lab.total_registros}</span>
                            <span>{calculateProgress(lab)}%</span>
                          </div>
                          <Progress value={calculateProgress(lab)} className="h-2" />
                        </div>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-slate-600">Total:</span>
                          <span className="ml-2 font-semibold">{lab.total_registros}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Processados:</span>
                          <span className="ml-2 font-semibold text-blue-600">{lab.processados || 0}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Criados:</span>
                          <span className="ml-2 font-semibold text-emerald-600">{lab.criados_com_sucesso || 0}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Erros:</span>
                          <span className="ml-2 font-semibold text-red-600">{lab.erros || 0}</span>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {['aguardando', 'pausado'].includes(lab.status) && (
                            <Button
                                onClick={() => handleProcessLab(lab.id)}
                                disabled={isProcessing && activeLabId === lab.id}
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                            >
                                {isProcessing && activeLabId === lab.id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        {lab.status === 'aguardando' ? 'Iniciar Processamento' : 'Continuar Processamento'}
                                    </>
                                )}
                            </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o lote "{lab.nome_arquivo}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteLab(lab.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium mb-2">Nenhum lote encontrado</h3>
                <p>Faça o upload de um arquivo CSV para começar o processamento.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}