import React, { useState } from 'react';
import { ScrapingEngineStatus } from '../types';
import { ShieldCheck, Activity, Cpu, Database, ChevronDown, ChevronUp, Layers, CheckCircle2, Zap, Sliders } from 'lucide-react';

interface ScrapingPipelineBannerProps {
  status: ScrapingEngineStatus;
  onOpenSettings?: () => void;
}

const ScrapingPipelineBanner: React.FC<ScrapingPipelineBannerProps> = ({ status, onOpenSettings }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs">
        
        {/* Left: Active Pipeline Indicator */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Pipeline de Dados Reais Anti-Alucinação</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 text-slate-300">
            <span className="text-slate-500">Motor Ativo:</span>
            <strong className="text-indigo-300 font-mono">{status.activeEngine}</strong>
          </div>
        </div>

        {/* Center: Realtime Stats & Actions */}
        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Latência: <strong>{status.lastLatencyMs}ms</strong></span>
          </div>

          <div className="flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Extraídos: <strong>{status.extractedCount} leads</strong></span>
          </div>

          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1 text-emerald-300 hover:text-emerald-200 bg-emerald-950/60 hover:bg-emerald-900/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 transition-colors font-sans font-bold"
            >
              <Sliders className="w-3 h-3" />
              <span>APIs & Prompts</span>
            </button>
          )}

          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-lg transition-colors font-sans"
          >
            <span>Arquitetura</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

      </div>

      {/* Expanded Redundancy Hierarchy Drawer */}
      {isExpanded && (
        <div className="max-w-7xl mx-auto mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-fade-in font-sans">
          
          {/* Level 1: Primary */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-emerald-500/30 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <span className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center text-[10px]">1</span>
                <span>FONTE REAL 1 (Google Maps / LetScrape)</span>
              </div>
              <p className="text-[11px] text-slate-300">LetScrape RapidAPI • Pool de 3 chaves com rotação automática para contornar rate-limit.</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              ATIVO
            </span>
          </div>

          {/* Level 2: Secondary */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <span className="w-4 h-4 rounded bg-amber-600 text-white flex items-center justify-center text-[10px]">2</span>
                <span>FONTE REAL 2 (OpenStreetMap Overpass)</span>
              </div>
              <p className="text-[11px] text-slate-300">Busca geoespacial sem custo de empresas reais, sites e telefones cadastrados.</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              FALLBACK
            </span>
          </div>

          {/* Level 3: Tertiary */}
          <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-purple-300">
                <span className="w-4 h-4 rounded bg-purple-600 text-white flex items-center justify-center text-[10px]">3</span>
                <span>ENRIQUECIMENTO + SUPERVISOR IA</span>
              </div>
              <p className="text-[11px] text-slate-300">IA Groq (Llama 3.3 70B) / Gemini + Supervisor de Veracidade (Reliability Score 0-100%).</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              PRONTO
            </span>
          </div>

        </div>
      )}
    </div>
  );
};

export default ScrapingPipelineBanner;
