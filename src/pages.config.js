import Conversas from './pages/Conversas';
import Assistente from './pages/Assistente';
import Buscar from './pages/Buscar';
import Resultados from './pages/Resultados';
import Checkout from './pages/Checkout';
import Sucesso from './pages/Sucesso';
import AcompanharPagamento from './pages/AcompanharPagamento';
import StatusPagamento from './pages/StatusPagamento';
import MinhasBuscas from './pages/MinhasBuscas';
import DetalhesBusca from './pages/DetalhesBusca';
import Feedback from './pages/Feedback';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contato from './pages/Contato';
import TermosDeUso from './pages/TermosDeUso';
import dashboard from './pages/dashboard';
import users from './pages/users';
import startups from './pages/startups';
import transacoes from './pages/transacoes';
import analytics from './pages/analytics';
import Startups from './pages/Startups';
import FAQ from './pages/FAQ';
import Growth from './pages/Growth';
import Parceiros from './pages/Parceiros';
import Painel from './pages/Painel';
import index from './pages/index';
import HomePublica from './pages/HomePublica';
import LaboratorioStartups from './pages/LaboratorioStartups';
import Ferramentas from './pages/Ferramentas';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Conversas": Conversas,
    "Assistente": Assistente,
    "Buscar": Buscar,
    "Resultados": Resultados,
    "Checkout": Checkout,
    "Sucesso": Sucesso,
    "AcompanharPagamento": AcompanharPagamento,
    "StatusPagamento": StatusPagamento,
    "MinhasBuscas": MinhasBuscas,
    "DetalhesBusca": DetalhesBusca,
    "Feedback": Feedback,
    "PrivacyPolicy": PrivacyPolicy,
    "Contato": Contato,
    "TermosDeUso": TermosDeUso,
    "dashboard": dashboard,
    "users": users,
    "startups": startups,
    "transacoes": transacoes,
    "analytics": analytics,
    "Startups": Startups,
    "FAQ": FAQ,
    "Growth": Growth,
    "Parceiros": Parceiros,
    "Painel": Painel,
    "index": index,
    "HomePublica": HomePublica,
    "LaboratorioStartups": LaboratorioStartups,
    "Ferramentas": Ferramentas,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Conversas",
    Pages: PAGES,
    Layout: __Layout,
};