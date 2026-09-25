import React from 'react';
import { 
  X, Building2, Search, Sparkles, PhoneCall, MessageSquare, 
  BarChart3, Home, Key, Briefcase, Send, Terminal, 
  Share2, ShieldCheck, Download, Users, RefreshCw, LogOut,
  ChevronRight, Globe, TrendingUp
} from 'lucide-react';
import { User, MainNavTab } from '../types';

interface MobileCommandSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  currentQuotaUsage: { remainingSearches: number; isBlocked: boolean };
  country: string;
  countryFlag?: string;
  leadsCount: number;
  realEstateCount: number;
  isHighTicketActive: boolean;
  onToggleHighTicket: () => void;
  onSelectNavTab: (tab: MainNavTab) => void;
  onOpenSearch: () => void;
  onOpenCockpit: () => void;
  onOpenCadence: () => void;
  onOpenSettings: (tab?: string) => void;
  onOpenProfile: () => void;
  onOpenWebhook: () => void;
  onOpenScraperStudio: () => void;
  onOpenRgpd: () => void;
  onOpenCountryModal: () => void;
  onOpenAdmin: () => void;
  onOpenAuthModal: () => void;
  onExportCsv: () => void;
  onLogout: () => void;
}

export const MobileCommandSheet: React.FC<MobileCommandSheetProps> = ({
  isOpen,
  onClose,
  currentUser,
  currentQuotaUsage,
  country,
  countryFlag = '🇵🇹',
  leadsCount,
  realEstateCount,
  isHighTicketActive,
  onToggleHighTicket,
  onSelectNavTab,
  onOpenSearch,
  onOpenCockpit,
  onOpenCadence,
  onOpenSettings,
  onOpenProfile,
  onOpenWebhook,
  onOpenScraperStudio,
  onOpenRgpd,
  onOpenCountryModal,
  onOpenAdmin,
  onOpenAuthModal,
  onExportCsv,
  onLogout
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-md flex flex-col justify-end md:hidden animate-fadeIn">
      {/* Backdrop touch to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Sheet Container */}
      <div className="w-full bg-slate-900 border-t border-slate-700/80 rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-slideUp">
        
        {/* Header with Grab Handle & Close */}
        <div className="px-5 pt-3 pb-3 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white tracking-tight leading-tight">
                CriaHub Mobile
              </h2>
              <p className="text-[10px] text-slate-400">
                Central de Prospecção & Vendas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenCountryModal();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 active:scale-95"
            >
              <span className="text-sm leading-none">{countryFlag}</span>
              <span>{country}</span>
            </button>

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl flex items-center justify-center active:scale-95"
              aria-label="Fechar Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto px-4 py-4 space-y-5 flex-1 pb-16">
          
          {/* User Profile Snapshot */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                {currentUser.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="text-xs font-black text-white">{currentUser.name}</div>
                <div className="text-[11px] text-indigo-300 font-semibold">{currentUser.companyName}</div>
                <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                  {currentQuotaUsage.remainingSearches === Infinity 
                    ? '👑 Pesquisas Ilimitadas' 
                    : `${currentQuotaUsage.remainingSearches} pesquisas restantes`}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Admin
            </button>
          </div>

          {/* Section: Navegação Rápida */}
          <div className="space-y-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1 block">
              Prospecção & Fechamento
            </span>

            <div className="grid grid-cols-1 gap-2">
              {/* 1. Leads B2B */}
              <button
                onClick={() => {
                  onSelectNavTab('b2b_leads');
                  onClose();
                }}
                className="w-full p-3 bg-slate-800/80 active:bg-slate-700/80 border border-slate-700/80 rounded-2xl flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">Empresas & Leads B2B</div>
                    <div className="text-[10px] text-slate-400">Ver lista com telefones e decisores</div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-black">
                  {leadsCount}
                </span>
              </button>

              {/* 2. Filtro Rápido High-Ticket (€599-€997) */}
              <button
                onClick={() => {
                  onToggleHighTicket();
                  onSelectNavTab('b2b_leads');
                  onClose();
                }}
                className={`w-full p-3 border rounded-2xl flex items-center justify-between text-left transition-colors ${
                  isHighTicketActive
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-100 ring-2 ring-emerald-400/40'
                    : 'bg-slate-800/80 active:bg-slate-700/80 border-slate-700/80 text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isHighTicketActive ? 'bg-emerald-500/30 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold">💎 Clientes High-Ticket (€599 - €997)</div>
                    <div className={`text-[10px] ${isHighTicketActive ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {isHighTicketActive ? 'Filtro ativo: apenas empresas de alto porte' : 'Filtrar empresas com alto poder de compra'}
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isHighTicketActive ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                }`}>
                  {isHighTicketActive ? 'Ativo' : 'Ativar'}
                </span>
              </button>

              {/* 3. Nova Busca de Leads */}
              <button
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="w-full p-3 bg-slate-800/80 active:bg-slate-700/80 border border-slate-700/80 rounded-2xl flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">Nova Busca no Radar</div>
                    <div className="text-[10px] text-slate-400">Auto-Discovery ou palavra-chave + cidade</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              {/* 4. Cockpit SDR 1-a-1 */}
              <button
                onClick={() => {
                  onClose();
                  onOpenCockpit();
                }}
                className="w-full p-3 bg-slate-800/80 active:bg-slate-700/80 border border-slate-700/80 rounded-2xl flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">Cockpit do SDR (Foco 1-a-1)</div>
                    <div className="text-[10px] text-slate-400">Scripts em teleprompter e ligações rápidas</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              {/* 5. Copilot IA */}
              <button
                onClick={() => {
                  onSelectNavTab('copilot_chat');
                  onClose();
                }}
                className="w-full p-3 bg-slate-800/80 active:bg-slate-700/80 border border-slate-700/80 rounded-2xl flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">Assistente IA Copilot</div>
                    <div className="text-[10px] text-slate-400">Chat inteligente para scripts e estratégias</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              {/* 6. Relatórios & Métricas */}
              <button
                onClick={() => {
                  onSelectNavTab('analytics');
                  onClose();
                }}
                className="w-full p-3 bg-slate-800/80 active:bg-slate-700/80 border border-slate-700/80 rounded-2xl flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">Relatórios & Métricas</div>
                    <div className="text-[10px] text-slate-400">Conversão de contatos e volume</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>

              {/* 7. Imóveis Particulares */}
              <button
                onClick={() => {
                  onSelectNavTab('real_estate');
                  onClose();
                }}
                className="w-full p-3 bg-slate-800/80 active:bg-slate-700/80 border border-slate-700/80 rounded-2xl flex items-center justify-between text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white">Imóveis Particulares (FSBO)</div>
                    <div className="text-[10px] text-slate-400">Ideal para mediação imobiliária direta</div>
                  </div>
                </div>
                {realEstateCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-600 text-white rounded-full text-[10px] font-black">
                    {realEstateCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Section: Ferramentas & Configurações */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1 block">
              Ferramentas & Automações
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  onClose();
                  onOpenSettings('rapidapi');
                }}
                className="p-3 bg-slate-800/80 active:bg-slate-700 border border-slate-700/80 rounded-xl text-left space-y-1"
              >
                <Key className="w-4 h-4 text-emerald-400" />
                <div className="font-bold text-white leading-tight">APIs & Modelos</div>
                <div className="text-[10px] text-slate-400">Chaves Groq e Gemini</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="p-3 bg-slate-800/80 active:bg-slate-700 border border-slate-700/80 rounded-xl text-left space-y-1"
              >
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <div className="font-bold text-white leading-tight">Site & Nichos</div>
                <div className="text-[10px] text-slate-400">Matching do seu ICP</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenWebhook();
                }}
                className="p-3 bg-slate-800/80 active:bg-slate-700 border border-slate-700/80 rounded-xl text-left space-y-1"
              >
                <Send className="w-4 h-4 text-purple-400" />
                <div className="font-bold text-white leading-tight">CRM & Webhook</div>
                <div className="text-[10px] text-slate-400">Z-API e n8n</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenScraperStudio();
                }}
                className="p-3 bg-slate-800/80 active:bg-slate-700 border border-slate-700/80 rounded-xl text-left space-y-1"
              >
                <Terminal className="w-4 h-4 text-amber-400" />
                <div className="font-bold text-white leading-tight">Scraper Studio</div>
                <div className="text-[10px] text-slate-400">Playwright & Maps</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenRgpd();
                }}
                className="p-3 bg-slate-800/80 active:bg-slate-700 border border-slate-700/80 rounded-xl text-left space-y-1"
              >
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                <div className="font-bold text-white leading-tight">RGPD (Lista STOP)</div>
                <div className="text-[10px] text-slate-400">Proteção jurídica</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onExportCsv();
                }}
                className="p-3 bg-slate-800/80 active:bg-slate-700 border border-slate-700/80 rounded-xl text-left space-y-1"
              >
                <Download className="w-4 h-4 text-sky-400" />
                <div className="font-bold text-white leading-tight">Exportar CSV</div>
                <div className="text-[10px] text-slate-400">Download dos leads</div>
              </button>
            </div>
          </div>

          {/* Section: Conta & Sessão */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenAuthModal();
              }}
              className="flex-1 py-2.5 px-3 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Trocar Conta</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="py-2.5 px-4 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-xl text-xs font-bold border border-rose-800/60 flex items-center justify-center gap-1.5 active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

export default MobileCommandSheet;
