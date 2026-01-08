
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Building2, Handshake, Mail, DollarSign, Users, HeadphonesIcon } from 'lucide-react';

export default function Contato() {
  const navigate = useNavigate();

  const opcoesPrincipais = [
    {
      id: 'cliente',
      titulo: 'Sou Cliente',
      descricao: 'Encontrou algum problema na plataforma ou tem alguma sugestão de melhoria? Nos conte aqui.',
      icone: User,
      cor: 'text-emerald-600',
      corFundo: 'bg-emerald-50',
      corBorda: 'border-emerald-200',
      textoBotao: 'Relatar um Problema',
      corBotao: 'bg-emerald-600 hover:bg-emerald-700',
      link: 'https://forms.gle/15VVxgVd4hr7rg778'
    },
    {
      id: 'startup',
      titulo: 'Sou uma Startup',
      descricao: 'Sua startup está em nossa base e você deseja remover seus dados? Solicite a remoção aqui (LGPD).',
      icone: Building2,
      cor: 'text-red-600',
      corFundo: 'bg-red-50',
      corBorda: 'border-red-200',
      textoBotao: 'Remover meus Dados',
      corBotao: 'bg-red-600 hover:bg-red-700',
      link: 'https://forms.gle/VAByGXAXq8fDsJF47'
    },
    {
      id: 'parceiro',
      titulo: 'Quero ser um Parceiro',
      descricao: 'Quer fazer parte da nossa base de soluções e ser encontrado por milhares de clientes? Cadastre-se.',
      icone: Handshake,
      cor: 'text-blue-600',
      corFundo: 'bg-blue-50',
      corBorda: 'border-blue-200',
      textoBotao: 'Quero ser um Parceiro',
      corBotao: 'bg-slate-900 hover:bg-slate-800',
      link: 'https://forms.gle/83Dz1D3fKNTGRxA4A'
    }
  ];

  const contatos = [
    {
      area: 'Comercial',
      email: 'comercial@encontrai.com',
      descricao: 'Dúvidas sobre vendas, orçamentos e planos empresariais.',
      icon: Building2,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      area: 'Financeiro', 
      email: 'financeiro@encontrai.com',
      descricao: 'Questões sobre pagamentos, faturas e reembolsos.',
      icon: DollarSign,
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      area: 'Parcerias',
      email: 'parcerias@encontrai.com', 
      descricao: 'Oportunidades de parceria e colaboração estratégica.',
      icon: Handshake,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50', 
      borderColor: 'border-orange-200'
    },
    {
      area: 'Recursos Humanos',
      email: 'rh@encontrai.com',
      descricao: 'Oportunidades de carreira e questões relacionadas a RH.',
      icon: Users,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      area: 'Suporte',
      email: 'suporte@encontrai.com',
      descricao: 'Suporte técnico e ajuda com o uso da plataforma.',
      icon: HeadphonesIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      area: 'Contato Geral',
      email: 'contato@encontrai.com',
      descricao: 'Para assuntos gerais ou quando não souber qual área escolher.',
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Fale Conosco</h1>
            <p className="text-slate-600">Selecione a opção que melhor descreve sua necessidade.</p>
          </div>
        </div>

        {/* Opções Principais */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {opcoesPrincipais.map((opcao) => {
            const Icone = opcao.icone;
            return (
              <Card key={opcao.id} className={`border-0 shadow-lg bg-white/80 hover:shadow-xl transition-all duration-300 ${opcao.corBorda} border-2`}>
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 ${opcao.corFundo} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icone className={`w-8 h-8 ${opcao.cor}`} />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900">
                    {opcao.titulo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-slate-600 h-20 flex items-center justify-center">
                    {opcao.descricao}
                  </p>
                  <Button 
                    onClick={() => window.open(opcao.link, '_blank')}
                    className={`w-full ${opcao.corBotao} text-white`}
                  >
                    {opcao.textoBotao}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contatos Diretos por Email */}
        <div className="mb-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800">Ou entre em contato direto</h2>
            <p className="text-slate-600">Envie um email diretamente para a área responsável.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contatos.map((contato, index) => {
              const Icon = contato.icon;
              return (
                <Card key={index} className={`border-0 shadow-md bg-white/70 hover:shadow-lg transition-all ${contato.borderColor} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-1.5 rounded-lg ${contato.bgColor}`}>
                        <Icon className={`w-4 h-4 ${contato.color}`} />
                      </div>
                      <span className="font-semibold text-slate-900 text-sm">{contato.area}</span>
                    </div>
                    <div className={`p-2 ${contato.bgColor} rounded-lg ${contato.borderColor} border text-center`}>
                      <a 
                        href={`mailto:${contato.email}`}
                        className="font-mono text-xs font-medium text-slate-900 hover:underline"
                      >
                        {contato.email}
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Nota informativa */}
        <div className="text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Não sabe qual opção escolher?
            </h3>
            <p className="text-slate-600">
              Use o <strong>Contato Geral</strong> e nossa equipe direcionará sua mensagem para a área certa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
