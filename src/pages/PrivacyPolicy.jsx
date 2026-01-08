import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="py-12 px-4 max-w-4xl mx-auto">
      <div className="prose prose-lg prose-slate max-w-none">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Política de Privacidade</h1>
        
        <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>

        <p>
          A sua privacidade é crucial para nós. Esta Política de Privacidade descreve como o EncontrAI (a "Plataforma") coleta, usa, armazena, compartilha e protege suas informações pessoais. Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo com esta política.
        </p>

        <h2>1. Informações que Coletamos</h2>
        <p>Coletamos diferentes tipos de informações para fornecer e melhorar nosso serviço para você:</p>
        <ul>
          <li><strong>Dados Pessoais:</strong> Ao se cadastrar ou realizar uma busca, podemos solicitar informações como nome, e-mail e CPF. Esses dados são essenciais para a criação da sua conta e para o processo de transação.</li>
          <li><strong>Dados da Transação:</strong> Armazenamos o histórico de suas buscas, incluindo a "dor relatada", as startups sugeridas, as selecionadas por você e o status do pagamento.</li>
          <li><strong>Dados de Feedback:</strong> Se você nos fornecer uma avaliação, guardaremos sua classificação por estrelas e seus comentários para melhorar nossos serviços.</li>
          <li><strong>Cookies e Dados de Uso:</strong> Podemos usar cookies para melhorar a experiência no site. Os dados de uso podem incluir informações como o endereço IP do seu computador, tipo de navegador, páginas visitadas e outros dados de diagnóstico.</li>
        </ul>

        <h2>2. Como Usamos Suas Informações</h2>
        <p>Usamos os dados coletados para diversos fins:</p>
        <ul>
          <li>Para operar e manter nossa Plataforma.</li>
          <li>Para personalizar sua experiência e encontrar as soluções mais relevantes para sua necessidade.</li>
          <li>Para processar suas transações e pagamentos.</li>
          <li>Para nos comunicarmos com você, incluindo o envio de e-mails de confirmação, boas-vindas e recuperação de carrinho.</li>
          <li>Para fornecer suporte ao cliente.</li>
          <li>Para monitorar o uso da nossa Plataforma e detectar problemas técnicos.</li>
        </ul>

        <h2>3. Compartilhamento de Dados</h2>
        <p>Nós não vendemos suas informações pessoais. O compartilhamento de dados ocorre apenas nas seguintes circunstâncias:</p>
        <ul>
          <li><strong>Com Startups:</strong> Após a confirmação do pagamento, compartilhamos seu nome e e-mail com as startups que você escolheu desbloquear para que possam entrar em contato.</li>
          <li><strong>Com Provedores de Serviço:</strong> Utilizamos serviços de terceiros para processamento de pagamentos (Mercado Pago) e envio de e-mails. Eles têm acesso aos seus dados apenas para realizar essas tarefas em nosso nome e são obrigados a não divulgá-los ou usá-los para qualquer outra finalidade.</li>
        </ul>

        <h2>4. Seus Direitos (LGPD)</h2>
        <p>Em conformidade com a Lei Geral de Proteção de Dados (LGPD), você tem o direito de:</p>
        <ul>
          <li>Acessar e receber uma cópia dos seus dados pessoais que mantemos.</li>
          <li>Retificar quaisquer informações pessoais incompletas ou imprecisas.</li>
          <li>Solicitar a exclusão dos seus dados pessoais.</li>
          <li>Solicitar a portabilidade dos seus dados para outro serviço.</li>
        </ul>
        <p>Para exercer esses direitos, entre em contato conosco através da nossa página de Contato.</p>

        <h2>5. Segurança dos Dados</h2>
        <p>
          A segurança dos seus dados é importante para nós, mas lembre-se que nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro. Embora nos esforcemos para usar meios comercialmente aceitáveis para proteger seus dados pessoais, não podemos garantir sua segurança absoluta.
        </p>

        <h2>6. Alterações a Esta Política de Privacidade</h2>
        <p>
          Podemos atualizar nossa Política de Privacidade de tempos em tempos. Notificaremos você sobre quaisquer alterações, publicando a nova Política de Privacidade nesta página. Aconselhamos que você revise esta Política de Privacidade periodicamente para quaisquer alterações.
        </p>
      </div>
    </div>
  );
}