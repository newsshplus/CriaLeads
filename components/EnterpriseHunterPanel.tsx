import React, { useState } from 'react';
import { Lead } from '../types';
import { EnterpriseHunterCard } from './EnterpriseHunterCard';
import { Trash2, MapPin, Calendar, LayoutGrid, RotateCcw, Sparkles, Filter, Building, CheckCircle2 } from 'lucide-react';

interface EnterpriseHunterPanelProps {
  leads?: Lead[];
  onStartCall?: (lead: Lead) => void;
  onSendWhatsAppBot?: (lead: Lead) => void;
  onSendEmail?: (lead: Lead) => void;
  onOpenCriahubDrawer?: (lead: Lead) => void;
  onOpenNotes?: (lead: Lead) => void;
}

export const EnterpriseHunterPanel: React.FC<EnterpriseHunterPanelProps> = ({
  leads = [],
  onStartCall,
  onSendWhatsAppBot,
  onSendEmail,
  onOpenCriahubDrawer,
  onOpenNotes
}) => {
  // Estado para armazenar os cards ativos na tela principal
  const [activeLeads, setActiveLeads] = useState<Lead[]>(leads);
  // Estado para o histórico arquivado (Aba de Localização e Postagem)
  const [archivedLeads, setArchivedLeads] = useState<Lead[]>([]);
  // Controle da Aba Ativa
  const [currentTab, setCurrentTab] = useState<'main' | 'location' | 'posting'>('main');

  // Atualiza activeLeads quando novos leads chegam da busca
  React.useEffect(() => {
    if (leads && leads.length > 0) {
      setActiveLeads(leads);
    }
  }, [leads]);

  // Função macro para limpar os cards da tela principal e guardá-los nas abas de arquivo
  const handleClearCurrentCards = () => {
    if (activeLeads.length === 0) return;
    
    // Alimenta o histórico com os cards limpados
    setArchivedLeads((prev) => [...prev, ...activeLeads]);
    // Esvazia a tela principal de busca ativa
    setActiveLeads([]);
  };

  // Restaurar todos do arquivo para a tela principal
  const handleRestoreArchived = () => {
    if (archivedLeads.length === 0) return;
    setActiveLeads((prev) => [...prev, ...archivedLeads]);
    setArchivedLeads([]);
    setCurrentTab('main');
  };

  // Filtros internos para as abas de arquivo
  const leadsPorLocalizacao = [...archivedLeads].sort((a, b) => (a.city || '').localeCompare(b.city || ''));
  const leadsPorPostagem = [...archivedLeads].sort((a, b) => (b.daysOnMarket || 0) - (a.daysOnMarket || 0));

  return (
    <div className="w-full bg-slate-950 min-h-[600px] p-4 sm:p-6 text-slate-100 rounded-2xl border border-slate-800">
      
      {/* Barra de Navegação de Abas e Controle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-800/90 pb-4 mb-6 gap-4">
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setCurrentTab('main')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              currentTab === 'main' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/50' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Novas Descobertas ({activeLeads.length})
          </button>
          
          <button
            onClick={() => setCurrentTab('location')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              currentTab === 'location' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/50' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            Histórico: Localização ({leadsPorLocalizacao.length})
          </button>

          <button
            onClick={() => setCurrentTab('posting')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              currentTab === 'posting' 
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-950/50' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Histórico: Postagem ({leadsPorPostagem.length})
          </button>
        </div>

        {/* Botão de Ação Crítica: Limpeza e Arquivamento / Restauração */}
        <div className="flex items-center gap-2">
          {currentTab === 'main' && activeLeads.length > 0 && (
            <button
              onClick={handleClearCurrentCards}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/50 text-rose-400 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg active:scale-95"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Limpar Painel Atual (Arquivar)</span>
            </button>
          )}

          {(currentTab === 'location' || currentTab === 'posting') && archivedLeads.length > 0 && (
            <button
              onClick={handleRestoreArchived}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-indigo-400" />
              <span>Restaurar para Novas Descobertas</span>
            </button>
          )}
        </div>
      </div>

      {/* Renderização condicional baseada na aba selecionada */}
      <div className="grid grid-cols-1 gap-4">
        {currentTab === 'main' && (
          activeLeads.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6">
              <Building className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">Nenhum card ativo na tela principal.</p>
              <p className="text-xs text-slate-500 mt-1">Inicie uma nova busca real blindada ou restaure os leads do histórico.</p>
              {archivedLeads.length > 0 && (
                <button
                  onClick={handleRestoreArchived}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar {archivedLeads.length} leads do Histórico
                </button>
              )}
            </div>
          ) : (
            activeLeads.map((lead) => (
              <EnterpriseHunterCard 
                key={lead.id} 
                lead={lead} 
                onStartCall={onStartCall} 
                onSendWhatsAppBot={onSendWhatsAppBot} 
                onSendEmail={onSendEmail}
                onOpenCriahubDrawer={onOpenCriahubDrawer}
                onOpenNotes={onOpenNotes}
              />
            ))
          )
        )}

        {currentTab === 'location' && (
          leadsPorLocalizacao.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 border border-slate-800/80 rounded-2xl">
              <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Aba de histórico por localização vazia.</p>
            </div>
          ) : (
            leadsPorLocalizacao.map((lead) => (
              <div key={lead.id} className="opacity-80 hover:opacity-100 transition-opacity">
                <EnterpriseHunterCard 
                  lead={lead} 
                  onStartCall={onStartCall} 
                  onSendWhatsAppBot={onSendWhatsAppBot} 
                  onSendEmail={onSendEmail}
                  onOpenCriahubDrawer={onOpenCriahubDrawer}
                  onOpenNotes={onOpenNotes}
                />
              </div>
            ))
          )
        )}

        {currentTab === 'posting' && (
          leadsPorPostagem.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/30 border border-slate-800/80 rounded-2xl">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Aba de histórico ordenado por tempo de postagem vazia.</p>
            </div>
          ) : (
            leadsPorPostagem.map((lead) => (
              <div key={lead.id} className="opacity-80 hover:opacity-100 transition-opacity">
                <EnterpriseHunterCard 
                  lead={lead} 
                  onStartCall={onStartCall} 
                  onSendWhatsAppBot={onSendWhatsAppBot} 
                  onSendEmail={onSendEmail}
                  onOpenCriahubDrawer={onOpenCriahubDrawer}
                  onOpenNotes={onOpenNotes}
                />
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
