/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AcompanharPagamento from './pages/AcompanharPagamento';
import Assistente from './pages/Assistente';
import Buscar from './pages/Buscar';
import Checkout from './pages/Checkout';
import Contato from './pages/Contato';
import Conversas from './pages/Conversas';
import Dashboard from './pages/Dashboard';
import DashboardUsuario from './pages/DashboardUsuario';
import DetalhesBusca from './pages/DetalhesBusca';
import FAQ from './pages/FAQ';
import Feedback from './pages/Feedback';
import Ferramentas from './pages/Ferramentas';
import Growth from './pages/Growth';
import Home from './pages/Home';
import LaboratorioStartups from './pages/LaboratorioStartups';
import MinhasBuscas from './pages/MinhasBuscas';
import Painel from './pages/Painel';
import Parceiros from './pages/Parceiros';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Resultados from './pages/Resultados';
import Startups from './pages/Startups';
import StatusPagamento from './pages/StatusPagamento';
import Sucesso from './pages/Sucesso';
import TermosDeUso from './pages/TermosDeUso';
import analytics from './pages/analytics';
import dashboard from './pages/dashboard';
import index from './pages/index';
import startups from './pages/startups';
import transacoes from './pages/transacoes';
import users from './pages/users';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AcompanharPagamento": AcompanharPagamento,
    "Assistente": Assistente,
    "Buscar": Buscar,
    "Checkout": Checkout,
    "Contato": Contato,
    "Conversas": Conversas,
    "Dashboard": Dashboard,
    "DashboardUsuario": DashboardUsuario,
    "DetalhesBusca": DetalhesBusca,
    "FAQ": FAQ,
    "Feedback": Feedback,
    "Ferramentas": Ferramentas,
    "Growth": Growth,
    "Home": Home,
    "LaboratorioStartups": LaboratorioStartups,
    "MinhasBuscas": MinhasBuscas,
    "Painel": Painel,
    "Parceiros": Parceiros,
    "PrivacyPolicy": PrivacyPolicy,
    "Resultados": Resultados,
    "Startups": Startups,
    "StatusPagamento": StatusPagamento,
    "Sucesso": Sucesso,
    "TermosDeUso": TermosDeUso,
    "analytics": analytics,
    "dashboard": dashboard,
    "index": index,
    "startups": startups,
    "transacoes": transacoes,
    "users": users,
}

export const pagesConfig = {
    mainPage: "Conversas",
    Pages: PAGES,
    Layout: __Layout,
};