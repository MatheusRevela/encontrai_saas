import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, Download, Loader2, Hammer, FileText, Play, Pause, RotateCcw, CheckCircle, XCircle, History, Database } from 'lucide-react';
import { searchSingleStartupSite } from '@/functions/searchSingleStartupSite';
import { BatchSearch, StartupFound } from '@/entities/all';

export default function Ferramentas() {
  const [file, setFile] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [startupNames, setStartupNames] = useState([]);
  const [results, setResults] = useState([]);
  const [previousBatches, setPreviousBatches] = useState([]);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Carrega lotes anteriores ao inicializar
  useEffect(() => {
    loadPreviousBatches();
  }, []);

  const loadPreviousBatches = async () => {
    try {
      const batches = await BatchSearch.list('-created_date', 10);
      setPreviousBatches(batches || []);
    } catch (error) {
      console.error('Erro ao carregar lotes anteriores:', error);
      setPreviousBatches([]);
    }
  };

  const loadBatchResults = async (batchId) => {
    try {
      const batchResults = await StartupFound.filter({ batch_id: batchId });
      setResults(batchResults || []);
    } catch (error) {
      console.error('Erro ao carregar resultados do lote:', error);
      setResults([]);
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
      processCSVFile(selectedFile);
    } else {
      setFile(null);
      setError('Por favor, selecione um arquivo .csv');
      setStartupNames([]);
    }
  };

  const processCSVFile = async (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        
        // Remove o cabeçalho e pega apenas a primeira coluna (nomes)
        const names = lines
          .slice(1) // Pula o cabeçalho
          .map(line => {
            const columns = line.split(/[;,]/); // Aceita ; ou ,
            return columns[0] ? columns[0].trim().replace(/^"|"$/g, '') : '';
          })
          .filter(name => name && name.length > 1);

        setStartupNames(names);
        setResults([]);
        setCurrentIndex(0);
        setProgress(0);
        
        // Cria um novo lote no banco de dados
        const batch = await BatchSearch.create({
          nome_arquivo: file.name,
          total_startups: names.length,
          startups_originais: names,
          status: 'aguardando',
          iniciado_em: new Date().toISOString()
        });
        
        setCurrentBatch(batch);
        await loadPreviousBatches(); // Recarrega a lista
        
        console.log(`📋 ${names.length} startups carregadas e lote ${batch.id} criado`);
      } catch (err) {
        setError('Erro ao ler o arquivo CSV: ' + err.message);
        setStartupNames([]);
      }
    };
    reader.readAsText(file);
  };

  const startProcessing = async () => {
    if (startupNames.length === 0 || !currentBatch) {
      setError('Nenhuma startup para processar ou lote não encontrado.');
      return;
    }

    setIsProcessing(true);
    setIsPaused(false);
    setError('');

    // Atualiza status do lote
    await BatchSearch.update(currentBatch.id, { status: 'processando' });

    // Continua de onde parou ou começa do início
    const startFrom = currentIndex;
    
    for (let i = startFrom; i < startupNames.length; i++) {
      // Verifica se foi pausado
      if (isPaused) {
        console.log('⏸️ Processamento pausado pelo usuário');
        await BatchSearch.update(currentBatch.id, { 
          status: 'pausado', 
          processadas: i 
        });
        break;
      }

      const nomeStartup = startupNames[i];
      setCurrentIndex(i);
      
      try {
        console.log(`🔍 Processando ${i + 1}/${startupNames.length}: ${nomeStartup}`);
        
        const response = await searchSingleStartupSite({ nomeStartup });
        
        if (response.status === 200) {
          const resultado = response.data;
          
          // Se der rate limit, pausa automaticamente
          if (resultado.isRateLimit) {
            setError('⏸️ Rate limit atingido! Processamento pausado. Aguarde alguns minutos e clique em "Continuar".');
            setIsPaused(true);
            setIsProcessing(false);
            await BatchSearch.update(currentBatch.id, { 
              status: 'pausado', 
              processadas: i 
            });
            break;
          }
          
          // SALVA IMEDIATAMENTE NO BANCO
          const startupResult = await StartupFound.create({
            batch_id: currentBatch.id,
            nome_startup: resultado.nome,
            site_encontrado: resultado.site || '',
            sucesso: true,
            processado_em: new Date().toISOString()
          });
          
          setResults(prev => {
            const filtered = prev.filter(r => r.nome_startup !== resultado.nome);
            return [...filtered, startupResult];
          });
          
        } else {
          // Se a chamada falhar, salva com erro
          const startupResult = await StartupFound.create({
            batch_id: currentBatch.id,
            nome_startup: nomeStartup,
            site_encontrado: '',
            sucesso: false,
            erro_mensagem: 'Falha na API',
            processado_em: new Date().toISOString()
          });
          
          setResults(prev => {
            const filtered = prev.filter(r => r.nome_startup !== nomeStartup);
            return [...filtered, startupResult];
          });
        }
      } catch (error) {
        console.error(`Erro ao processar ${nomeStartup}:`, error);
        
        // Salva o erro no banco
        const startupResult = await StartupFound.create({
          batch_id: currentBatch.id,
          nome_startup: nomeStartup,
          site_encontrado: '',
          sucesso: false,
          erro_mensagem: error.message,
          processado_em: new Date().toISOString()
        });
        
        setResults(prev => {
          const filtered = prev.filter(r => r.nome_startup !== nomeStartup);
          return [...filtered, startupResult];
        });
      }

      // Atualiza o progresso no lote
      const newProgress = ((i + 1) / startupNames.length) * 100;
      setProgress(newProgress);
      
      await BatchSearch.update(currentBatch.id, { 
        processadas: i + 1,
        sites_encontrados: results.filter(r => r.site_encontrado && r.site_encontrado.length > 0).length + 1
      });

      // Delay entre chamadas para evitar rate limit (6 segundos)
      await new Promise(resolve => setTimeout(resolve, 6000));
    }

    // Se chegou até aqui sem pausar, finalizou
    if (!isPaused) {
      setCurrentIndex(startupNames.length);
      setIsProcessing(false);
      await BatchSearch.update(currentBatch.id, { 
        status: 'concluido',
        concluido_em: new Date().toISOString(),
        processadas: startupNames.length
      });
      await loadPreviousBatches(); // Recarrega a lista
      console.log('✅ Processamento concluído!');
    }
  };

  const pauseProcessing = () => {
    setIsPaused(true);
    setIsProcessing(false);
    console.log('⏸️ Processamento pausado');
  };

  const resetProcessing = () => {
    setIsProcessing(false);
    setIsPaused(false);
    setCurrentIndex(0);
    setProgress(0);
    console.log('🔄 Processamento resetado');
  };

  const continueBatch = async (batch) => {
    // Carrega os dados do lote selecionado
    setCurrentBatch(batch);
    setStartupNames(batch.startups_originais);
    setCurrentIndex(batch.processadas || 0);
    setProgress((batch.processadas / batch.total_startups) * 100);
    
    // Carrega os resultados já processados
    await loadBatchResults(batch.id);
    
    console.log(`📂 Lote ${batch.id} carregado - ${batch.processadas}/${batch.total_startups} processadas`);
  };

  const handleDownloadAll = () => {
    if (results.length === 0) return;

    const header = 'Nome;Site;Status;Data_Processamento\n';
    const csvContent = results
      .map(row => `"${row.nome_startup}";"${row.site_encontrado}";"${row.site_encontrado ? 'Encontrado' : 'Não encontrado'}";"${new Date(row.processado_em).toLocaleDateString('pt-BR')}"`)
      .join('\n');
    
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lote_${currentBatch?.id || 'atual'}_todas.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadFound = () => {
    const foundResults = results.filter(r => r.site_encontrado && r.site_encontrado.length > 0);
    if (foundResults.length === 0) {
      setError('Nenhuma startup com site encontrado para download.');
      return;
    }

    const header = 'Nome;Site\n';
    const csvContent = foundResults
      .map(row => `"${row.nome_startup}";"${row.site_encontrado}"`)
      .join('\n');
    
    const blob = new Blob([header + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lote_${currentBatch?.id || 'atual'}_encontrados.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCompleted = currentIndex >= startupNames.length && startupNames.length > 0;
  const canStart = startupNames.length > 0 && !isProcessing && currentBatch;
  const canPause = isProcessing;
  const canReset = results.length > 0 || currentIndex > 0;
  const foundCount = results.filter(r => r.site_encontrado && r.site_encontrado.length > 0).length;

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center">
            <Hammer className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Buscador de Sites em Lote</h1>
            <p className="text-slate-600">Carregue uma planilha e processe milhares de startups automaticamente. <span className="text-emerald-600 font-medium">Progress salvo automaticamente!</span></p>
          </div>
        </div>

        {/* Lotes Anteriores */}
        {previousBatches.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Lotes Anteriores
              </CardTitle>
              <CardDescription>Continue processando lotes anteriores ou veja o histórico.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {previousBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Database className="w-5 h-5 text-slate-500" />
                      <div>
                        <div className="font-medium">{batch.nome_arquivo}</div>
                        <div className="text-sm text-slate-600">
                          {batch.processadas || 0} / {batch.total_startups} processadas
                        </div>
                      </div>
                      <Badge className={batch.status === 'concluido' ? 'bg-green-100 text-green-800' : batch.status === 'processando' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}>
                        {batch.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {batch.status !== 'concluido' && (
                        <Button size="sm" onClick={() => continueBatch(batch)} disabled={isProcessing}>
                          Continuar
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => continueBatch(batch)}>
                        Ver Resultados
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>📁 Upload da Planilha</CardTitle>
            <CardDescription>
              Envie um CSV com uma coluna de nomes de startups (cabeçalho na primeira linha).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  id="csv-upload-batch"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('csv-upload-batch').click()}
                  disabled={isProcessing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar CSV
                </Button>
                {file && <span className="text-sm text-slate-600 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-500" /> {file.name}</span>}
              </div>
              {startupNames.length > 0 && (
                <div className="mt-2 p-3 bg-emerald-50 rounded border border-emerald-200">
                  <p className="text-sm text-emerald-600 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    ✅ {startupNames.length} startups carregadas e salvas no lote {currentBatch?.id}
                  </p>
                </div>
              )}
            </div>

            {/* Controles do Processamento */}
            {startupNames.length > 0 && currentBatch && (
              <div className="space-y-4 p-6 bg-slate-50 rounded-lg border">
                <div className="flex items-center gap-3 flex-wrap">
                  <Button 
                    onClick={startProcessing} 
                    disabled={!canStart}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {currentIndex > 0 ? 'Continuar' : 'Iniciar'} Processamento
                  </Button>
                  
                  <Button 
                    onClick={pauseProcessing} 
                    disabled={!canPause}
                    variant="outline"
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    Pausar
                  </Button>
                  
                  <Button 
                    onClick={resetProcessing} 
                    disabled={!canReset}
                    variant="outline"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-slate-900">{startupNames.length}</div>
                    <div className="text-xs text-slate-500">Total</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-blue-600">{currentIndex}</div>
                    <div className="text-xs text-slate-500">Processadas</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-emerald-600">{foundCount}</div>
                    <div className="text-xs text-slate-500">Sites Encontrados</div>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <div className="text-2xl font-bold text-amber-600">{results.length - foundCount}</div>
                    <div className="text-xs text-slate-500">Não Encontrados</div>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Progresso: {currentIndex} de {startupNames.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  
                  {isProcessing && currentIndex < startupNames.length && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando: {startupNames[currentIndex]}... (Salvando automaticamente)
                    </div>
                  )}

                  {isCompleted && (
                    <div className="text-sm text-emerald-600 font-medium">
                      ✅ Processamento concluído! {foundCount} sites encontrados de {results.length} processadas. Todos os dados estão salvos!
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">{error}</p>}

            {/* Downloads */}
            {results.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Downloads</h3>
                  <div className="flex gap-3">
                    <Button onClick={handleDownloadFound} disabled={foundCount === 0}>
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Encontrados ({foundCount})
                    </Button>
                    <Button onClick={handleDownloadAll} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Todas ({results.length})
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabela de Resultados */}
            {results.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="text-lg font-semibold">Últimos Resultados <span className="text-sm font-normal text-slate-500">(salvo no banco)</span></h3>
                <div className="border rounded-lg max-h-80 overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-slate-50">
                      <TableRow>
                        <TableHead>Nome da Startup</TableHead>
                        <TableHead>Site Encontrado</TableHead>
                        <TableHead className="w-20">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.slice(-20).reverse().map((row, index) => ( // Mostra os últimos 20
                        <TableRow key={index}>
                          <TableCell className="font-medium">{row.nome_startup}</TableCell>
                          <TableCell>
                            {row.site_encontrado ? (
                              <a href={row.site_encontrado} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                {row.site_encontrado}
                              </a>
                            ) : (
                              <span className="text-slate-400 text-sm">Não encontrado</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.site_encontrado ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-400" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-slate-500 text-center">
                  Mostrando os últimos 20 resultados. Todos estão salvos no banco de dados. Use o download para ver todos.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}