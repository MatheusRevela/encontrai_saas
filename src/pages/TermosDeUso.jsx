import React from 'react';

export default function TermosDeUso() {
  return (
    <div className="py-12 px-4 max-w-4xl mx-auto">
      <div className="prose prose-lg prose-slate max-w-none">
        <h1 className="text-3xl font-bold mb-6 text-slate-900">Termos de Uso</h1>
        
        <p><strong>Última atualização:</strong> {new Date().toLocaleDateString('pt-BR')}</p>

        <p>
          Bem-vindo ao EncontrAI! Estes Termos de Uso ("Termos") regem seu acesso e uso da nossa plataforma que conecta pequenas e médias empresas a startups de tecnologia ("Serviços"). Ao acessar ou usar nossos Serviços, você concorda em ficar vinculado a estes Termos.
        </p>

        <h2>1. Descrição dos Serviços</h2>
        <p>
          O EncontrAI é uma plataforma que utiliza inteligência artificial para analisar as necessidades de negócios ("dores") descritas pelos usuários e recomendar soluções de startups parceiras. O acesso aos detalhes de contato das startups recomendadas é um serviço pago.
        </p>

        <h2>2. Uso da Plataforma</h2>
        <ul>
          <li>Você concorda em fornecer informações verdadeiras, precisas e completas ao usar nossos Serviços.</li>
          <li>Você é responsável por manter a confidencialidade de sua conta e senha.</li>
          <li>O uso da plataforma para fins ilegais ou não autorizados é estritamente proibido.</li>
        </ul>

        <h2>3. Pagamentos e Desbloqueio</h2>
        <ul>
          <li>Para ter acesso aos contatos de uma ou mais startups, você deve realizar um pagamento através do nosso gateway (Mercado Pago).</li>
          <li>O valor é cobrado por cada startup que você decide "desbloquear".</li>
          <li>Os pagamentos não são reembolsáveis após os dados de contato terem sido disponibilizados.</li>
        </ul>

        <h2>4. Propriedade Intelectual</h2>
        <p>
          O conteúdo da plataforma, incluindo textos, gráficos, logos e o software, é propriedade do EncontrAI e protegido por leis de direitos autorais. Você não pode copiar, modificar ou distribuir nosso conteúdo sem permissão prévia por escrito.
        </p>

        <h2>5. Limitação de Responsabilidade</h2>
        <p>
          O EncontrAI atua como um intermediário. Não garantimos a qualidade, adequação ou legalidade dos serviços prestados pelas startups listadas. Qualquer negociação ou contrato firmado entre você e uma startup é de sua inteira responsabilidade. Nossa responsabilidade limita-se ao valor pago pelos serviços de desbloqueio de contatos em nossa plataforma.
        </p>

        <h2>6. Modificações nos Termos</h2>
        <p>
          Reservamo-nos o direito de modificar estes Termos a qualquer momento. A versão mais recente estará sempre disponível nesta página. Ao continuar a usar os Serviços após as alterações entrarem em vigor, você concorda com os Termos revisados.
        </p>

        <h2>7. Lei Aplicável</h2>
        <p>
          Estes Termos serão regidos e interpretados de acordo com as leis da República Federativa do Brasil.
        </p>
      </div>
    </div>
  );
}