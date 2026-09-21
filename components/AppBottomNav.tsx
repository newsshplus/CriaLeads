import React from 'react';
import { 
  Sparkles, Building2, Home, BarChart3, Wrench, 
  Layers, Download, Key, ShieldCheck, User
} from 'lucide-react';

export type MainNavTab = 'copilot_chat' | 'b2b_leads' | 'real_estate' | 'analytics';

interface AppBottomNavProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  leadsCount: number;
  realEstateCount: number;
  onOpenTools: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  userRole?: string;
}

export const AppBottomNav: React.FC<AppBottomNavProps> = ({
  activeTab,
  onSelectTab,
  leadsCount,
  realEstateCount,
  onOpenTools,
  onOpenSettings,
  onOpenAdmin,
  userRole
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-2 py-1.5 shadow-2xl safe-area-inset-bottom">
      <div className="flex items-center justify-around">
        {/* 1. Copilot IA Chat */}
        <button
          onClick={() => onSelectTab('copilot_chat')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[58px] ${
            activeTab === 'copilot_chat'
              ? 'text-indigo-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'copilot_chat' ? 'bg-indigo-600/30 ring-1 ring-indigo-500/50' : ''}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Copilot IA</span>
        </button>

        {/* 2. Leads B2B */}
        <button
          onClick={() => onSelectTab('b2b_leads')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[58px] relative ${
            activeTab === 'b2b_leads'
              ? 'text-indigo-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'b2b_leads' ? 'bg-indigo-600/30 ring-1 ring-indigo-500/50' : ''}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Leads B2B</span>
          {leadsCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 bg-indigo-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-slate-900">
              {leadsCount > 99 ? '99+' : leadsCount}
            </span>
          )}
        </button>

        {/* 3. Imóveis FSBO */}
        <button
          onClick={() => onSelectTab('real_estate')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[58px] relative ${
            activeTab === 'real_estate'
              ? 'text-amber-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'real_estate' ? 'bg-amber-600/30 ring-1 ring-amber-500/50' : ''}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Imóveis</span>
          {realEstateCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 bg-amber-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border border-slate-900">
              {realEstateCount > 99 ? '99+' : realEstateCount}
            </span>
          )}
        </button>

        {/* 4. Métricas / Analytics */}
        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all min-w-[58px] ${
            activeTab === 'analytics'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-emerald-600/30 ring-1 ring-emerald-500/50' : ''}`}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Métricas</span>
        </button>

        {/* 5. Ferramentas / Admin */}
        <button
          onClick={onOpenTools}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all min-w-[58px]"
        >
          <div className="p-1 rounded-xl hover:bg-slate-800">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 leading-none">Opções</span>
        </button>
      </div>
    </nav>
  );
};
