
import React, { useState, useEffect, useCallback } from 'react';
import { User, Transacao } from '@/entities/all';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, Search, Users as UsersIcon, Edit, Trash2, 
  Download, Activity, UserX, UserCheck, Send,
  TrendingUp, Eye, DollarSign, MessageCircle, Clock
} from 'lucide-react';
import { formatDateBrasiliaShort } from '../components/utils/dateUtils';
import { SendEmail } from '@/integrations/Core';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailData, setEmailData] = useState({ subject: '', body: '', recipients: 'all' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersData, transacoesData] = await Promise.all([
        User.list('-created_date'),
        Transacao.list('-created_date')
      ]);
      setUsers(usersData || []);
      setTransacoes(transacoesData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...users]; // Use spread to create a new array, avoiding direct mutation

    // Filtro de busca
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(lowercasedFilter) ||
        user.email?.toLowerCase().includes(lowercasedFilter)
      );
    }

    // Filtro de função
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        const activeUsers = transacoes.map(t => t.created_by);
        filtered = filtered.filter(user => activeUsers.includes(user.email));
      } else if (statusFilter === 'inactive') {
        const activeUsers = transacoes.map(t => t.created_by);
        filtered = filtered.filter(user => !activeUsers.includes(user.email));
      } else if (statusFilter === 'paying') {
        const payingUsers = transacoes.filter(t => t.status_pagamento === 'pago').map(t => t.created_by);
        filtered = filtered.filter(user => payingUsers.includes(user.email));
      }
    }

    // Filtro de data
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case '7days':
          filterDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          filterDate.setDate(now.getDate() - 30);
          break;
        case '90days':
          filterDate.setDate(now.getDate() - 90);
          break;
        default:
          break; // Added default to satisfy linting or for future cases
      }
      
      // The condition `if (dateFilter !== 'all')` is redundant here because it's already checked above.
      // But preserving it as per original logic.
      if (dateFilter !== 'all') { 
        filtered = filtered.filter(user => {
          const userCreatedDate = new Date(user.created_date);
          return userCreatedDate >= filterDate;
        });
      }
    }

    setFilteredUsers(filtered);
  }, [users, transacoes, searchTerm, roleFilter, statusFilter, dateFilter]); // Dependency array for useCallback

  useEffect(() => {
    applyFilters();
  }, [applyFilters]); // Now useEffect depends only on the memoized applyFilters function

  const getUserStats = (userEmail) => {
    const userTransactions = transacoes.filter(t => t.created_by === userEmail);
    const totalBuscas = userTransactions.length;
    const totalGasto = userTransactions
      .filter(t => t.status_pagamento === 'pago')
      .reduce((sum, t) => sum + (t.valor_total || 0), 0);
    const ultimaAtividade = userTransactions.length > 0 
      ? Math.max(...userTransactions.map(t => new Date(t.created_date).getTime()))
      : null;

    return {
      totalBuscas,
      totalGasto,
      ultimaAtividade: ultimaAtividade ? new Date(ultimaAtividade) : null,
      conversoesPagas: userTransactions.filter(t => t.status_pagamento === 'pago').length
    };
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getColorFromEmail = (email) => {
    if (!email) return 'bg-slate-400';
    const colors = [
      'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 
      'bg-purple-400', 'bg-pink-400', 'bg-indigo-400', 'bg-teal-400'
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleEditUser = async (userData) => {
    setIsEditing(true);
    try {
      await User.update(editingUser.id, userData);
      await loadData();
      setEditingUser(null);
    } catch (error) {
      console.error("Erro ao editar usuário:", error);
      alert("Erro ao editar usuário. Tente novamente.");
    } finally {
      setIsEditing(false);
    }
  };

  const handleSuspendUser = async (userId, suspend = true) => {
    try {
      await User.update(userId, { suspended: suspend });
      await loadData();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status do usuário.");
    }
  };

  const handleDeleteUser = async (userId) => {
    setIsDeleting(true);
    try {
      await User.delete(userId);
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendEmail = async () => {
    setIsSendingEmail(true);
    try {
      let recipients = [];
      
      if (emailData.recipients === 'all') {
        recipients = filteredUsers.map(u => u.email);
      } else if (emailData.recipients === 'active') {
        const activeEmails = [...new Set(transacoes.map(t => t.created_by))]; // Use Set for unique active emails
        recipients = filteredUsers.filter(u => activeEmails.includes(u.email)).map(u => u.email);
      } else if (emailData.recipients === 'paying') {
        const payingEmails = [...new Set(transacoes.filter(t => t.status_pagamento === 'pago').map(t => t.created_by))]; // Use Set for unique paying emails
        recipients = filteredUsers.filter(u => payingEmails.includes(u.email)).map(u => u.email);
      }

      for (const email of recipients) {
        await SendEmail({
          to: email,
          subject: emailData.subject,
          body: emailData.body
        });
      }

      alert(`Email enviado para ${recipients.length} usuários com sucesso!`);
      setEmailData({ subject: '', body: '', recipients: 'all' });
    } catch (error) {
      console.error("Erro ao enviar emails:", error);
      alert("Erro ao enviar emails. Tente novamente.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Nome', 'Email', 'Função', 'Data Cadastro', 'Total Buscas', 'Total Gasto', 'Conversões Pagas'],
      ...filteredUsers.map(user => {
        const stats = getUserStats(user.email);
        return [
          user.full_name || '',
          user.email || '',
          user.role || '',
          formatDateBrasiliaShort(user.created_date),
          stats.totalBuscas,
          `R$ ${stats.totalGasto.toFixed(2)}`,
          stats.conversoesPagas
        ];
      })
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getSegmentStats = () => {
    const total = users.length;
    const activeUsers = [...new Set(transacoes.map(t => t.created_by))].length;
    const payingUsers = [...new Set(transacoes.filter(t => t.status_pagamento === 'pago').map(t => t.created_by))].length;
    const newUsers = users.filter(u => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(u.created_date) >= weekAgo;
    }).length;

    return { total, activeUsers, payingUsers, newUsers };
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

  const segmentStats = getSegmentStats();

  return (
    <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gerenciamento de Usuários</h1>
            <p className="text-slate-600">Painel completo para gerenciar todos os usuários da plataforma.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={exportUsers} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Email
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Enviar Email em Massa</DialogTitle>
                </DialogHeader>
                <EmailForm 
                  emailData={emailData}
                  setEmailData={setEmailData}
                  onSend={handleSendEmail}
                  isLoading={isSendingEmail}
                  userCount={filteredUsers.length}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Estatísticas de Segmentação */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total de Usuários</p>
                  <p className="text-2xl font-bold text-slate-900">{segmentStats.total}</p>
                </div>
                <UsersIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-slate-900">{segmentStats.activeUsers}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Usuários Pagantes</p>
                  <p className="text-2xl font-bold text-slate-900">{segmentStats.payingUsers}</p>
                </div>
                <DollarSign className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white/80">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Novos (7 dias)</p>
                  <p className="text-2xl font-bold text-slate-900">{segmentStats.newUsers}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="border-0 shadow-lg bg-white/80">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Funções</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="paying">Pagantes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Data de Cadastro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Datas</SelectItem>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="90days">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>

              <div className="text-sm text-slate-600 flex items-center">
                {filteredUsers.length} de {users.length} usuários
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Usuários */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80">
                  <TableHead className="px-6 py-3">Usuário</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Estatísticas</TableHead>
                  <TableHead>Última Atividade</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => {
                    const stats = getUserStats(user.email);
                    return (
                      <TableRow key={user.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium text-slate-900 px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${getColorFromEmail(user.email)} rounded-full flex items-center justify-center text-white font-semibold`}>
                              {getInitials(user.full_name)}
                            </div>
                            <div>
                              <div className="font-medium">{user.full_name || 'Nome não disponível'}</div>
                              <div className="text-sm text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.role === 'admin'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : 'bg-slate-100 text-slate-800 border-slate-200'
                            }
                          >
                            {user.role}
                          </Badge>
                          {user.suspended && (
                            <Badge className="ml-2 bg-red-100 text-red-800 border-red-200">
                              Suspenso
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-blue-500" />
                              <span>{stats.totalBuscas} buscas</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3 text-green-500" />
                              <span>R$ {stats.totalGasto.toFixed(2)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {stats.ultimaAtividade ? (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateBrasiliaShort(stats.ultimaAtividade.toISOString())}
                            </div>
                          ) : (
                            <span className="text-slate-400">Nunca</span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          {formatDateBrasiliaShort(user.created_date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUser(user)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-2xl">
                                <UserDetailsModal user={selectedUser} stats={stats} transacoes={transacoes} />
                              </DialogContent>
                            </Dialog>

                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingUser(user)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Editar Usuário</DialogTitle>
                                </DialogHeader>
                                <EditUserForm 
                                  user={editingUser} 
                                  onSave={handleEditUser}
                                  isLoading={isEditing}
                                />
                              </DialogContent>
                            </Dialog>

                            {!user.suspended ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuspendUser(user.id, true)}
                                className="text-orange-600"
                              >
                                <UserX className="w-3 h-3" />
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuspendUser(user.id, false)}
                                className="text-green-600"
                              >
                                <UserCheck className="w-3 h-3" />
                              </Button>
                            )}

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir permanentemente o usuário <strong>{user.full_name}</strong>?
                                    Esta ação não pode ser desfeita e todos os dados do usuário serão perdidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={isDeleting}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Excluir Permanentemente
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                      Nenhum usuário encontrado com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente do formulário de edição
const EditUserForm = ({ user, onSave, isLoading }) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    role: user?.role || 'user'
  });

  // Ensure form data updates if the user prop changes (e.g., dialog re-opens with a different user)
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        role: user.role || 'user'
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Nome Completo
        </label>
        <Input
          value={formData.full_name}
          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          placeholder="Nome completo do usuário"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Função
        </label>
        <Select 
          value={formData.role} 
          onValueChange={(value) => setFormData({...formData, role: value})}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-slate-50 p-3 rounded-lg">
        <p className="text-sm text-slate-600">
          <strong>Email:</strong> {user.email} (não editável)
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Salvar Alterações
        </Button>
      </div>
    </form>
  );
};

// Componente de detalhes do usuário
const UserDetailsModal = ({ user, stats, transacoes }) => {
  if (!user) return null;

  const userTransactions = transacoes.filter(t => t.created_by === user.email);

  // Function to get initials, safe to use here as it's pure
  const getInitialsForModal = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold`}>
            {getInitialsForModal(user.full_name)}
          </div>
          <div>
            <div className="text-xl font-bold">{user.full_name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
          </div>
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalBuscas}</div>
                  <div className="text-sm text-slate-600">Total de Buscas</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">R$ {stats.totalGasto.toFixed(2)}</div>
                  <div className="text-sm text-slate-600">Total Gasto</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.conversoesPagas}</div>
                  <div className="text-sm text-slate-600">Conversões Pagas</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-600">
                    {stats.ultimaAtividade ? formatDateBrasiliaShort(stats.ultimaAtividade.toISOString()) : 'Nunca'}
                  </div>
                  <div className="text-sm text-slate-600">Última Atividade</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {userTransactions.length > 0 ? (
              userTransactions.slice(0, 10).map((transaction, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{transaction.dor_relatada?.substring(0, 50)}...</div>
                      <div className="text-xs text-slate-500">{formatDateBrasiliaShort(transaction.created_date)}</div>
                    </div>
                    <Badge
                      className={
                        transaction.status_pagamento === 'pago'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }
                    >
                      {transaction.status_pagamento}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-8">
                Nenhuma atividade registrada
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Componente de formulário de email
const EmailForm = ({ emailData, setEmailData, onSend, isLoading, userCount }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Destinatários
        </label>
        <Select 
          value={emailData.recipients} 
          onValueChange={(value) => setEmailData({...emailData, recipients: value})}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os usuários ({userCount})</SelectItem>
            <SelectItem value="active">Usuários ativos</SelectItem>
            <SelectItem value="paying">Usuários pagantes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Assunto
        </label>
        <Input
          value={emailData.subject}
          onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
          placeholder="Assunto do email"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Mensagem
        </label>
        <Textarea
          value={emailData.body}
          onChange={(e) => setEmailData({...emailData, body: e.target.value})}
          placeholder="Digite sua mensagem aqui..."
          rows={6}
          required
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button onClick={onSend} disabled={isLoading || !emailData.subject || !emailData.body}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Enviar Email
        </Button>
      </div>
    </div>
  );
};
