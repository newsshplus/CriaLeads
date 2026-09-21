import React from 'react';
import { 
  AlertTriangle, Clock, ShieldAlert, Lock, User, 
  Building2, ArrowRight, RefreshCw, Sparkles, CheckCircle2, X 
} from 'lucide-react';
import { UserAccount, UserQuotaUsage, AllowedModulesType } from '../../types/authAndQuotaTypes';

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  usage: UserQuotaUsage;
  moduleAttempted?: 'b2b' | 'real_estate';
  reason?: string;
  onOpenAdminPanel?: () => void;
  onSwitchUser?: () => void;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  isOpen,
  onClose,
  user,
  usage,
  moduleAttempted,
  reason,
  onOpenAdminPanel,
  onSwitchUser
}) => {
  if (!isOpen) return null;

  const isModuleBlocked = reason && reason.includes('módulo');
  const periodLabel = usage.period === 'daily' ? 'Diária' : usage.period === 'weekly' ? 'Semanal' : 'Mensal';
  const resetTerm = usage.period === 'daily' ? 'o próximo dia' : usage.period === 'weekly' ? 'a próxima semana' : 'o próximo mês';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden">
        {/* Faixa superior de alerta */}
        <div className={`p-6 ${isModuleBlocked ? 'bg-gradient-to-r from-red-950/70 via-slate-900 to-red-950/70 border-b border-red-500/30' : 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-b border-amber-500/30'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isModuleBlocked ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'}`}>
                {isModuleBlocked ? <Lock className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
              </div>
              <div>
                <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isModuleBlocked ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                  {isModuleBlocked ? 'Módulo Restrito' : `Limite de Cota ${periodLabel} Atingido`}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  {isModuleBlocked ? 'Acesso Não Autorizado' : 'Pesquisas Temporariamente Travadas'}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5">
          {/* Mensagem Principal */}
          <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-xl">
            <p className="text-slate-200 text-sm leading-relaxed">
              {reason || `Você utilizou 100% da sua cota de ${usage.searchesLimit} buscas para este período. Por favor, aguarde ${resetTerm} para realizar novas prospecções.`}
            </p>
          </div>

          {/* Cards de Métricas de Consumo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400 font-medium">Buscas Realizadas</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">
                {usage.searchesPerformed} <span className="text-xs font-normal text-slate-400">/ {usage.searchesLimit} max</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full w-full" />
              </div>
            </div>

            <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl">
              <div className="text-xs text-slate-400 font-medium">Resultados Coletados</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {usage.resultsGathered} <span className="text-xs font-normal text-slate-400">/ {usage.resultsLimit} max</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full" 
                  style={{ width: `${Math.min(100, (usage.resultsGathered / usage.resultsLimit) * 100)}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Temporizador de Reset */}
          {!isModuleBlocked && (
            <div className="p-4 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs text-indigo-300 font-medium">Tempo Restante para Renovação:</div>
                  <div className="text-sm font-semibold text-white mt-0.5">
                    {usage.formattedTimeUntilReset}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Próximo reset: {usage.nextResetDate}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Dados do Usuário & Empresa */}
          <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>{user.name}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Building2 className="w-4 h-4" />
              <span>{user.companyName}</span>
            </div>
          </div>
        </div>

        {/* Rodapé / Ações */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          {onSwitchUser && (
            <button
              onClick={() => {
                onClose();
                onSwitchUser();
              }}
              className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Trocar de Usuário / Login
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {onOpenAdminPanel && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="px-4 py-2 text-xs font-semibold text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 rounded-xl transition-all shadow-sm"
              >
                Ver Relatórios & Gestão
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-colors shadow-lg shadow-amber-900/20"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default QuotaExceededModal;
