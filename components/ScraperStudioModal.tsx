import React, { useState } from 'react';
import { 
  X, Terminal, Copy, Check, Download, Play, Shield, Globe, 
  Cpu, Layers, Code, RefreshCw, Sparkles, ExternalLink, Sliders, Database, Search,
  CheckCircle2, FileCode, PlayCircle, FolderDown, FileSpreadsheet, Lock, AlertCircle
} from 'lucide-react';
import { 
  generateUnifiedPipelinePythonScript, 
  generatePuppeteerNodeScript, 
  generateRfbDadosAbertosDownloaderScript,
  generateRfbPandasProcessorScript,
  COUNTRY_PRIVACY_FISCAL_GUIDE,
  ScraperScriptConfig 
} from '../services/scraperRobotService';

interface ScraperStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultKeyword?: string;
  defaultCity?: string;
  defaultCountry?: string;
}

export const ScraperStudioModal: React.FC<ScraperStudioModalProps> = ({
  isOpen,
  onClose,
  defaultKeyword = 'Restaurantes',
  defaultCity = 'Lisboa',
  defaultCountry = 'Portugal'
}) => {
  const [activeTab, setActiveTab] = useState<'full_python' | 'rfb_dados_abertos' | 'module_maps' | 'module_matching' | 'module_fiscal' | 'simulator' | 'node'>('full_python');
  const [rfbSubTab, setRfbSubTab] = useState<'privacy_guide' | 'downloader_script' | 'pandas_script'>('privacy_guide');
  const [query, setQuery] = useState(defaultKeyword);
  const [city, setCity] = useState(defaultCity);
  const [country, setCountry] = useState(defaultCountry);
  const [maxResults, setMaxResults] = useState(10);
  const [copied, setCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedOutput, setSimulatedOutput] = useState<string | null>(null);

  if (!isOpen) return null;

  const config: ScraperScriptConfig = {
    query,
    city,
    country,
    maxResults,
    useProxies: true,
    extractPhotos: true,
    extractSocials: true
  };

  const pythonScript = generateUnifiedPipelinePythonScript(config);
  const nodeScript = generatePuppeteerNodeScript(config);
  const rfbDownloaderScript = generateRfbDadosAbertosDownloaderScript();
  const rfbPandasScript = generateRfbPandasProcessorScript();

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRunSimulator = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const isPt = country.toLowerCase().includes('portugal') || city.toLowerCase().includes('lisboa');
      const isEs = country.toLowerCase().includes('espan');
      
      const sample = [
        {
          "company_name": `${query} Solar de ${city}`,
          "website": `https://www.${query.toLowerCase().replace(/[^a-z0-9]/g, '')}-${city.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          "apollo_id": "ap_98214",
          "apollo_contacts": [
            {
              "name": "Pedro Miguel Santos",
              "title": "Sócio-Gerente / Diretor",
              "email": `pedro@${query.toLowerCase().replace(/[^a-z0-9]/g, '')}-${city.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
              "phone": isPt ? "+351 912 345 678" : isEs ? "+34 912 345 678" : "+55 11 98765-4321"
            }
          ],
          "google_maps": {
            "rating": "4.8 ★★★★★",
            "reviews_count": "482 avaliações",
            "address": isPt ? `Rua das Flores 120, ${city}, Portugal` : isEs ? `Calle Mayor 45, ${city}, España` : `Av. Paulista 1000, ${city}, Brasil`,
            "phone": isPt ? "+351 21 345 6789" : isEs ? "+34 91 345 6789" : "+55 11 3245-6789",
            "photos": [
              "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&h=800&q=80",
              "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&h=800&q=80"
            ],
            "social_media": {
              "instagram": `https://instagram.com/${query.toLowerCase().replace(/[^a-z0-9]/g, '')}_${city.toLowerCase()}`,
              "facebook": `https://facebook.com/${query.toLowerCase().replace(/[^a-z0-9]/g, '')}.${city.toLowerCase()}`,
              "linkedin": `https://linkedin.com/company/${query.toLowerCase().replace(/[^a-z0-9]/g, '')}-${city.toLowerCase()}`
            }
          },
          "matching_diagnostics": {
            "matched_by": "CLEAN_DOMAIN_EXACT",
            "confidence_score": 98,
            "fuzzy_name_similarity": 0.94
          },
          "fiscal_data": isPt ? {
            "country": "PT",
            "tax_id": "509123456",
            "legal_name": `${query.toUpperCase()} SOLAR DE ${city.toUpperCase()} SOCIEDADE UNIPESSOAL LDA`,
            "cae_activity": "56101 - Restaurantes tipo tradicional",
            "status": "Activa",
            "source": "NIF.pt / Racius"
          } : isEs ? {
            "country": "ES",
            "tax_id": "B84920192",
            "legal_name": `${query.toUpperCase()} ${city.toUpperCase()} SL`,
            "province": city,
            "status": "Activa",
            "source": "BORME / Informa.es"
          } : {
            "country": "BR",
            "tax_id": "34.567.890/0001-23",
            "legal_name": `${query.toUpperCase()} DE ${city.toUpperCase()} SERVICOS LTDA`,
            "trade_name": `${query} Solar ${city}`,
            "status": "ATIVA",
            "capital_social": "R$ 180.000,00",
            "partners": ["Pedro Miguel Santos (Sócio-Administrador)", "Mariana Costa (Sócio)"],
            "cnae_main": "56.11-2-01 - Restaurantes e similares",
            "source": "publica.cnpj.ws / Receita Federal"
          }
        }
      ];

      setSimulatedOutput(JSON.stringify(sample, null, 2));
      setIsSimulating(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  Python Playwright Scraper Studio & Matching Engine
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Sem API Paga
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Playwright + BeautifulSoup4 + Difflib + Dados Abertos RFB / CNPJ (Brasil) / NIF (Portugal) / CIF (Espanha)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Parameter Bar */}
        <div className="px-6 py-3 bg-slate-850 border-b border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2.5 shrink-0 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nicho / Busca</label>
            <input 
              type="text" 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ex: Restaurantes, Clínicas"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cidade</label>
            <input 
              type="text" 
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ex: Lisboa, São Paulo"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">País</label>
            <input 
              type="text" 
              value={country}
              onChange={e => setCountry(e.target.value)}
              placeholder="Ex: Portugal, Brasil, Espanha"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Limite de Resultados</label>
            <input 
              type="number" 
              value={maxResults}
              onChange={e => setMaxResults(Number(e.target.value))}
              min={3}
              max={100}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 border-b border-slate-800 bg-slate-900 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('full_python')}
            className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'full_python'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Pipeline Completo Python (.py)</span>
          </button>

          <button
            onClick={() => setActiveTab('rfb_dados_abertos')}
            className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'rfb_dados_abertos'
                ? 'border-teal-500 text-teal-300 bg-teal-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderDown className="w-4 h-4 text-teal-400" />
            <span className="flex items-center gap-1.5">
              <span>Dados Abertos RFB (Brasil) &amp; GDPR / LGPD</span>
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('module_maps')}
            className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'module_maps'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4 text-indigo-400" />
            <span>1. GoogleMapsScraper &amp; Redes</span>
          </button>

          <button
            onClick={() => setActiveTab('module_matching')}
            className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'module_matching'
                ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>2. Difflib Cross-Match</span>
          </button>

          <button
            onClick={() => setActiveTab('module_fiscal')}
            className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'module_fiscal'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4 text-cyan-400" />
            <span>3. PublicFiscalScraper (BR/PT/ES)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('simulator');
              if (!simulatedOutput) handleRunSimulator();
            }}
            className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'border-violet-500 text-violet-300 bg-violet-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlayCircle className="w-4 h-4 text-violet-400" />
            <span>4. Simulador &amp; Teste JSON</span>
          </button>

          <button
            onClick={() => setActiveTab('node')}
            className={`py-3 px-3.5 border-b-2 font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'node'
                ? 'border-sky-500 text-sky-300 bg-sky-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4 text-sky-400" />
            <span>Node Puppeteer</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          
          {/* TAB: PIPELINE COMPLETO PYTHON */}
          {activeTab === 'full_python' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-400" />
                    unified_maps_apollo_pipeline.py
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Inclui: Playwright Async + BeautifulSoup4 + Difflib Fuzzy Match + Bases Fiscais BR/PT/ES
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(pythonScript)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload('unified_maps_apollo_pipeline.py', pythonScript)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Script .py</span>
                  </button>
                </div>
              </div>

              {/* Instructions banner */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-mono font-bold">Comando de Instalação:</span>
                  <code className="text-slate-300 bg-slate-900 px-2 py-0.5 rounded font-mono">
                    pip install playwright beautifulsoup4 requests lxml && playwright install chromium
                  </code>
                </div>
                <button
                  onClick={() => handleCopy('pip install playwright beautifulsoup4 requests lxml\nplaywright install chromium\npython unified_maps_apollo_pipeline.py')}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copiar Bash</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
                  {pythonScript}
                </pre>
              </div>
            </div>
          )}

          {/* TAB: DADOS ABERTOS RFB (BRASIL) & GDPR / LGPD */}
          {activeTab === 'rfb_dados_abertos' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Sub navigation inside RFB Tab */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setRfbSubTab('privacy_guide')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    rfbSubTab === 'privacy_guide'
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Situação por País (GDPR x LGPD)</span>
                </button>

                <button
                  onClick={() => setRfbSubTab('downloader_script')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    rfbSubTab === 'downloader_script'
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <FolderDown className="w-3.5 h-3.5" />
                  <span>Script de Download RFB (.py)</span>
                </button>

                <button
                  onClick={() => setRfbSubTab('pandas_script')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    rfbSubTab === 'pandas_script'
                      ? 'bg-teal-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Processamento Pandas &amp; QSA (.py)</span>
                </button>
              </div>

              {/* SUBTAB 1: PRIVACY & LEGAL OVERVIEW */}
              {rfbSubTab === 'privacy_guide' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-teal-400" />
                      <h3 className="text-xs font-extrabold uppercase text-white tracking-wider">
                        Disponibilidade de Bases Públicas &amp; Leis de Privacidade (GDPR vs LGPD)
                      </h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      A disponibilidade de bases públicas gratuitas varia significativamente em função das leis de privacidade de cada país, em especial o <strong>Regulamento Geral sobre a Proteção de Dados (GDPR)</strong> na União Europeia e a <strong>Lei Geral de Proteção de Dados (LGPD)</strong> no Brasil.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {COUNTRY_PRIVACY_FISCAL_GUIDE.map(item => (
                      <div 
                        key={item.code} 
                        className={`p-4 bg-slate-950 border rounded-xl space-y-3 flex flex-col justify-between ${
                          item.code === 'BR' ? 'border-emerald-500/40 bg-emerald-950/10' :
                          item.code === 'PT' ? 'border-amber-500/40 bg-amber-950/10' :
                          'border-sky-500/40 bg-sky-950/10'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-extrabold text-white flex items-center gap-2">
                              <span>{item.flag}</span>
                              <span>{item.country}</span>
                            </span>
                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                              item.code === 'BR' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                              item.code === 'PT' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                              'bg-sky-500/20 text-sky-300 border-sky-500/30'
                            }`}>
                              {item.legislation}
                            </span>
                          </div>

                          <div className="text-xs font-bold text-slate-200">
                            {item.sourceName}
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {item.description}
                          </p>

                          <div className="pt-2 space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Recursos &amp; Dados:</span>
                            {item.features.map((feat, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-300">
                                <CheckCircle2 className="w-3 h-3 text-teal-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                          <a 
                            href={item.sourceUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1"
                          >
                            <span>Portal Oficial</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <a 
                            href={item.rawFilesUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            <span>Arquivos Brutos</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 2: DOWNLOADER SCRIPT (BRASIL) */}
              {rfbSubTab === 'downloader_script' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono text-teal-400 font-bold flex items-center gap-2">
                        <FolderDown className="w-4 h-4 text-teal-400" />
                        download_receita_federal.py
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Baixa em stream contínuo (blocos de 1MB) os arquivos Empresas0.zip, Socios0.zip e Estabelecimentos0.zip
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(rfbDownloaderScript)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copiado!' : 'Copiar Script'}</span>
                      </button>
                      <button
                        onClick={() => handleDownload('download_receita_federal.py', rfbDownloaderScript)}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar .py</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-teal-300 overflow-x-auto max-h-[480px] leading-relaxed">
                      {rfbDownloaderScript}
                    </pre>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: PANDAS PROCESSOR (BRASIL) */}
              {rfbSubTab === 'pandas_script' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                        processa_socios_pandas.py
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Lê direto do ZIP em memória e realiza o Inner Join de Razão Social + Sócios QSA por cnpj_basico
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(rfbPandasScript)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copiado!' : 'Copiar Script'}</span>
                      </button>
                      <button
                        onClick={() => handleDownload('processa_socios_pandas.py', rfbPandasScript)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Baixar .py</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-[480px] leading-relaxed">
                      {rfbPandasScript}
                    </pre>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB: MÓDULO 1 - GOOGLE MAPS & REDES */}
          {activeTab === 'module_maps' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    1. Scraper do Google Maps &amp; Módulo Redes Sociais (Playwright Async)
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    Bypass de Cookies &amp; Stealth
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  Utiliza o Playwright para lançar uma sessão de Chromium mascarada (<code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">--disable-blink-features=AutomationControlled</code>), clica no consentimento de cookies da UE/Brasil, rola o feed <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">div[role="feed"]</code> e extrai detalhes no DOM via BeautifulSoup.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-400">Extração de Fotos em Alta Resolução</span>
                    <p className="text-slate-400 text-[11px]">
                      Raspa as tags <code className="text-amber-300">img[src*="googleusercontent.com/p/"]</code> diretamente da galeria do Maps.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
                    <span className="font-bold text-pink-400">Rastreamento de Redes Sociais no HTML</span>
                    <p className="text-slate-400 text-[11px]">
                      Acessa a URL do website oficial com timeout de 12s e extrai Instagram, Facebook, LinkedIn e X via Regex patterns.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
{`# Padrões Regex de Redes Sociais rastreados no DOM do site:
patterns = {
    "instagram": r'https?://(?:www\\.)?instagram\\.com/[A-Za-z0-9_.-]+',
    "facebook": r'https?://(?:www\\.)?facebook\\.com/[A-Za-z0-9_.-]+',
    "linkedin": r'https?://(?:www\\.)?linkedin\\.com/(?:company|in)/[A-Za-z0-9_.-]+',
    "twitter": r'https?://(?:www\\.)?(?:twitter|x)\\.com/[A-Za-z0-9_.-]+'
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MÓDULO 2 - MATCHING ENGINE DIFFLIB */}
          {activeTab === 'module_matching' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4" />
                    2. Engine de Cruzamento de Dados (Apollo + Google Maps com Difflib)
                  </span>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Fuzzy Match &gt; 85%
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  Cruza a inteligência de decisores (Apollo / LinkedIn) com os dados operacionais do Google Maps (reviews, fotos, endereço, telefones) utilizando dupla checagem:
                </p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-emerald-400 font-bold">1. Cruzamento por Domínio Idêntico:</span>
                    <p className="text-slate-300 font-sans">
                      A função <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">normalize_domain(url)</code> remove protocolos, <code className="text-amber-300">www.</code> e sub-rotas para comparar domínios com 98% de precisão.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-amber-400 font-bold">2. Match por Fuzzy String do Nome (difflib.SequenceMatcher):</span>
                    <p className="text-slate-300 font-sans">
                      Se o domínio não estiver presente, calcula <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">difflib.SequenceMatcher(None, a_name, m_name).ratio() &gt; 0.85</code> para tolerar variações entre Razão Social e Nome Fantasia.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300 overflow-x-auto">
{`def cross_match_apollo_and_maps(apollo_leads: list, maps_leads: list) -> list:
    for a_lead in apollo_leads:
        # Match 1: Domínio limpo
        if a_domain and m_domain and a_domain == m_domain:
            matched_maps = m_lead
            break
        # Match 2: Fuzzy String Ratio > 85%
        similarity = difflib.SequenceMatcher(None, a_name, m_name).ratio()
        if similarity > 0.85:
            matched_maps = m_lead
            break`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MÓDULO 3 - BASES FISCAIS */}
          {activeTab === 'module_fiscal' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-cyan-400 flex items-center gap-1.5">
                    <Database className="w-4 h-4" />
                    3. Módulo de Rastreio em Bases Públicas/Fiscais (BR, PT, ES)
                  </span>
                  <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    PublicFiscalScraper
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  Consultas sem custo a dados mercantis e registros comerciais oficiais em 3 países:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-emerald-400 flex items-center gap-1">🇧🇷 Brasil (CNPJ.ws)</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Consulta <code className="text-amber-300">publica.cnpj.ws</code> retornando Razão Social, Capital Social, CNAE e Sócios (QSA).
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-indigo-400 flex items-center gap-1">🇵🇹 Portugal (NIF.pt)</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Scraping de <code className="text-amber-300">nif.pt/?q=</code> extraindo NIF, Denominação Comercial e atividade CAE.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="font-bold text-amber-400 flex items-center gap-1">🇪🇸 Espanha (Informa/BORME)</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Scraping de <code className="text-amber-300">informa.es</code> extraindo CIF, Razão Social, Província e Status.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SIMULADOR AO VIVO */}
          {activeTab === 'simulator' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4" />
                    Simulador do Pipeline Unificado (JSON Output)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Gera a estrutura JSON consolidada em tempo real com base nos parâmetros selecionados
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRunSimulator}
                    disabled={isSimulating}
                    className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                    <span>{isSimulating ? 'Executando Pipeline...' : 'Re-executar Teste'}</span>
                  </button>
                  {simulatedOutput && (
                    <button
                      onClick={() => handleCopy(simulatedOutput)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar JSON'}</span>
                    </button>
                  )}
                </div>
              </div>

              {simulatedOutput ? (
                <div className="relative">
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-300 overflow-x-auto max-h-[480px] leading-relaxed">
                    {simulatedOutput}
                  </pre>
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl">
                  <RefreshCw className="w-6 h-6 text-violet-400 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Gerando simulação do pipeline unificado...</p>
                </div>
              )}
            </div>
          )}

          {/* TAB: NODE PUPPETEER */}
          {activeTab === 'node' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-sky-400">maps_scraper.js</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(nodeScript)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
                  </button>
                  <button
                    onClick={() => handleDownload('maps_scraper.js', nodeScript)}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Script .js</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto max-h-[500px] leading-relaxed">
                  {nodeScript}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Integrado com o ecossistema CriaHub CRM &amp; Omnichannel Cadence
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
          >
            Fechar Painel
          </button>
        </div>

      </div>
    </div>
  );
};
