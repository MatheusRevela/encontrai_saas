import { createClientFromRequest } from 'npm:@base44/sdk@0.5.0';
import { parse } from 'https://deno.land/std@0.207.0/csv/mod.ts';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') throw new Error('Acesso negado');

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) throw new Error('Arquivo CSV não fornecido');

    const csvData = await file.text();
    
    let rawRecords;
    try {
      rawRecords = await parse(csvData, { lazyQuotes: true, separator: ';' });
    } catch (e) {
      try {
        rawRecords = await parse(csvData, { lazyQuotes: true, separator: ',' });
      } catch (finalError) {
         throw new Error(`Não foi possível ler o CSV: ${finalError.message}`);
      }
    }

    // PADRONIZAÇÃO: Nome (coluna 0) | Site (coluna 1) | Descrição (coluna 2 - OPCIONAL) | Logo URL (coluna 3 - OPCIONAL)
    const records = rawRecords.slice(1).map((row, index) => ({
      nome: (row[0] || '').trim().replace(/^"|"$/g, ''),
      site: (row[1] || '').trim().replace(/^"|"$/g, ''),
      descricao: (row[2] || '').trim().replace(/^"|"$/g, '') || '', // Descrição opcional
      logo_url: (row[3] || '').trim().replace(/^"|"$/g, '') || '', // Logo URL opcional
      status: 'pendente',
      linha: index + 2 // +2 porque slice(1) remove header e arrays são 0-indexed
    })).filter(record => record.nome && record.site && record.site.includes('.'));

    if (records.length === 0) {
      throw new Error('Nenhuma startup válida encontrada no CSV. Verifique se tem pelo menos as colunas obrigatórias: Nome | Site');
    }

    const lab = await base44.asServiceRole.entities.StartupLab.create({
      nome_arquivo: file.name,
      total_registros: records.length,
      processados: 0,
      criados_com_sucesso: 0,
      erros: 0,
      status: 'aguardando',
      dados_csv: records,
      iniciado_em: new Date().toISOString()
    });

    return new Response(JSON.stringify({ 
      message: `✅ Laboratório criado com ${records.length} startups para processar`,
      labId: lab.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Erro no upload:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});