import React from 'react';
import { 
  BarChart3, TrendingUp, Flame, Zap, Building2, 
  MapPin, Phone, Mail, Globe, ShieldCheck, Download,
  Users, CheckCircle2, PieChart as PieChartIcon
} from 'lucide-react';
import { DashboardStats, Lead } from '../types';
import { formatCurrencyValue, getCurrencyConfig } from '../services/countryService';

interface AnalyticsDashboardViewProps {
  stats: DashboardStats;
  leads: Lead[];
  country: string;
  onExportCsv: () => void;
}

export const AnalyticsDashboardView: React.FC<AnalyticsDashboardViewProps> = ({
  stats,
  leads,
  country,
  onExportCsv
}) => {
  const currencyConfig = getCurrencyConfig(country);

  // Calcula estatísticas por nicho
  const categoryMap: { [key: string]: number } = {};
  leads.forEach(l => {
    const cat = l.category || 'Geral';
    categoryMap[cat] = (categoryMap[cat] || 0) + 1;
  });
  const topCategories = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner de Métricas */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Dashboard de Inteligência & Pipeline
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
            Visão consolidada de oportunidades de alto ticket, maturidade digital das empresas e potencial estimado de receita.
          </p>
        </div>

        <button
          onClick={onExportCsv}
          disabled={leads.length === 0}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 shrink-0 disabled:opacity-40"
        >
          <Download className="w-4 h-4" />
          <span>Exportar Relatório Completo CSV</span>
        </button>
      </div>

      {/* Grid de Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Leads</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-white">{stats.totalLeads}</span>
            <span className="text-xs text-slate-400">empresas</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-4 h-4 fill-emerald-500 text-emerald-500" />
            Score A (Hot)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-emerald-400">{stats.scoreACount}</span>
            <span className="text-xs text-emerald-300 font-bold">
              ({stats.totalLeads > 0 ? Math.round((stats.scoreACount / stats.totalLeads) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
            Score B (Warm)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-400">{stats.scoreBCount}</span>
            <span className="text-xs text-amber-300 font-bold">
              ({stats.totalLeads > 0 ? Math.round((stats.scoreBCount / stats.totalLeads) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Pipeline Estimado</span>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-400">
              {stats.estimatedPipelineValue}
            </span>
          </div>
        </div>
      </div>

      {/* Métricas Operacionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            Canais de Contato Mapeados
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl">
              <span className="text-slate-300">Com WhatsApp / Telefone Direto:</span>
              <span className="font-bold text-emerald-400">{stats.leadsWithPhone} ({stats.totalLeads > 0 ? Math.round((stats.leadsWithPhone / stats.totalLeads) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl">
              <span className="text-slate-300">Com E-mail Direto / Corporativo:</span>
              <span className="font-bold text-blue-400">{stats.leadsWithEmail} ({stats.totalLeads > 0 ? Math.round((stats.leadsWithEmail / stats.totalLeads) * 100) : 0}%)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl">
              <span className="text-slate-300">Com Website Ativo:</span>
              <span className="font-bold text-purple-400">{stats.leadsWithWebsite}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            Origem dos Dados & Motores
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl">
              <span className="text-slate-300">Google Maps Scraping:</span>
              <span className="font-bold text-emerald-400">{stats.googleMapsCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl">
              <span className="text-slate-300">Apollo.io & LinkedIn OSINT:</span>
              <span className="font-bold text-purple-400">{stats.apolloCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/80 rounded-xl">
              <span className="text-slate-300">IA Autônoma Fallback:</span>
              <span className="font-bold text-amber-400">{stats.syntheticCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            Top Nichos no Lote Atual
          </h3>
          <div className="space-y-2 text-xs">
            {topCategories.length > 0 ? (
              topCategories.map(([cat, count], idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-950/80 rounded-lg">
                  <span className="text-slate-300 truncate max-w-[170px]">{cat}</span>
                  <span className="font-bold text-indigo-400">{count} leads</span>
                </div>
              ))
            ) : (
              <div className="text-slate-500 py-4 text-center">Nenhum nicho processado ainda</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
