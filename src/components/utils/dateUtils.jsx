
// Função para formatar data no fuso horário de São Paulo (formato curto)
export const formatDateBrasiliaShort = (dateString) => {
  if (!dateString) return 'Data não disponível';
  
  try {
    const date = new Date(dateString);
    
    // Configura para o fuso horário de São Paulo (formato DD/MM/AA)
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit', // Mudou de 'numeric' para '2-digit'
      timeZone: 'America/Sao_Paulo'
    };
    
    return date.toLocaleDateString('pt-BR', options);
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
};

// Função para calcular tempo relativo em português do Brasil
export const formatDistanceToBrazilianTime = (dateString) => {
  if (!dateString) return 'Data não disponível';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora mesmo';
    if (diffInMinutes < 60) return `${diffInMinutes} min atrás`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} semanas atrás`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} meses atrás`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} anos atrás`;
  } catch (error) {
    console.error('Erro ao calcular tempo relativo:', error);
    return 'Data inválida';
  }
};

// Função para formatar data completa em português brasileiro
export const formatDateBrasiliaComplete = (dateString) => {
  if (!dateString) return 'Data não disponível';
  
  try {
    const date = new Date(dateString);
    
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    };
    
    return date.toLocaleDateString('pt-BR', options);
  } catch (error) {
    console.error('Erro ao formatar data completa:', error);
    return 'Data inválida';
  }
};

// Função para verificar se uma data é hoje
export const isToday = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    return date.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

// Função para verificar se uma data é esta semana
export const isThisWeek = (dateString) => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    return diffInDays >= 0 && diffInDays < 7;
  } catch (error) {
    return false;
  }
};
