import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  DollarSign, 
  Copy, 
  CheckCircle, 
  Loader2,
  BarChart3,
  TrendingUp,
  Target
} from 'lucide-react';

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    email_contato: '',
    ativo: true
  });
  const [copiedUrl, setCopiedUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [partnersData, usersData, transactionsData] = await Promise.all([
        base44.entities.Partner.list('-created_date'),
        base44.entities.User.list('-created_date'),
        base44.entities.Transacao.list('-created_date')
      ]);
      setPartners(partnersData || []);
      setUsers(usersData || []);
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.codigo.trim()) return;

    setIsSaving(true);
    try {
      if (editingPartner) {
        await base44.entities.Partner.update(editingPartner.id, formData);
      } else {
        await base44.entities.Partner.create(formData);
      }
      await loadData();
      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao salvar parceiro:", error);
      alert("Erro ao salvar. O código pode já estar em uso.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner);
    setFormData({
      nome: partner.nome,
      codigo: partner.codigo,
      email_contato: partner.email_contato || '',
      ativo: partner.ativo
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities.Partner.delete(id);
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir parceiro:", error);
      alert("Erro ao excluir parceiro.");
    }
  };

  const handleToggleStatus = async (partner) => {
    try {
      await base44.entities.Partner.update(partner.id, { ativo: !partner.ativo });
      await loadData();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status do parceiro.");
    }
  };

  const resetForm = () => {
    setFormData({ nome: '', codigo: '', email_contato: '', ativo: true });
    setEditingPartner(null);
  };

  const copyToClipboard = (texto, partnerId) => {
    navigator.clipboard.writeText(texto);
    setCopiedUrl(partnerId);
    setTimeout(() => setCopiedUrl(''), 2000);
  };

  const getPartnerStats = (codigo) => {
    const referralUsers = users.filter(u => u.referral_code === codigo);
    const referralTransactions = transactions.filter(t => 
      referralUsers.some(u => u.email === t.created_by)
    );
    
    // NOVO: Calcula revenue incluindo assinaturas
    let revenue = referralTransactions
      .filter(t => t.status_pagamento === 'pago')
      .reduce((sum, t) => sum + (t.valor_total || 0), 0);
    
    // Adiciona revenue de assinaturas (R$ 49,90/mês por usuário ativo)
    const activeSubscribers = referralUsers.filter(u => u.subscription_plan === 'starter').length;
    revenue += (activeSubscribers * 49.90);

    return {
      totalUsers: referralUsers.length,
      totalTransactions: referralTransactions.length,
      revenue: revenue,
      activeSubscribers: activeSubscribers,
      conversionRate: referralUsers.length > 0 
        ? ((referralTransactions.filter(t => t.status_pagamento === 'pago').length / referralTransactions.length) * 100).toFixed(1)
        : 0
    };
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Programa de Parceiros</h1>
            <p className="text-slate-600">Gerencie influenciadores e parceiros de negócio</p>
          </div>
          <Dialog open={showForm} onOpenChange={(open) => {
            setShowForm(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Parceiro
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingPartner ? 'Editar Parceiro' : 'Novo Parceiro'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Parceiro</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="codigo">Código Único</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({...formData, codigo: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '')})}
                    placeholder="Ex: joao123"
                    required
                    maxLength={20}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Apenas letras minúsculas e números
                  </p>
                </div>
                <div>
                  <Label htmlFor="email">Email de Contato</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email_contato}
                    onChange={(e) => setFormData({...formData, email_contato: e.target.value})}
                    placeholder="contato@exemplo.com"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({...formData, ativo: checked})}
                  />
                  <Label htmlFor="ativo">Parceiro Ativo</Label>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {editingPartner ? 'Atualizar' : 'Criar'} Parceiro
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total de Parceiros</p>
                  <p className="text-2xl font-bold text-slate-900">{partners.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Ativos</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {partners.filter(p => p.ativo).length}
                  </p>
                </div>
                <Target className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Usuários Referidos</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {users.filter(u => u.referral_code).length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Revenue Total</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {partners.reduce((sum, p) => sum + getPartnerStats(p.codigo).revenue, 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Parceiros */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Performance dos Parceiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            {partners.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Link de Referência</TableHead>
                    <TableHead>Usuários</TableHead>
                    <TableHead>Assinantes</TableHead>
                    <TableHead>Conversões</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map((partner) => {
                    const stats = getPartnerStats(partner.codigo);
                    const referralUrl = `${window.location.origin}?ref=${partner.codigo}`;
                    
                    return (
                      <TableRow key={partner.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{partner.nome}</div>
                            {partner.email_contato && (
                              <div className="text-sm text-slate-500">{partner.email_contato}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 max-w-xs">
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded truncate">
                              ...?ref={partner.codigo}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(referralUrl, partner.id)}
                              className="p-1"
                            >
                              {copiedUrl === partner.id ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{stats.totalUsers}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-emerald-100 text-emerald-800">
                            {stats.activeSubscribers}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {stats.totalTransactions} ({stats.conversionRate}%)
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          R$ {stats.revenue.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={partner.ativo 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                              : 'bg-slate-100 text-slate-800 border-slate-200'
                            }
                          >
                            {partner.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(partner)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(partner)}
                              className={partner.ativo ? "text-orange-600 hover:text-orange-700" : "text-emerald-600 hover:text-emerald-700"}
                            >
                              {partner.ativo ? "Desativar" : "Ativar"}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir o parceiro "{partner.nome}"? 
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(partner.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium mb-2">Nenhum parceiro cadastrado</h3>
                <p>Crie seu primeiro parceiro para começar a acompanhar referências.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}