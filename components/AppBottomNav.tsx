import React from 'react';
import { 
  Sparkles, Building2, Search, BarChart3, 
  Menu
} from 'lucide-react';

export type MainNavTab = 'copilot_chat' | 'b2b_leads' | 'real_estate' | 'analytics';

interface AppBottomNavProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  leadsCount: number;
  realEstateCount?: number;
  isHighTicketActive?: boolean;
  onToggleHighTicket?: () => void;
  onOpenSearch?: () => void;
  onOpenMobileMenu?: () => void;
  onOpenTools?: () => void;
  onOpenSettings?: () => void;
  onOpenAdmin?: () => void;
  userRole?: string;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  activeTab,
  onSelectTab,
  leadsCount,
  isHighTicketActive,
  onToggleHighTicket,
  onOpenSearch,
  onOpenMobileMenu
}) => {
  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/98 backdrop-blur-xl border-t border-slate-800 shadow-2xl safe-area-inset-bottom"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0px))' }}
      role="navigation"
      aria-label="Navegação Principal Mobile"
    >
      <div className="grid grid-cols-5 items-center px-1 pt-1.5 pb-1">
        
        {/* 1. Leads B2B */}
        <button
          type="button"
          onClick={() => onSelectTab('b2b_leads')}
          className={`flex flex-col items-center justify-center min-h-[52px] py-1 px-1 rounded-xl transition-all relative ${
            activeTab === 'b2b_leads' && !isHighTicketActive
              ? 'text-indigo-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label={`Leads B2B (${leadsCount} disponíveis)`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'b2b_leads' && !isHighTicketActive 
              ? 'bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/50' 
              : ''
          }`}>
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-1 leading-tight tracking-tight">Leads B2B</span>
          {leadsCount > 0 && (
            <span className="absolute top-1 right-2 min-w-[16px] h-4 px-1 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-slate-900 shadow-xs">
              {leadsCount > 99 ? '99+' : leadsCount}
            </span>
          )}
        </button>

        {/* 2. Nova Busca (foco imediato no campo de busca sem rolar) */}
        <button
          type="button"
          onClick={() => {
            if (activeTab !== 'b2b_leads') onSelectTab('b2b_leads');
            if (onOpenSearch) {
              onOpenSearch();
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              const inputEl = document.getElementById('search-keyword-input');
              if (inputEl) {
                inputEl.focus();
              }
            }
          }}
          className="flex flex-col items-center justify-center min-h-[52px] py-1 px-1 rounded-xl transition-all text-slate-400 hover:text-slate-200"
          aria-label="Nova Busca de Leads"
        >
          <div className="p-1.5 rounded-xl transition-all hover:bg-slate-800">
            <Search className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-1 leading-tight tracking-tight">Buscar</span>
        </button>

        {/* 3. Filtro Rápido High-Ticket (€599-€997) */}
        <button
          type="button"
          onClick={() => {
            if (onToggleHighTicket) {
              onToggleHighTicket();
              if (activeTab !== 'b2b_leads') onSelectTab('b2b_leads');
            } else {
              onSelectTab('b2b_leads');
            }
          }}
          className={`flex flex-col items-center justify-center min-h-[52px] py-1 px-1 rounded-xl transition-all relative ${
            isHighTicketActive
              ? 'text-emerald-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Filtrar Apenas Leads de Alto Ticket"
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            isHighTicketActive 
              ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/60 shadow-xs' 
              : ''
          }`}>
            <Sparkles className={`w-5 h-5 ${isHighTicketActive ? 'text-amber-300' : 'text-slate-400'}`} />
          </div>
          <span className="text-[10px] font-bold mt-1 leading-tight tracking-tight">High-Ticket</span>
          {isHighTicketActive && (
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-slate-950" />
          )}
        </button>

        {/* 4. Copilot IA */}
        <button
          type="button"
          onClick={() => onSelectTab('copilot_chat')}
          className={`flex flex-col items-center justify-center min-h-[52px] py-1 px-1 rounded-xl transition-all ${
            activeTab === 'copilot_chat'
              ? 'text-purple-400 font-extrabold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Assistente IA Copilot"
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeTab === 'copilot_chat' 
              ? 'bg-purple-600/30 text-purple-300 ring-1 ring-purple-500/50' 
              : ''
          }`}>
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <span className="text-[10px] font-bold mt-1 leading-tight tracking-tight">Copilot IA</span>
        </button>

        {/* 5. Menu Completo (Todas as Ferramentas, APIs, Métricas e Admin) */}
        <button
          type="button"
          onClick={() => {
            if (onOpenMobileMenu) {
              onOpenMobileMenu();
            }
          }}
          className="flex flex-col items-center justify-center min-h-[52px] py-1 px-1 rounded-xl transition-all text-slate-400 hover:text-slate-200"
          aria-label="Menu Completo e Ferramentas"
        >
          <div className="p-1.5 rounded-xl transition-all hover:bg-slate-800">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold mt-1 leading-tight tracking-tight">Menu</span>
        </button>

      </div>
    </nav>
  );
};

export default AppBottomNav;
