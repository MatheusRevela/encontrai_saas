import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Calendar, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import jsPDF from 'jspdf';

export default function ReportExporter({ analyticsData, userName = "Usuário" }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSections, setSelectedSections] = useState({
    trends: true,
    categories: true,
    roi: true,
    regions: true,
    summary: true
  });

  const sections = [
    { id: 'summary', label: 'Resumo Executivo', icon: FileText },
    { id: 'trends', label: 'Tendências de Buscas', icon: Calendar },
    { id: 'categories', label: 'Categorias Demandadas', icon: FileText },
    { id: 'roi', label: 'Análise de Satisfação', icon: FileText },
    { id: 'regions', label: 'Distribuição Regional', icon: FileText }
  ];

  const generatePDFReport = async () => {
    setIsGenerating(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Título
      doc.setFontSize(24);
      doc.setTextColor(16, 185, 129);
      doc.text('EncontrAI - Relatório Analítico', pageWidth / 2, yPos, { align: 'center' });
      
      yPos += 10;
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
      doc.text(`Usuário: ${userName}`, pageWidth / 2, yPos + 5, { align: 'center' });

      yPos += 20;

      // Resumo Executivo
      if (selectedSections.summary && analyticsData.summary) {
        doc.setFontSize(16);
        doc.setTextColor(51, 65, 85);
        doc.text('📊 Resumo Executivo', 20, yPos);
        yPos += 10;

        doc.setFontSize(11);
        doc.setTextColor(71, 85, 105);
        doc.text(`Total de Buscas: ${analyticsData.summary.totalBuscas}`, 20, yPos);
        yPos += 6;
        doc.text(`Conversões: ${analyticsData.summary.totalConversoes}`, 20, yPos);
        yPos += 6;
        doc.text(`Taxa de Conversão: ${analyticsData.summary.taxaConversao.toFixed(1)}%`, 20, yPos);
        yPos += 6;
        doc.text(`Receita Total: R$ ${analyticsData.summary.receitaTotal.toFixed(2)}`, 20, yPos);
        yPos += 15;
      }

      // Tendências
      if (selectedSections.trends && analyticsData.trends?.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(51, 65, 85);
        doc.text('📈 Tendências de Buscas', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        analyticsData.trends.slice(0, 6).forEach(trend => {
          doc.text(`${trend.periodo}: ${trend.buscas} buscas, ${trend.conversoes} conversões`, 20, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Categorias
      if (selectedSections.categories && analyticsData.categories?.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(51, 65, 85);
        doc.text('🏷️ Categorias Mais Demandadas', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        analyticsData.categories.slice(0, 8).forEach((cat, i) => {
          doc.text(`${i + 1}. ${cat.categoria}: ${cat.quantidade} buscas`, 20, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // ROI/Satisfação
      if (selectedSections.roi && analyticsData.roi?.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(51, 65, 85);
        doc.text('⭐ Análise de Satisfação', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        analyticsData.roi.forEach(item => {
          doc.text(`${item.categoria}: ${item.satisfacao.toFixed(2)} ⭐ (${item.avaliacoes} avaliações)`, 20, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Regiões
      if (selectedSections.regions && analyticsData.regions?.length > 0) {
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(51, 65, 85);
        doc.text('🗺️ Distribuição Regional', 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        analyticsData.regions.forEach(reg => {
          doc.text(`${reg.regiao}: ${reg.buscas} buscas, ${reg.conversoes} conversões`, 20, yPos);
          yPos += 6;
        });
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `Página ${i} de ${totalPages} | EncontrAI © ${new Date().getFullYear()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`relatorio-encontrai-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToCSV = () => {
    if (!analyticsData.categories || analyticsData.categories.length === 0) return;

    const csvContent = [
      ['Categoria', 'Quantidade de Buscas'],
      ...analyticsData.categories.map(cat => [cat.categoria, cat.quantidade])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `categorias-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5 text-emerald-600" />
          Exportar Relatório
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
              <FileText className="w-4 h-4 mr-2" />
              Gerar Relatório PDF
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Personalizar Relatório</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {sections.map(section => (
                <div key={section.id} className="flex items-center gap-3">
                  <Checkbox
                    id={section.id}
                    checked={selectedSections[section.id]}
                    onCheckedChange={(checked) =>
                      setSelectedSections(prev => ({ ...prev, [section.id]: checked }))
                    }
                  />
                  <Label htmlFor={section.id} className="flex items-center gap-2 cursor-pointer">
                    <section.icon className="w-4 h-4 text-slate-600" />
                    {section.label}
                  </Label>
                </div>
              ))}

              <Button
                onClick={generatePDFReport}
                disabled={isGenerating || !Object.values(selectedSections).some(v => v)}
                className="w-full mt-4"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Gerar PDF
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          variant="outline" 
          className="w-full"
          onClick={exportToCSV}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar Dados CSV
        </Button>
      </CardContent>
    </Card>
  );
}