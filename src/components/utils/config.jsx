// Configurações globais da aplicação

export const APP_CONFIG = {
  // Domínio de produção (usado para links de indicação e externos)
  PRODUCTION_DOMAIN: 'https://encontrai.com',
  
  // Domínio atual (para desenvolvimento/testes)
  CURRENT_DOMAIN: typeof window !== 'undefined' ? window.location.origin : '',
  
  // Usar domínio de produção para links públicos/indicação
  getPublicUrl: (path = '') => {
    const domain = 'https://encontrai.com';
    return `${domain}${path}`;
  },
  
  // Configurações de pagamento
  PAYMENT: {
    VALOR_POR_STARTUP: 5.00,
    DESCONTO_BUNDLE: 3.00,
    BUNDLE_SIZE: 5
  },
  
  // Configurações de indicação
  REFERRAL: {
    CREDIT_VALUE: 5.00,
    COMMISSION_PERCENTAGE: 20
  }
};

export default APP_CONFIG;