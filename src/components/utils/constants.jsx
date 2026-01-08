
export const CATEGORIAS = {
  gestao: "Gestão",
  vendas: "Vendas",
  marketing: "Marketing",
  financeiro: "Financeiro",
  operacional: "Operacional",
  rh: "Recursos Humanos",
  tecnologia: "Tecnologia",
  logistica: "Logística"
};

export const STATUS_PAGAMENTO = {
  pendente: "Pendente",
  pago: "Pago",
  recusado: "Recusado",
  cancelado: "Cancelado",
  expirado: "Expirado"
};

export const LIMITS = {
  MAX_STARTUPS_SUGERIDAS: 5, // Base de 5 startups
  MAX_STARTUPS_SELECIONADAS: 5,
  MAX_PROBLEMA_LENGTH: 2000,
  MIN_PROBLEMA_LENGTH: 10,
  MAX_FEEDBACK_LENGTH: 1000,
  TRANSACAO_EXPIRY_HOURS: 24,
  HIGH_MATCH_THRESHOLD: 90 // Threshold para mostrar startups extras
};

export const ROUTES = {
  HOME: 'Home',
  BUSCAR: 'Buscar',
  RESULTADOS: 'Resultados',
  CHECKOUT: 'Checkout',
  MINHAS_BUSCAS: 'MinhasBuscas',
  DASHBOARD: 'Dashboard',
  STARTUPS: 'Startups',
  TRANSACOES: 'Transacoes',
  ANALYTICS: 'Analytics',
  CONFIGURACOES: 'Configuracoes'
};
