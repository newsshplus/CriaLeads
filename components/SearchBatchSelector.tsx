import React, { useState, useMemo } from 'react';
import { 
  FolderArchive, Calendar, MapPin, Globe2, Sparkles, 
  Trash2, Download, Layers, CheckCircle2, ChevronRight, 
  Flame, Zap, Search, Plus, Filter, Clock, Eye, AlertCircle
} from 'lucide-react';
import { SearchBatch, Lead } from '../types';

interface SearchBatchSelectorProps {
  batches: SearchBatch[];
  activeBatchId: string | null; // null = 'all' (Master consolidated view)
  onSelectBatch: (batchId: string | null) => void;
  onDeleteBatch: (batchId: string) => void;
  onClearAllBatches: () => void;
  onExportBatchCSV: (batch: SearchBatch) => void;
  onNewSearchClick: () => void;
  isSimpleView?: boolean;
}

export const SearchBatchSelector: React.FC<SearchBatchSelectorProps> = ({
  batches,
  activeBatchId,
  onSelectBatch,
  onDeleteBatch,
  onClearAllBatches,
  onExportBatchCSV,
  onNewSearchClick,
  isSimpleView = false
}) => {
  const [filterCountry, setFilterCountry] = useState<string>('ALL');
  const [filterCity, setFilterCity] = useState<string>('ALL');
  const [filterNiche, setFilterNiche] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('ALL');
  const [isExpanded, setIsExpanded] = useState<boolean>(!isSimpleView);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState<boolean>(false);

  // Extração de opções únicas para filtros
  const uniqueCountries = useMemo(() => {
    const set = new Set<string>();
    batches.forEach(b => { if (b.country) set.add(b.country); });
    return Array.from(set);
  }, [batches]);

  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    batches.forEach(b => { if (b.city) set.add(b.city); });
    return Array.from(set);
  }, [batches]);

  const uniqueNiches = useMemo(() => {
    const set = new Set<string>();
    batches.forEach(b => { 
      const n = b.niche || b.keyword || 'Geral';
      set.add(n); 
    });
    return Array.from(set);
  }, [batches]);

  // Filtragem dos lotes
  const filteredBatches = useMemo(() => {
    return batches.filter(batch => {
      if (filterCountry !== 'ALL' && batch.country !== filterCountry) return false;
      if (filterCity !== 'ALL' && batch.city !== filterCity) return false;
      if (filterNiche !== 'ALL') {
        const n = batch.niche || batch.keyword || 'Geral';
        if (n !== filterNiche) return false;
      }
      if (filterDate !== 'ALL') {
        const batchTime = new Date(batch.timestamp).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (filterDate === 'TODAY' && now - batchTime > oneDay) return false;
        if (filterDate === 'WEEK' && now - batchTime > 7 * oneDay) return false;
      }
      return true;
    });
  }, [batches, filterCountry, filterCity, filterNiche, filterDate]);

  if (batches.length === 0) {
    return null;
  }

  const activeBatch = batches.find(b => b.id === activeBatchId);
  const totalLeadsInAllBatches = batches.reduce((acc, b) => acc + (b.leadCount || b.leads.length), 0);

  const getCountryFlag = (code?: string) => {
    if (!code) return '🌐';
    if (code.toUpperCase() === 'PT') return '🇵🇹';
    if (code.toUpperCase() === 'BR') return '🇧🇷';
    return '🌐';
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center text-indigo-600 shrink-0">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-slate-900">
                Lotes de Prospecção Armazenados
              </h3>
              <span className="text-[11px] font-bold bg-indigo-100/70 text-indigo-800 px-2 py-0.5 rounded-full">
                {batches.length} {batches.length === 1 ? 'pesquisa salva' : 'pesquisas salvas'}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                ({totalLeadsInAllBatches} leads no total)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada pesquisa é guardada separadamente com data, nicho, cidade e país sem misturar novos com antigos.
            </p>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onNewSearchClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-indigo-600/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nova Pesquisa / Lote</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearAllConfirm(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-lg text-xs font-bold transition-all"
            title="Limpar todos os dados e lotes salvos para enviar o link com a ferramenta limpa"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Limpar Dados Ativos</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all"
          >
            {isExpanded ? 'Recolher Lotes' : 'Expandir Lotes'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Quick Filters Row (Data, Nicho, Cidade, País) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 text-xs">
            {/* Filter by Country */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
                <Globe2 className="w-3 h-3 text-slate-400" />
                País:
              </label>
              <select
                value={filterCountry}
                onChange={e => setFilterCountry(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Todos os Países</option>
                {uniqueCountries.map(c => (
                  <option key={c} value={c}>
                    {getCountryFlag(c)} {c === 'PT' ? 'Portugal' : c === 'BR' ? 'Brasil' : c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by City */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" />
                Cidade:
              </label>
              <select
                value={filterCity}
                onChange={e => setFilterCity(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Todas as Cidades</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Filter by Niche */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-slate-400" />
                Nicho / Termo:
              </label>
              <select
                value={filterNiche}
                onChange={e => setFilterNiche(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Todos os Nichos</option>
                {uniqueNiches.map(niche => (
                  <option key={niche} value={niche}>{niche}</option>
                ))}
              </select>
            </div>

            {/* Filter by Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 block mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                Data:
              </label>
              <select
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Todas as Datas</option>
                <option value="TODAY">Hoje (Últimas 24h)</option>
                <option value="WEEK">Últimos 7 dias</option>
              </select>
            </div>
          </div>

          {/* Master View vs Batches List */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {/* All Consolidated Leads Button */}
            <button
              type="button"
              onClick={() => onSelectBatch(null)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeBatchId === null
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Visão Consolidada (Todos os {totalLeadsInAllBatches} Leads)</span>
            </button>

            {/* Individual Batch Buttons/Pills */}
            {filteredBatches.map((batch) => {
              const isSelected = activeBatchId === batch.id;
              const flag = getCountryFlag(batch.country);
              const scoreACnt = batch.scoreACount || batch.leads.filter(l => l.icpTier === 'SCORE_A').length;

              return (
                <div
                  key={batch.id}
                  className={`shrink-0 flex items-center rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-400 text-indigo-950 shadow-sm ring-1 ring-indigo-400'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50/80'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectBatch(batch.id)}
                    className="flex items-center gap-2 px-3 py-2 text-left text-xs"
                  >
                    <span className="text-sm">{flag}</span>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="truncate max-w-[140px] sm:max-w-[180px]">
                          {batch.niche || batch.keyword || 'Prospecção'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          • {batch.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" />
                          {batch.formattedDate}
                        </span>
                        <span className="font-bold text-indigo-600">
                          {batch.leadCount || batch.leads.length} leads
                        </span>
                        {scoreACnt > 0 && (
                          <span className="flex items-center text-emerald-600 font-bold">
                            <Flame className="w-2.5 h-2.5 fill-emerald-500 text-emerald-600 mr-0.5" />
                            {scoreACnt} Hot
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Batch Action Buttons (CSV & Delete) */}
                  <div className="flex items-center pr-2 pl-1 border-l border-slate-200/60 gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportBatchCSV(batch);
                      }}
                      title="Exportar CSV deste lote"
                      className="p-1 hover:bg-indigo-100 rounded text-slate-500 hover:text-indigo-700 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setBatchToDelete(batch.id);
                      }}
                      title="Excluir este lote de pesquisa"
                      className="p-1 hover:bg-rose-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Batch Summary Banner (When an individual batch is selected) */}
          {activeBatch && (
            <div className="bg-indigo-50/60 border border-indigo-200/70 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {getCountryFlag(activeBatch.country)}
                </div>
                <div>
                  <div className="font-extrabold text-indigo-950 flex items-center gap-2">
                    <span>Lote Ativo: {activeBatch.niche || activeBatch.keyword || 'Prospecção'} em {activeBatch.city}, {activeBatch.countryName}</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {activeBatch.leadCount || activeBatch.leads.length} Leads Isolados
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-3 flex-wrap">
                    <span>📅 Executado em: <strong>{activeBatch.formattedDate}</strong></span>
                    <span>📍 Local: <strong>{activeBatch.city} ({activeBatch.country})</strong></span>
                    <span>🎯 Nicho: <strong>{activeBatch.niche}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onExportBatchCSV(activeBatch)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-lg font-bold transition-all shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV do Lote
                </button>
                <button
                  type="button"
                  onClick={() => setBatchToDelete(activeBatch.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 rounded-lg font-bold transition-all shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Lote
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Confirmação de Exclusão de Lote */}
      {batchToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Excluir Lote de Pesquisa?</h4>
                <p className="text-xs text-slate-500">Essa ação removerá os leads deste lote específico.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBatchToDelete(null)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteBatch(batchToDelete);
                  setBatchToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Sim, Excluir Lote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Limpar TODOS os Dados Ativos Salvos */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Zerar Todos os Dados Ativos Salvos?</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Essa ação removerá todos os lotes de pesquisa, leads em cache e histórico de prospecção da tela e do armazenamento local.
                </p>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2 text-[11px] text-amber-800">
                  💡 <strong>Perfeito antes de compartilhar ou enviar o link:</strong> o sistema ficará completamente limpo e pronto para um novo usuário ou cliente.
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAllBatches();
                  setShowClearAllConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Sim, Limpar Todos os Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
