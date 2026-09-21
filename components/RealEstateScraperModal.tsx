import React, { useState } from 'react';
import { 
  RealEstatePropertyLead, 
  RealEstateScrapingSearchQuery, 
  RealEstateCountry, 
  RealEstateTransactionType 
} from '../services/realEstateTypes';
import { 
  generatePortalDirectSearchUrls, 
  scrapeRealEstateParticulars,
  parseRealAdToLead,
  REAL_ESTATE_PORTALS
} from '../services/realEstateScrapingService';
import { 
  extractGeckoProperty,
  getSavedGeckoApiToken,
  saveGeckoApiToken,
  detectGeckoTargetFromUrl,
  GeckoSupportedTarget
} from '../services/geckoApiService';
import {
  searchIdealistaListings,
  getIdealistaPropertyDetail,
  getSavedIdealistaApiKey,
  saveIdealistaApiKey,
  IDEALISTA_LOCATION_PRESETS,
  extractPropertyCodeFromUrl
} from '../services/idealistaRapidApiService';
import {
  runApifyIdealistaActor,
  getSavedApifyToken,
  saveApifyToken
} from '../services/apifyIdealistaService';
import {
  searchIdealistoOfficial,
  getSavedIdealistoCredentials,
  saveIdealistoCredentials,
  IdealistoSearchParams
} from '../services/idealistoOfficialService';
import {
  runAllEnginesDiagnosticTest,
  calculateRealEstateYieldMetrics,
  executeUnifiedCrossPortalSearch,
  EngineTestResult,
  CITY_COORDINATES
} from '../services/realEstateSearchAggregatorService';
import {
  validateAndNormalizeRealEstateAd,
  StructuredAiAdValidationResult,
  sanitizeRawAdContent
} from '../services/realEstateAiValidatorService';
import { AiEngineConfig, Lead } from '../types';
import { 
  Building2, 
  Home, 
  Search, 
  Sparkles, 
  X, 
  Filter, 
  MessageSquare, 
  PhoneCall, 
  ExternalLink, 
  Copy, 
  Check, 
  ShieldCheck, 
  DollarSign, 
  MapPin, 
  Calendar, 
  User, 
  Flame, 
  ArrowRight,
  TrendingUp,
  Layers,
  HelpCircle,
  Clock,
  ChevronRight,
  Key,
  Database,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Activity,
  Cpu,
  BarChart3,
  Compass,
  Play
} from 'lucide-react';

interface RealEstateScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiConfig: AiEngineConfig;
  defaultCountry?: string;
  defaultCity?: string;
  onImportLead?: (lead: Lead) => void;
  onImportLeads?: (leads: Lead[]) => void;
}

export const RealEstateScraperModal: React.FC<RealEstateScraperModalProps> = ({
  isOpen,
  onClose,
  aiConfig,
  defaultCountry = 'PT',
  defaultCity = 'Lisboa',
  onImportLead,
  onImportLeads
}) => {
  if (!isOpen) return null;

  // Search parameters
  const [country, setCountry] = useState<RealEstateCountry>(
    (defaultCountry === 'ES' || defaultCountry === 'BR' || defaultCountry === 'PT') 
      ? (defaultCountry as RealEstateCountry) 
      : 'PT'
  );
  const [city, setCity] = useState<string>(defaultCity || (country === 'PT' ? 'Lisboa' : country === 'ES' ? 'Madrid' : 'São Paulo'));
  const [zoneOrDistrict, setZoneOrDistrict] = useState<string>('');
  const [transactionType, setTransactionType] = useState<RealEstateTransactionType>('SALE');
  const [propertyType, setPropertyType] = useState<string>('Apartamentos & Moradias');
  const [maxDaysAgo, setMaxDaysAgo] = useState<number>(3); // Últimos 3 dias

  // Scraping state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [propertyLeads, setPropertyLeads] = useState<RealEstatePropertyLead[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<RealEstatePropertyLead | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeObjectionTab, setActiveObjectionTab] = useState<string>('dontWantAgencies');
  const [customAdText, setCustomAdText] = useState<string>('');
  const [isParsingAd, setIsParsingAd] = useState<boolean>(false);
  const [showImporter, setShowImporter] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<StructuredAiAdValidationResult | null>(null);

  // --- GeckoAPI / Chaves na Mão Brasil State ---
  const [showGeckoPanel, setShowGeckoPanel] = useState<boolean>(false);
  const [geckoToken, setGeckoToken] = useState<string>(() => getSavedGeckoApiToken());
  const [geckoUrl, setGeckoUrl] = useState<string>(
    'https://www.chavesnamao.com.br/imovel/apartamento-a-venda-4-quartos-com-garagem-sc-balneario-picarras-centro-496m2-RS5990000/id-29279133/'
  );
  const [isGeckoLoading, setIsGeckoLoading] = useState<boolean>(false);
  const [geckoStatusMessage, setGeckoStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [importedSuccessLeadId, setImportedSuccessLeadId] = useState<string | null>(null);

  // --- Idealista RapidAPI State ---
  const [showIdealistaPanel, setShowIdealistaPanel] = useState<boolean>(false);
  const [idealistaApiKey, setIdealistaApiKey] = useState<string>(() => getSavedIdealistaApiKey());
  const [idealistaCountry, setIdealistaCountry] = useState<'PT' | 'ES' | 'IT'>('PT');
  const [idealistaLocationId, setIdealistaLocationId] = useState<string>('0-EU-PT-11');
  const [idealistaPriceFrom, setIdealistaPriceFrom] = useState<string>('');
  const [idealistaPriceTo, setIdealistaPriceTo] = useState<string>('500000');
  const [idealistaUrlOrCode, setIdealistaUrlOrCode] = useState<string>('https://www.idealista.pt/imovel/112345678/');
  const [isIdealistaLoading, setIsIdealistaLoading] = useState<boolean>(false);
  const [idealistaStatusMessage, setIdealistaStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // --- Apify Actor State (Actor 0qnMmz76dLymEDVGf) ---
  const [showApifyPanel, setShowApifyPanel] = useState<boolean>(false);
  const [apifyToken, setApifyToken] = useState<string>(() => getSavedApifyToken());
  const [apifyActorId, setApifyActorId] = useState<string>('0qnMmz76dLymEDVGf');
  const [apifyCountry, setApifyCountry] = useState<'es' | 'pt' | 'it'>('es');
  const [apifySearchUrl, setApifySearchUrl] = useState<string>('https://www.idealista.com/en/venta-viviendas/madrid-madrid/');
  const [apifyDeepUrl, setApifyDeepUrl] = useState<string>('');
  const [apifyLocationId, setApifyLocationId] = useState<string>('0-EU-ES-28-07');
  const [apifyLocationName, setApifyLocationName] = useState<string>('Madrid');
  const [apifyNumPages, setApifyNumPages] = useState<number>(1);
  const [isApifyLoading, setIsApifyLoading] = useState<boolean>(false);
  const [apifyStatusMessage, setApifyStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // --- Idealisto Official OAuth2 Engine State (hmeleiro/idealisto) ---
  const [showIdealistoPanel, setShowIdealistoPanel] = useState<boolean>(false);
  const [idealistoApiKey, setIdealistoApiKey] = useState<string>(() => getSavedIdealistoCredentials().apiKey);
  const [idealistoApiSecret, setIdealistoApiSecret] = useState<string>(() => getSavedIdealistoCredentials().apiSecret);
  const [idealistoCountry, setIdealistoCountry] = useState<'es' | 'pt' | 'it'>('es');
  const [idealistoCenter, setIdealistoCenter] = useState<string>('40.416775,-3.703790');
  const [idealistoDistance, setIdealistoDistance] = useState<number>(5000);
  const [idealistoMaxPrice, setIdealistoMaxPrice] = useState<string>('650000');
  const [idealistoBedrooms, setIdealistoBedrooms] = useState<string>('2,3,4');
  const [isIdealistoLoading, setIsIdealistoLoading] = useState<boolean>(false);
  const [idealistoStatusMessage, setIdealistoStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // --- Multi-Engine Diagnostic & Search Aggregator (RobertoReale/real-estate-search) ---
  const [showAggregatorPanel, setShowAggregatorPanel] = useState<boolean>(false);
  const [diagnosticResults, setDiagnosticResults] = useState<EngineTestResult[]>([]);
  const [isRunningDiagnostics, setIsRunningDiagnostics] = useState<boolean>(false);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleCountryChange = (newCountry: RealEstateCountry) => {
    setCountry(newCountry);
    setPropertyLeads([]);
    setSelectedProperty(null);
    if (newCountry === 'PT') {
      setCity('Lisboa');
      setApifyCountry('pt');
      setIdealistaCountry('PT');
    } else if (newCountry === 'ES') {
      setCity('Madrid');
      setApifyCountry('es');
      setIdealistaCountry('ES');
    } else {
      setCity('São Paulo');
      setShowGeckoPanel(true);
    }
    setZoneOrDistrict('');
  };

  const handleSelectCityQuick = (newCity: string) => {
    setCity(newCity);
    setZoneOrDistrict('');
    setPropertyLeads([]);
    setSelectedProperty(null);
  };

  const handleSaveGeckoToken = () => {
    saveGeckoApiToken(geckoToken);
    setGeckoStatusMessage({ type: 'success', text: 'Token da GeckoAPI salvo com sucesso!' });
    setTimeout(() => setGeckoStatusMessage(null), 3000);
  };

  const handleExtractGeckoApi = async () => {
    if (!geckoUrl.trim()) {
      setGeckoStatusMessage({ type: 'error', text: 'Por favor insira a URL do imóvel à venda (OLX, ZAP, VivaReal ou Chaves na Mão).' });
      return;
    }

    setIsGeckoLoading(true);
    setGeckoStatusMessage({ type: 'info', text: 'Conectando à GeckoAPI e aplicando filtro de venda em tempo real...' });

    try {
      if (geckoToken) {
        saveGeckoApiToken(geckoToken);
      }

      const result = await extractGeckoProperty(geckoUrl, geckoToken);

      if (!result.success || !result.propertyLead) {
        setGeckoStatusMessage({ type: 'error', text: result.error || 'Falha na extração pela GeckoAPI.' });
        return;
      }

      const newProp = result.propertyLead;
      setPropertyLeads(prev => [newProp, ...prev]);
      setSelectedProperty(newProp);
      setGeckoStatusMessage({ 
        type: 'success', 
        text: `✔ Imóvel à VENDA extraído com sucesso! "${newProp.title}" (${newProp.price})` 
      });

      // Se houver callback de importação para o CRM
      if (result.lead && onImportLead) {
        onImportLead(result.lead);
        setImportedSuccessLeadId(newProp.id);
      }
    } catch (err: any) {
      setGeckoStatusMessage({ type: 'error', text: err.message || 'Erro inesperado ao consultar a GeckoAPI.' });
    } finally {
      setIsGeckoLoading(false);
    }
  };

  // --- Idealista RapidAPI Handlers ---
  const handleSaveIdealistaApiKey = () => {
    saveIdealistaApiKey(idealistaApiKey);
    setIdealistaStatusMessage({ type: 'success', text: 'RapidAPI Key do Idealista salva com sucesso!' });
    setTimeout(() => setIdealistaStatusMessage(null), 3000);
  };

  const handleSearchIdealistaApi = async () => {
    setIsIdealistaLoading(true);
    setIdealistaStatusMessage({ type: 'info', text: `Consultando API do Idealista (${idealistaCountry}) para a região selecionada...` });

    try {
      if (idealistaApiKey) {
        saveIdealistaApiKey(idealistaApiKey);
      }

      const res = await searchIdealistaListings({
        apiKey: idealistaApiKey,
        country: idealistaCountry,
        locationId: idealistaLocationId,
        priceFrom: idealistaPriceFrom ? parseInt(idealistaPriceFrom, 10) : undefined,
        priceTo: idealistaPriceTo ? parseInt(idealistaPriceTo, 10) : undefined,
        maxItems: 20
      });

      if (!res.success || !res.propertyLeads || res.propertyLeads.length === 0) {
        setIdealistaStatusMessage({ type: 'error', text: res.error || 'Nenhum imóvel retornado pela API do Idealista para estes filtros.' });
        return;
      }

      setPropertyLeads(prev => [...res.propertyLeads!, ...prev]);
      setSelectedProperty(res.propertyLeads[0]);
      setIdealistaStatusMessage({
        type: 'success',
        text: `✔ ${res.propertyLeads.length} imóveis à venda carregados com sucesso do Idealista!`
      });

      // Opcional: auto-importar lote para o CRM se houver leads
      if (res.leads && onImportLeads) {
        onImportLeads(res.leads);
      }
    } catch (err: any) {
      setIdealistaStatusMessage({ type: 'error', text: err.message || 'Erro ao conectar à API do Idealista.' });
    } finally {
      setIsIdealistaLoading(false);
    }
  };

  const handleGetIdealistaDetailApi = async () => {
    if (!idealistaUrlOrCode.trim()) {
      setIdealistaStatusMessage({ type: 'error', text: 'Insira o link do anúncio do Idealista ou o código do imóvel.' });
      return;
    }

    setIsIdealistaLoading(true);
    setIdealistaStatusMessage({ type: 'info', text: 'Buscando detalhes cadastrais, fotos HD e contato no Idealista...' });

    try {
      if (idealistaApiKey) {
        saveIdealistaApiKey(idealistaApiKey);
      }

      const code = extractPropertyCodeFromUrl(idealistaUrlOrCode) || idealistaUrlOrCode.trim();
      const res = await getIdealistaPropertyDetail(code, idealistaApiKey, idealistaCountry);

      if (!res.success || !res.propertyLead) {
        setIdealistaStatusMessage({ type: 'error', text: res.error || 'Não foi possível obter detalhes do imóvel.' });
        return;
      }

      const prop = res.propertyLead;
      setPropertyLeads(prev => [prop, ...prev]);
      setSelectedProperty(prop);
      setIdealistaStatusMessage({
        type: 'success',
        text: `✔ Imóvel #${code} (${prop.price}) carregado com sucesso!`
      });

      if (res.lead && onImportLead) {
        onImportLead(res.lead);
        setImportedSuccessLeadId(prop.id);
      }
    } catch (err: any) {
      setIdealistaStatusMessage({ type: 'error', text: err.message || 'Erro inesperado na API Idealista.' });
    } finally {
      setIsIdealistaLoading(false);
    }
  };

  // --- Apify Idealista Actor Handlers ---
  const handleSaveApifyToken = () => {
    saveApifyToken(apifyToken);
    setApifyStatusMessage({ type: 'success', text: 'Token do Apify salvo com sucesso no navegador!' });
    setTimeout(() => setApifyStatusMessage(null), 3000);
  };

  const handleRunApifyActor = async () => {
    if (!apifyToken.trim()) {
      setApifyStatusMessage({ type: 'error', text: 'Por favor, insira seu Token de API pessoal do Apify.' });
      return;
    }

    setIsApifyLoading(true);
    setApifyStatusMessage({ type: 'info', text: `Acionando Actor do Apify (${apifyActorId}) para extração em ${apifyCountry.toUpperCase()}...` });

    try {
      saveApifyToken(apifyToken);

      const res = await runApifyIdealistaActor({
        token: apifyToken,
        actorId: apifyActorId || '0qnMmz76dLymEDVGf',
        country: apifyCountry,
        operation: 'sale', // Estritamente VENDA
        searchUrl: apifySearchUrl || undefined,
        deepSingleUrl: apifyDeepUrl || undefined,
        locationId: apifyLocationId || undefined,
        locationName: apifyLocationName || undefined,
        numPages: apifyNumPages || 1,
        maxItems: 30
      });

      if (!res.success || !res.propertyLeads || res.propertyLeads.length === 0) {
        setApifyStatusMessage({ 
          type: 'error', 
          text: res.error || 'O Actor finalizou a execução, mas nenhum anúncio foi retornado no Dataset.' 
        });
        return;
      }

      setPropertyLeads(prev => [...res.propertyLeads!, ...prev]);
      setSelectedProperty(res.propertyLeads[0]);
      setApifyStatusMessage({
        type: 'success',
        text: `✔ Sucesso! ${res.propertyLeads.length} imóveis à venda extraídos do Dataset (Run ID: ${res.runId || 'OK'}).`
      });

      if (res.leads && onImportLeads) {
        onImportLeads(res.leads);
      }
    } catch (err: any) {
      setApifyStatusMessage({ type: 'error', text: err.message || 'Falha ao executar o Actor do Apify.' });
    } finally {
      setIsApifyLoading(false);
    }
  };

  // --- Idealisto Official Engine Handlers (hmeleiro/idealisto) ---
  const handleSaveIdealistoCredentials = () => {
    saveIdealistoCredentials(idealistoApiKey, idealistoApiSecret);
    setIdealistoStatusMessage({ type: 'success', text: 'Credenciais OAuth2 do Idealista salvas com sucesso!' });
    setTimeout(() => setIdealistoStatusMessage(null), 3000);
  };

  const handleSearchIdealistoOfficial = async () => {
    setIsIdealistoLoading(true);
    setIdealistoStatusMessage({ type: 'info', text: `Consultando API Oficial 3.5 do Idealista (${idealistoCountry.toUpperCase()})...` });

    try {
      if (idealistoApiKey && idealistoApiSecret) {
        saveIdealistoCredentials(idealistoApiKey, idealistoApiSecret);
      }

      const res = await searchIdealistoOfficial({
        country: idealistoCountry,
        operation: 'sale',
        propertyType: 'homes',
        center: idealistoCenter || undefined,
        distance: idealistoDistance || 5000,
        maxPrice: idealistoMaxPrice ? parseInt(idealistoMaxPrice, 10) : undefined,
        bedrooms: idealistoBedrooms || undefined,
        maxItems: 20
      }, {
        apiKey: idealistoApiKey,
        apiSecret: idealistoApiSecret
      });

      if (!res.success || !res.propertyLeads || res.propertyLeads.length === 0) {
        setIdealistoStatusMessage({ type: 'error', text: res.error || 'Nenhum imóvel retornado pela API 3.5 do Idealista.' });
        return;
      }

      setPropertyLeads(prev => [...res.propertyLeads!, ...prev]);
      setSelectedProperty(res.propertyLeads[0]);
      setIdealistoStatusMessage({
        type: 'success',
        text: `✔ ${res.propertyLeads.length} imóveis carregados com sucesso (${res.isMockDemo ? 'Sandbox Engine' : 'Live API 3.5'})!`
      });

      if (res.leads && onImportLeads) {
        onImportLeads(res.leads);
      }
    } catch (err: any) {
      setIdealistoStatusMessage({ type: 'error', text: err.message || 'Erro ao conectar à API Idealisto.' });
    } finally {
      setIsIdealistoLoading(false);
    }
  };

  // --- Multi-Engine Diagnostic Test Runner (RobertoReale/real-estate-search) ---
  const handleRunDiagnostics = async () => {
    setIsRunningDiagnostics(true);
    try {
      const results = await runAllEnginesDiagnosticTest();
      setDiagnosticResults(results);
    } catch (err) {
      console.error('Falha ao rodar testes de integração', err);
    } finally {
      setIsRunningDiagnostics(false);
    }
  };

  const handleParseCustomAd = async () => {
    if (!customAdText.trim()) return;
    setIsParsingAd(true);
    try {
      const result = await validateAndNormalizeRealEstateAd(
        customAdText,
        {
          country,
          fallbackCity: city,
          expectedTransactionType: transactionType
        },
        aiConfig
      );

      setValidationResult(result);

      if (result.propertyLead) {
        setPropertyLeads(prev => [result.propertyLead!, ...prev]);
        setSelectedProperty(result.propertyLead);
      }

      if (result.leadCrm && onImportLead) {
        onImportLead(result.leadCrm);
        setImportedSuccessLeadId(result.propertyLead?.id || 'val_direct');
      }
    } catch (err: any) {
      console.error('Erro na validação do anúncio:', err);
      alert(err.message || 'Erro ao processar o anúncio');
    } finally {
      setIsParsingAd(false);
    }
  };

  const handleExecuteScraping = async () => {
    setIsLoading(true);
    try {
      const query: RealEstateScrapingSearchQuery = {
        country,
        city,
        zoneOrDistrict,
        transactionType,
        propertyType,
        maxDaysAgo,
        onlyParticulars: true,
        targetPortals: country === 'PT' ? ['idealista', 'olx', 'custojusto'] : country === 'ES' ? ['idealista', 'fotocasa', 'pisos_com'] : ['olx', 'zap_imoveis', 'vivareal']
      };

      const leads = await scrapeRealEstateParticulars(query, aiConfig);
      setPropertyLeads(leads);
      if (leads.length > 0) {
        setSelectedProperty(leads[0]);
      }
    } catch (error) {
      console.error('Erro na pesquisa unificada de imóveis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Direct portal queries for manual verification / deep search
  const directPortalUrls = generatePortalDirectSearchUrls({
    country,
    city,
    zoneOrDistrict,
    transactionType,
    maxDaysAgo,
    onlyParticulars: true,
    targetPortals: ['idealista', 'olx']
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-center items-center p-2 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-7xl bg-white h-full max-h-[95vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Home className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Scraper de Imóveis de Particulares (Idealista, OLX, Fotocasa & Zap)
                </h2>
                <span className="text-[11px] font-black bg-amber-400/20 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded-full">
                  100% Proprietários Físicos (FSBO)
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 hidden sm:block">
                Captação ativa de imóveis recém-postados direto com o proprietário + scripts e quebra de objeções para corretores e imobiliárias.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Filter Controls Bar */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            
            {/* Country Selector */}
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">País do Portal</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl">
                {[
                  { code: 'PT', label: '🇵🇹 Portugal' },
                  { code: 'ES', label: '🇪🇸 Espanha' },
                  { code: 'BR', label: '🇧🇷 Brasil' }
                ].map(c => (
                  <button
                    key={c.code}
                    onClick={() => handleCountryChange(c.code as RealEstateCountry)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all truncate ${
                      country === c.code ? 'bg-white text-indigo-900 shadow-xs border border-slate-300' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Cidade / Concelho</label>
              <input
                type="text"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPropertyLeads([]);
                  setSelectedProperty(null);
                }}
                placeholder="Ex: Lisboa, Porto, Braga..."
                className="w-full text-xs font-bold text-slate-900 px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-2xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Zone / Bairro */}
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Zona / Freguesia</label>
              <input
                type="text"
                value={zoneOrDistrict}
                onChange={(e) => {
                  setZoneOrDistrict(e.target.value);
                  setPropertyLeads([]);
                  setSelectedProperty(null);
                }}
                placeholder="Ex: Paço de Arcos, Foz, Boavista..."
                className="w-full text-xs font-bold text-slate-900 px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-2xs focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Transaction Type */}
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Finalidade</label>
              <select
                value={transactionType}
                onChange={(e) => {
                  setTransactionType(e.target.value as RealEstateTransactionType);
                  setPropertyLeads([]);
                  setSelectedProperty(null);
                }}
                className="w-full text-xs font-bold text-slate-900 px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-2xs cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="SALE">Venda / Compra</option>
                <option value="RENT">Arrendamento / Aluguel</option>
              </select>
            </div>

            {/* Recência / Data */}
            <div>
              <label className="text-[11px] font-black text-slate-600 uppercase block mb-1">Data / Recência</label>
              <select
                value={maxDaysAgo}
                onChange={(e) => setMaxDaysAgo(Number(e.target.value))}
                className="w-full text-xs font-bold text-slate-900 px-3 py-2 rounded-xl border border-slate-300 bg-white shadow-2xs cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value={1}>Postados Hoje (24h)</option>
                <option value={3}>Últimos 3 Dias</option>
                <option value={7}>Últimos 7 Dias (Semana)</option>
                <option value={30}>Último Mês</option>
              </select>
            </div>

            {/* Execute Button & Manual Ad Importer */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleExecuteScraping}
                disabled={isLoading || !city}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-600 via-rose-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-amber-200" />
                    <span>Minerando {city}...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-amber-200" />
                    <span>Buscar Particulares</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowImporter(!showImporter)}
                className={`py-2 px-3 rounded-xl font-black text-xs border transition-all flex items-center gap-1 shrink-0 ${
                  showImporter ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50'
                }`}
                title="Colar link ou texto de anúncio real do OLX, Idealista ou CustoJusto"
              >
                <Layers className="w-4 h-4" />
                <span>+ Importar Anúncio</span>
              </button>
            </div>

          </div>

          {/* Sub-toolbar with engines, APIs and tools */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mr-1">Conectores:</span>
            
            <button
              onClick={() => setShowGeckoPanel(!showGeckoPanel)}
              className={`py-1.5 px-2.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 shrink-0 ${
                showGeckoPanel 
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' 
                  : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
              }`}
              title="Extração automática via GeckoAPI (Chaves na Mão, OLX, ZAP, VivaReal)"
            >
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>🇧🇷 GeckoAPI</span>
            </button>

            <button
              onClick={() => setShowIdealistaPanel(!showIdealistaPanel)}
              className={`py-1.5 px-2.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 shrink-0 ${
                showIdealistaPanel 
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs' 
                  : 'bg-amber-50 text-amber-950 border-amber-300 hover:bg-amber-100'
              }`}
              title="API Oficial RapidAPI do Idealista (Portugal, Espanha, Itália)"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              <span>🇪🇺 Idealista API</span>
            </button>

            <button
              onClick={() => setShowApifyPanel(!showApifyPanel)}
              className={`py-1.5 px-2.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 shrink-0 ${
                showApifyPanel 
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs' 
                  : 'bg-purple-50 text-purple-950 border-purple-300 hover:bg-purple-100'
              }`}
              title="Executar Apify Actor Oficial (0qnMmz76dLymEDVGf) para Idealista"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>🤖 Apify Actor</span>
            </button>

            <button
              onClick={() => setShowIdealistoPanel(!showIdealistoPanel)}
              className={`py-1.5 px-2.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 shrink-0 ${
                showIdealistoPanel 
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs' 
                  : 'bg-blue-50 text-blue-950 border-blue-300 hover:bg-blue-100'
              }`}
              title="Idealisto OAuth2 Engine (GitHub hmeleiro/idealisto)"
            >
              <Key className="w-3.5 h-3.5 text-blue-600" />
              <span>🔐 Idealisto OAuth2</span>
            </button>

            <button
              onClick={() => {
                setShowAggregatorPanel(!showAggregatorPanel);
                if (!showAggregatorPanel && diagnosticResults.length === 0) {
                  handleRunDiagnostics();
                }
              }}
              className={`py-1.5 px-2.5 rounded-xl font-bold text-xs border transition-all flex items-center gap-1.5 shrink-0 ${
                showAggregatorPanel 
                  ? 'bg-slate-900 text-white border-black shadow-xs' 
                  : 'bg-slate-100 text-slate-900 border-slate-300 hover:bg-slate-200'
              }`}
              title="Diagnóstico e Agregador Multi-Portal (GitHub RobertoReale/real-estate-search)"
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>📊 Diagnóstico Multi-Engine</span>
            </button>
          </div>

          {/* Apify Actor Panel (Idealista Scraper Actor: 0qnMmz76dLymEDVGf) */}
          {showApifyPanel && (
            <div className="pt-3 border-t border-purple-200 bg-gradient-to-r from-purple-50/90 via-indigo-50/50 to-slate-50 p-4 rounded-2xl border border-purple-300 shadow-inner space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-purple-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    AP
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                      Apify Actor Integration
                      <span className="text-[10px] font-extrabold bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full border border-purple-300 font-mono">
                        Actor: {apifyActorId}
                      </span>
                    </h3>
                    <p className="text-[11px] text-purple-900">
                      Executa o robô em nuvem no Apify Client, filtra listagens à <strong>VENDA</strong> e sincroniza o Dataset de anúncios direto no CRM.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="password"
                      value={apifyToken}
                      onChange={(e) => setApifyToken(e.target.value)}
                      placeholder="Cole seu Apify API Token..."
                      className="w-full text-xs font-mono px-3 py-1.5 rounded-xl border border-purple-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveApifyToken}
                    className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs"
                  >
                    Salvar Token
                  </button>
                </div>
              </div>

              {apifyStatusMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  apifyStatusMessage.type === 'success' 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : apifyStatusMessage.type === 'error'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-purple-100 text-purple-900 border border-purple-300'
                }`}>
                  {apifyStatusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {apifyStatusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  {apifyStatusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-purple-600 animate-spin shrink-0" />}
                  <span>{apifyStatusMessage.text}</span>
                </div>
              )}

              {/* Sub-grid: Apify Actor Parameters */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
                <div className="lg:col-span-8 bg-white/80 p-3 rounded-xl border border-purple-200 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-purple-600" />
                      1. Parâmetros de Execução do Actor
                    </span>
                    <span className="text-[10px] uppercase font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                      Operation: SALE (Venda)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">País</label>
                      <div className="flex rounded-lg overflow-hidden border border-slate-300 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setApifyCountry('es');
                            setApifyLocationId('0-EU-ES-28-07');
                            setApifyLocationName('Madrid');
                            setApifySearchUrl('https://www.idealista.com/en/venta-viviendas/madrid-madrid/');
                          }}
                          className={`flex-1 py-1 text-center transition-colors ${apifyCountry === 'es' ? 'bg-purple-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          🇪🇸 ES
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setApifyCountry('pt');
                            setApifyLocationId('0-EU-PT-11');
                            setApifyLocationName('Lisboa');
                            setApifySearchUrl('https://www.idealista.pt/comprar-casas/lisboa/');
                          }}
                          className={`flex-1 py-1 text-center border-l border-r border-slate-300 transition-colors ${apifyCountry === 'pt' ? 'bg-purple-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          🇵🇹 PT
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setApifyCountry('it');
                            setApifyLocationId('0-EU-IT-58');
                            setApifyLocationName('Roma');
                            setApifySearchUrl('https://www.idealista.it/vendita-case/roma-roma/');
                          }}
                          className={`flex-1 py-1 text-center transition-colors ${apifyCountry === 'it' ? 'bg-purple-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          🇮🇹 IT
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Location ID</label>
                      <input
                        type="text"
                        value={apifyLocationId}
                        onChange={(e) => setApifyLocationId(e.target.value)}
                        placeholder="Ex: 0-EU-ES-28-07"
                        className="w-full text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Qtd Páginas</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={apifyNumPages}
                        onChange={(e) => setApifyNumPages(parseInt(e.target.value, 10) || 1)}
                        className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Search URL (Opcional - sobrescreve filtros)</label>
                    <input
                      type="text"
                      value={apifySearchUrl}
                      onChange={(e) => setApifySearchUrl(e.target.value)}
                      placeholder="https://www.idealista.com/en/venta-viviendas/madrid-madrid/"
                      className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="lg:col-span-4 bg-white/80 p-3 rounded-xl border border-purple-200 space-y-2.5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                        <DownloadCloud className="w-3.5 h-3.5 text-purple-600" />
                        2. Extração de Imóvel Único
                      </span>
                    </div>

                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      deepSingleUrl (Link do Imóvel)
                    </label>
                    <input
                      type="text"
                      value={apifyDeepUrl}
                      onChange={(e) => setApifyDeepUrl(e.target.value)}
                      placeholder="https://www.idealista.com/en/inmueble/111577630/"
                      className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={handleRunApifyActor}
                      disabled={isApifyLoading}
                      className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
                    >
                      {isApifyLoading ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span>Executando Apify Actor...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-purple-200" />
                          <span>Disparar Actor & Coletar Dataset</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Idealista RapidAPI Panel (Portugal, Spain, Italy) */}
          {showIdealistaPanel && (
            <div className="pt-3 border-t border-amber-200 bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-slate-50 p-4 rounded-2xl border border-amber-300 shadow-inner space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    ID
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                      Idealista REST API (RapidAPI Oficial)
                      <span className="text-[10px] font-extrabold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                        Portugal • Espanha • Itália
                      </span>
                    </h3>
                    <p className="text-[11px] text-amber-900">
                      Extração direta de listagens à venda, galerias de fotos em alta resolução, plantas, telefones e métricas de procura do Idealista.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="password"
                      value={idealistaApiKey}
                      onChange={(e) => setIdealistaApiKey(e.target.value)}
                      placeholder="Cole sua x-rapidapi-key..."
                      className="w-full text-xs font-mono px-3 py-1.5 rounded-xl border border-amber-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveIdealistaApiKey}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs"
                  >
                    Salvar Chave
                  </button>
                </div>
              </div>

              {idealistaStatusMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  idealistaStatusMessage.type === 'success' 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : idealistaStatusMessage.type === 'error'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {idealistaStatusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {idealistaStatusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  {idealistaStatusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-amber-600 animate-spin shrink-0" />}
                  <span>{idealistaStatusMessage.text}</span>
                </div>
              )}

              {/* Sub-grid: Search by Location vs Direct URL / Property Code */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
                {/* 1. Busca por Localização e Filtros de Venda */}
                <div className="lg:col-span-7 bg-white/80 p-3 rounded-xl border border-amber-200 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-amber-600" />
                      1. Pesquisa de Imóveis à Venda por Região
                    </span>
                    <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Venda Estrita
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">País</label>
                      <div className="flex rounded-lg overflow-hidden border border-slate-300 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setIdealistaCountry('PT');
                            setIdealistaLocationId('0-EU-PT-11');
                          }}
                          className={`flex-1 py-1 text-center transition-colors ${idealistaCountry === 'PT' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          🇵🇹 PT
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIdealistaCountry('ES');
                            setIdealistaLocationId('0-EU-ES-28');
                          }}
                          className={`flex-1 py-1 text-center border-l border-r border-slate-300 transition-colors ${idealistaCountry === 'ES' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          🇪🇸 ES
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIdealistaCountry('IT');
                            setIdealistaLocationId('0-EU-IT-58');
                          }}
                          className={`flex-1 py-1 text-center transition-colors ${idealistaCountry === 'IT' ? 'bg-amber-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                        >
                          🇮🇹 IT
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Localização (Location ID)</label>
                      <select
                        value={idealistaLocationId}
                        onChange={(e) => setIdealistaLocationId(e.target.value)}
                        className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                      >
                        {(IDEALISTA_LOCATION_PRESETS[idealistaCountry] || []).map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} ({loc.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Preço Até (€)</label>
                      <input
                        type="number"
                        value={idealistaPriceTo}
                        onChange={(e) => setIdealistaPriceTo(e.target.value)}
                        placeholder="Ex: 500000"
                        className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Preço A Partir De (€)</label>
                      <input
                        type="number"
                        value={idealistaPriceFrom}
                        onChange={(e) => setIdealistaPriceFrom(e.target.value)}
                        placeholder="Ex: 150000"
                        className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleSearchIdealistaApi}
                        disabled={isIdealistaLoading}
                        className="py-1.5 px-4 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap active:scale-95"
                      >
                        {isIdealistaLoading ? (
                          <>
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                            <span>Buscando...</span>
                          </>
                        ) : (
                          <>
                            <Search className="w-3.5 h-3.5" />
                            <span>Buscar no Idealista API</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Extração Direta por Link ou Código do Anúncio */}
                <div className="lg:col-span-5 bg-white/80 p-3 rounded-xl border border-amber-200 space-y-2.5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                        <DownloadCloud className="w-3.5 h-3.5 text-amber-600" />
                        2. Puxar Anúncio / Imóvel Específico
                      </span>
                    </div>

                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Link ou Código Idealista (ex: 112345678)
                    </label>
                    <input
                      type="text"
                      value={idealistaUrlOrCode}
                      onChange={(e) => setIdealistaUrlOrCode(e.target.value)}
                      placeholder="https://www.idealista.pt/imovel/112345678/ ou 112345678"
                      className="w-full text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIdealistaUrlOrCode('https://www.idealista.pt/imovel/33456789/')}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 underline"
                    >
                      Exemplo PT
                    </button>

                    <button
                      onClick={handleGetIdealistaDetailApi}
                      disabled={isIdealistaLoading}
                      className="py-1.5 px-3.5 bg-slate-900 hover:bg-black disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>⚡ Obter Detalhe & Fotos HD</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Idealisto Official OAuth2 Engine Panel (hmeleiro/idealisto) */}
          {showIdealistoPanel && (
            <div className="pt-3 border-t border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/40 to-slate-50 p-4 rounded-2xl border border-blue-300 shadow-inner space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-blue-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                      Idealisto Official OAuth2 Client (API 3.5)
                      <span className="text-[10px] font-mono font-bold bg-blue-200/80 text-blue-900 px-2 py-0.5 rounded-full border border-blue-300">
                        github.com/hmeleiro/idealisto
                      </span>
                    </h3>
                    <p className="text-[11px] text-blue-900">
                      Autenticação direta OAuth2 Bearer Token (Basic base64), busca por raio de coordenadas geodésicas (lat,lng) e tipologia.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSaveIdealistoCredentials}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs"
                  >
                    Salvar Credenciais
                  </button>
                </div>
              </div>

              {idealistoStatusMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  idealistoStatusMessage.type === 'success' 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : idealistoStatusMessage.type === 'error'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                }`}>
                  {idealistoStatusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {idealistoStatusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  {idealistoStatusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-blue-600 animate-spin shrink-0" />}
                  <span>{idealistoStatusMessage.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
                {/* 1. Credenciais OAuth2 */}
                <div className="lg:col-span-4 bg-white/80 p-3 rounded-xl border border-blue-200 space-y-2 shadow-2xs">
                  <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    Credenciais Idealista Developers
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">API Key (Consumer Key)</label>
                    <input
                      type="password"
                      value={idealistoApiKey}
                      onChange={(e) => setIdealistoApiKey(e.target.value)}
                      placeholder="Idealista Developer API Key..."
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">API Secret (Shared Secret)</label>
                    <input
                      type="password"
                      value={idealistoApiSecret}
                      onChange={(e) => setIdealistoApiSecret(e.target.value)}
                      placeholder="Idealista Developer Secret..."
                      className="w-full text-xs font-mono px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    *Se vazio, o sistema utiliza o motor Sandbox estruturado do Idealisto para validação imediata.
                  </p>
                </div>

                {/* 2. Parâmetros Geodésicos (Center & Distance) */}
                <div className="lg:col-span-8 bg-white/80 p-3 rounded-xl border border-blue-200 space-y-2 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-blue-950 flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        Busca por Raio Geodésico (Center Lat/Lng + Metros)
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIdealistoCountry('pt');
                            setIdealistoCenter('38.722252,-9.139337');
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${idealistoCountry === 'pt' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                        >
                          🇵🇹 Lisboa
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIdealistoCountry('es');
                            setIdealistoCenter('40.416775,-3.703790');
                          }}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${idealistoCountry === 'es' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                        >
                          🇪🇸 Madrid
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Centro (Lat, Lng)</label>
                        <input
                          type="text"
                          value={idealistoCenter}
                          onChange={(e) => setIdealistoCenter(e.target.value)}
                          placeholder="40.416775,-3.703790"
                          className="w-full text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Raio (Metros)</label>
                        <input
                          type="number"
                          value={idealistoDistance}
                          onChange={(e) => setIdealistoDistance(parseInt(e.target.value, 10) || 5000)}
                          placeholder="5000"
                          className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Preço Máximo (€)</label>
                        <input
                          type="number"
                          value={idealistoMaxPrice}
                          onChange={(e) => setIdealistoMaxPrice(e.target.value)}
                          placeholder="650000"
                          className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={handleSearchIdealistoOfficial}
                      disabled={isIdealistoLoading}
                      className="py-2 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      {isIdealistoLoading ? (
                        <>
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span>Autenticando e Buscando...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 text-blue-200 fill-current" />
                          <span>Executar Pesquisa Idealisto (API 3.5)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multi-Engine Diagnostic & Cross-Search Aggregator Panel (RobertoReale/real-estate-search) */}
          {showAggregatorPanel && (
            <div className="pt-3 border-t border-slate-300 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-4 rounded-2xl border border-slate-700 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                      Multi-Portal Test Runner & Search Aggregator
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        github.com/RobertoReale/real-estate-search
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Bateria de testes em tempo real, cálculo de yield de arrendamento por m² e validação cruzada de todas as engines conectadas.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRunDiagnostics}
                  disabled={isRunningDiagnostics}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isRunningDiagnostics ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Diagnosticando...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Executar Diagnóstico Geral</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tabela de Resultados dos Testes de Integração */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                {diagnosticResults.map((diag, idx) => (
                  <div key={idx} className="bg-slate-800/90 border border-slate-700 rounded-xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 truncate pr-2" title={diag.engineName}>
                        {diag.engineName}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        diag.status === 'SUCCESS' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                          : diag.status === 'SANDBOX_DEMO'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : diag.status === 'NOT_CONFIGURED'
                          ? 'bg-slate-700 text-slate-300'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {diag.status === 'SUCCESS' ? '✔ Conectado' : diag.status === 'SANDBOX_DEMO' ? '⚡ Sandbox OK' : diag.status === 'NOT_CONFIGURED' ? 'Pendente' : 'Erro'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Latência: <strong className="text-slate-200">{diag.latencyMs}ms</strong></span>
                      <span>Imóveis: <strong className="text-emerald-400">{diag.resultsCount}</strong></span>
                    </div>

                    {diag.samplePropertyTitle && (
                      <p className="text-[10px] text-slate-300 truncate bg-slate-900/60 px-2 py-1 rounded border border-slate-700/50">
                        {diag.samplePropertyTitle} ({diag.samplePrice})
                      </p>
                    )}

                    {diag.errorDetail && (
                      <p className="text-[10px] text-rose-300 line-clamp-1 italic">
                        {diag.errorDetail}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GeckoAPI / Brasil Real Estate Multi-Portal Extractor Box */}
          {showGeckoPanel && (
            <div className="pt-3 border-t border-emerald-200 bg-gradient-to-r from-emerald-50/90 via-slate-50 to-teal-50/90 p-4 rounded-2xl border border-emerald-300 shadow-inner space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-emerald-200/60 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    BR
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                      Extrator Oficial GeckoAPI (100 Créditos)
                      <span className="text-[10px] font-extrabold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                        OLX • ZAP • VivaReal • Chaves na Mão
                      </span>
                    </h3>
                    <p className="text-[11px] text-emerald-800 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span><strong>Filtro Estrito Ativo:</strong> Apenas imóveis à <strong>VENDA</strong> são permitidos. Bloqueio automático de aluguel e produtos.</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <input
                      type="password"
                      value={geckoToken}
                      onChange={(e) => setGeckoToken(e.target.value)}
                      placeholder="Cole seu Bearer Token GeckoAPI..."
                      className="w-full text-xs font-mono px-3 py-1.5 rounded-xl border border-emerald-300 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveGeckoToken}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors shadow-2xs"
                  >
                    Salvar Token
                  </button>
                </div>
              </div>

              {geckoStatusMessage && (
                <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  geckoStatusMessage.type === 'success' 
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                    : geckoStatusMessage.type === 'error'
                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                    : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                }`}>
                  {geckoStatusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  {geckoStatusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                  {geckoStatusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />}
                  <span>{geckoStatusMessage.text}</span>
                </div>
              )}

              {/* URL Input and Target Auto-Detection */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch">
                <div className="relative flex-1">
                  <input
                    type="url"
                    value={geckoUrl}
                    onChange={(e) => setGeckoUrl(e.target.value)}
                    placeholder="Cole o link do imóvel à venda: olx.com.br, zapimoveis.com.br, vivareal.com.br ou chavesnamao.com.br..."
                    className="w-full text-xs text-slate-900 font-medium px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-white shadow-2xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  {detectGeckoTargetFromUrl(geckoUrl) && (
                    <div className="absolute right-3 top-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md">
                        {detectGeckoTargetFromUrl(geckoUrl)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleExtractGeckoApi}
                    disabled={isGeckoLoading}
                    className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shrink-0 transition-all active:scale-95 whitespace-nowrap"
                  >
                    {isGeckoLoading ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-emerald-200" />
                        <span>Auditando e Extraindo...</span>
                      </>
                    ) : (
                      <>
                        <DownloadCloud className="w-4 h-4 text-emerald-200" />
                        <span>⚡ Extrair Imóvel à Venda</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Presets Rápidos para Testes dos 4 Portais */}
              <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="font-extrabold text-emerald-950">Atalhos de Venda:</span>
                <button
                  type="button"
                  onClick={() => setGeckoUrl('https://www.chavesnamao.com.br/imovel/apartamento-a-venda-4-quartos-com-garagem-sc-balneario-picarras-centro-496m2-RS5990000/id-29279133/')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold transition-colors"
                >
                  🔑 Chaves na Mão (Piçarras R$ 5.9M)
                </button>
                <button
                  type="button"
                  onClick={() => setGeckoUrl('https://www.vivareal.com.br/imovel/sobrado-3-quartos-vila-albertina-zona-norte-sao-paulo-com-garagem-94m2-venda-RS450000-id-2787552284/')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold transition-colors"
                >
                  🏠 VivaReal (Sobrado SP R$ 450k)
                </button>
                <button
                  type="button"
                  onClick={() => setGeckoUrl('https://www.zapimoveis.com.br/imovel/venda-apartamento-3-quartos-com-garagem-centro-curitiba-pr-110m2-id-2795564422/')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold transition-colors"
                >
                  🏢 ZAP Imóveis (Curitiba Venda)
                </button>
                <button
                  type="button"
                  onClick={() => setGeckoUrl('https://pr.olx.com.br/regiao-de-maringa/imoveis/apartamento-a-venda-3-quartos-zona-07-maringa-1300000000')}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-bold transition-colors"
                >
                  🏷️ OLX Imóveis (Venda)
                </button>
              </div>
            </div>
          )}

          {/* Quick Direct Live Portal Links (Free Deep Web View) */}
          <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-600 font-extrabold flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
              Portais Oficiais ao Vivo (Anúncios Ativos Hoje):
            </span>
            {directPortalUrls.map((p, idx) => (
              <a
                key={idx}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-white hover:bg-indigo-50 text-indigo-950 font-bold px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs transition-colors"
                title={p.note}
              >
                <span>{p.portal}</span>
                <ExternalLink className="w-3 h-3 text-indigo-500" />
              </a>
            ))}
          </div>

          {/* Collapsible Importer Box with AI Validation, Noise Sanitization and Strict Categorization */}
          {showImporter && (
            <div className="pt-3 border-t border-indigo-100 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-indigo-200/70 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                      Validador & Sanitizador de Anúncios com IA
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                        🛡️ Anti-Ruído de Crédito & JSON-LD Ativo
                      </span>
                    </h3>
                    <p className="text-[11px] text-indigo-900">
                      Higieniza propagandas de crédito bancário, detecta valor real de Arrendamento vs Venda e estrutura o Lead para o CRM.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomAdText(`Anúncios no CustoJusto.pt > Lisboa > Lisboa > Imobiliário > Apartamentos
Apartamento T3 no Parque dos Príncipes em Telheiras
2 800 €
Hoje, 19:02

PUB: Crédito pessoal a 160,08€ por mês para 10.000€. Faça o pedido!
Especificações:
Tipologia: T3
Área útil: 185 m²
Classe Energética: A
Ano de construção: 2008
Arrendamento acessível: Não
Tipo: Arrendar
Concelho: Lisboa
Freguesia: Carnide
Id do anúncio: 45217975
Descrição:
Arrenda-se apartamento T3. Numa das melhores zonas de Telheiras (Parque dos Príncipes), ideal para quem valoriza conforto, espaço e qualidade de vida. Em excelentes condições, totalmente mobilado, pronto a habitar.`);
                    }}
                    className="text-[11px] font-bold bg-white text-indigo-700 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-300 transition-colors shadow-2xs"
                  >
                    🇵🇹 Exemplo CustoJusto (Telheiras)
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <textarea
                  rows={3}
                  value={customAdText}
                  onChange={(e) => setCustomAdText(e.target.value)}
                  placeholder="Cole aqui o texto do anúncio com especificações, link ou JSON-LD do CustoJusto, OLX ou Idealista..."
                  className="flex-1 text-xs text-slate-900 font-medium p-2.5 rounded-xl border border-indigo-200 bg-white focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-2xs"
                />
                <button
                  onClick={handleParseCustomAd}
                  disabled={isParsingAd || !customAdText.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shrink-0 transition-all active:scale-95 whitespace-nowrap"
                >
                  {isParsingAd ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin text-amber-200" />
                      <span>Sanitizando & Validando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Validar Anúncio & Gerar Lead</span>
                    </>
                  )}
                </button>
              </div>

              {/* Resultado da Validação e Sanitização de IA */}
              {validationResult && (
                <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                  validationResult.confidenceLevel === 'HIGH' 
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950' 
                    : validationResult.confidenceLevel === 'MEDIUM'
                    ? 'bg-amber-50/90 border-amber-300 text-amber-950'
                    : 'bg-rose-50/90 border-rose-300 text-rose-950'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase border ${
                        validationResult.transactionType === 'RENT' 
                          ? 'bg-blue-100 text-blue-900 border-blue-300' 
                          : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      }`}>
                        {validationResult.transactionType === 'RENT' ? '🏠 Arrendamento / Aluguel' : '🏷️ Venda'}
                      </span>
                      <strong className="font-bold text-slate-900">
                        {validationResult.propertyLead?.title}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold bg-white px-2 py-0.5 rounded border border-slate-300">
                        Preço Real: <strong className="text-indigo-900">{validationResult.propertyLead?.price}</strong>
                      </span>
                      <span className={`font-black px-2 py-0.5 rounded ${
                        validationResult.confidenceLevel === 'HIGH' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                      }`}>
                        Confiança: {validationResult.confidenceScore}% ({validationResult.confidenceLevel})
                      </span>
                    </div>
                  </div>

                  {validationResult.noiseRemoved && (
                    <div className="bg-white/80 p-2 rounded-lg border border-slate-200 flex items-center gap-2 text-[11px] text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Higienização Concluída:</strong> Propagandas e ruídos removidos com sucesso. Lead pronto para abordagem!</span>
                    </div>
                  )}

                  {validationResult.divergenceWarning && (
                    <div className="bg-amber-100/90 p-2 rounded-lg border border-amber-300 text-[11px] text-amber-900 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span><strong>Alerta de Divergência:</strong> {validationResult.divergenceWarning}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area: Left (Leads List) + Right (Real Estate SDR Pitch & Objections) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 bg-slate-100/50">
          
          {/* Left Column: Property Leads List (5 cols) */}
          <div className="lg:col-span-5 border-r border-slate-200 flex flex-col bg-white overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700">
                {propertyLeads.length > 0 ? `${propertyLeads.length} Imóveis Encontrados` : 'Aguardando Busca'}
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                🛡️ Filtro Anti-Imobiliária Ativo
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {propertyLeads.length === 0 ? (
                <div className="text-center py-16 px-4 text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 text-sm">Nenhum imóvel carregado ainda</h4>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                      Selecione o país ({country}), cidade ({city}) e clique em <strong>&ldquo;Raspar Particulares&rdquo;</strong> para extrair anúncios direto dos donos.
                    </p>
                  </div>
                </div>
              ) : (
                propertyLeads.map((prop) => {
                  const isSelected = selectedProperty?.id === prop.id;

                  return (
                    <div
                      key={prop.id}
                      onClick={() => setSelectedProperty(prop)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 relative ${
                        isSelected 
                          ? 'bg-indigo-50/70 border-indigo-500 shadow-sm ring-1 ring-indigo-400' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                            {prop.portalLabel}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-sm mt-1 leading-snug line-clamp-1">
                            {prop.title}
                          </h4>
                          <span className="text-xs text-slate-500">{prop.zoneOrDistrict}, {prop.city}</span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-base font-black text-slate-900 block">{prop.price}</span>
                          <span className="text-[10px] font-bold text-emerald-700">Comissão: {prop.estimatedCommission}</span>
                        </div>
                      </div>

                      {/* Owner Details */}
                      <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-bold truncate">
                          <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{prop.ownerName}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900 shrink-0">{prop.phone}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {prop.postedDateStr}
                        </span>
                        <span className="font-bold text-indigo-600 flex items-center gap-0.5">
                          Score Captação: {prop.acquisitionOpportunityScore}%
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Property Dossier & Real Estate SDR Pitch (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-slate-50/60 overflow-y-auto p-4 sm:p-6 space-y-5">
            {selectedProperty ? (
              <>
                {/* Top Lead Info Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-md">
                          👑 Proprietário Pessoa Física (FSBO)
                        </span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {selectedProperty.portalLabel}
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-slate-900 mt-2 leading-tight">
                        {selectedProperty.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        {selectedProperty.addressSnippet} • {selectedProperty.bedrooms} • {selectedProperty.areaM2} m² • {selectedProperty.condition}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-xl font-black text-slate-900 block">{selectedProperty.price}</span>
                      <span className="text-xs font-black text-indigo-600">
                        Comissão Estimada: {selectedProperty.estimatedCommission}
                      </span>
                    </div>
                  </div>

                  {/* Owner Contact Actions Bar */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs text-emerald-900 font-medium">Proprietário Direto:</span>
                      <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                        {selectedProperty.ownerName}
                        <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                          {selectedProperty.phone}
                        </span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {onImportLead && (
                        <button
                          onClick={() => {
                            const leadToImport: Lead = {
                              id: `lead_${selectedProperty.id}`,
                              name: selectedProperty.title,
                              companyName: selectedProperty.ownerName,
                              category: `Imobiliário (${selectedProperty.portalLabel})`,
                              niche: `Imóveis / ${selectedProperty.propertyType}`,
                              city: selectedProperty.city,
                              district: selectedProperty.zoneOrDistrict,
                              state: selectedProperty.country === 'BR' ? 'SC' : selectedProperty.country === 'PT' ? 'Lisboa' : 'Madrid',
                              country: selectedProperty.country,
                              address: selectedProperty.addressSnippet || `${selectedProperty.zoneOrDistrict}, ${selectedProperty.city}`,
                              phone: selectedProperty.phone,
                              website: selectedProperty.originalUrl,
                              rating: 5,
                              reviewCount: 15,
                              photos: selectedProperty.photoUrl ? [selectedProperty.photoUrl] : [],
                              status: 'NOVO',
                              icpScore: 98,
                              icpTier: 'SCORE_A',
                              estimatedRevenue: selectedProperty.price,
                              businessSize: 'Alto Padrão',
                              identifiedPain: `Captação FSBO ativa em ${selectedProperty.portalLabel}. Comissão estimada: ${selectedProperty.estimatedCommission}`,
                              decisionMaker: {
                                name: selectedProperty.ownerName,
                                role: selectedProperty.advertiserType === 'PARTICULAR' ? 'Proprietário Direto (FSBO)' : 'Anunciante',
                                directPhone: selectedProperty.whatsappCleanPhone
                              },
                              isRealEstate: true,
                              isFsbo: selectedProperty.advertiserType === 'PARTICULAR',
                              daysOnMarket: selectedProperty.daysOnMarket || 0,
                              notes: `Tipo: ${selectedProperty.propertyType} | Preço: ${selectedProperty.price} | Quartos: ${selectedProperty.bedrooms || 'N/A'} | Área: ${selectedProperty.areaM2 || 'N/A'}m²\n\nDescrição: ${selectedProperty.descriptionSnippet}`,
                              createdAt: new Date().toISOString()
                            };

                            onImportLead(leadToImport);
                            setImportedSuccessLeadId(selectedProperty.id);
                            setTimeout(() => setImportedSuccessLeadId(null), 3000);
                          }}
                          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-all ${
                            importedSuccessLeadId === selectedProperty.id
                              ? 'bg-emerald-700 text-white'
                              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
                          }`}
                          title="Importar este lead para a lista principal do CRM e painel Hunter"
                        >
                          {importedSuccessLeadId === selectedProperty.id ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                              <span>Importado no CRM!</span>
                            </>
                          ) : (
                            <>
                              <DownloadCloud className="w-4 h-4" />
                              <span>+ Importar p/ CRM</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const text = selectedProperty.outreachScripts.whatsappIcebreaker;
                          window.open(`https://api.whatsapp.com/send?phone=${selectedProperty.whatsappCleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>WhatsApp</span>
                      </button>

                      <a
                        href={selectedProperty.originalUrl || selectedProperty.livePortalSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md transition-colors"
                        title="Abrir anúncio original no portal"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver Anúncio no {selectedProperty.portalLabel}</span>
                      </a>

                      {selectedProperty.googleDorkLiveUrl && (
                        <a
                          href={selectedProperty.googleDorkLiveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                          title="Buscar anúncios indexados no Google na última semana"
                        >
                          <Search className="w-3.5 h-3.5 text-slate-500" />
                          <span>Google Dork</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* 1. WhatsApp Script for Property Acquisition */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">Abordagem de WhatsApp para Angariação</h4>
                        <span className="text-xs text-slate-500">Mensagem sem agressividade focada em cliente comprador real</span>
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(selectedProperty.outreachScripts.whatsappIcebreaker, 'wa_re')}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors"
                    >
                      {copiedKey === 'wa_re' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'wa_re' ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>
                  </div>

                  <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 text-xs sm:text-sm text-emerald-950 font-medium whitespace-pre-line leading-relaxed">
                    {selectedProperty.outreachScripts.whatsappIcebreaker}
                  </div>
                </div>

                {/* 2. Instant Real Estate Objection Battlecards */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-black text-slate-900 text-sm">Quebra de Objeções de Proprietários (SDR Imobiliário)</h4>
                        <span className="text-xs text-slate-500">Respostas prontas para contornar as recusas mais comuns</span>
                      </div>
                    </div>
                  </div>

                  {/* Objection Selector */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs">
                    {[
                      { key: 'dontWantAgencies', label: '🚫 "Não Quero Imobiliárias"' },
                      { key: 'alreadyHaveBuyers', label: '👥 "Já Tenho Interessados"' },
                      { key: 'dontWantToPayCommission', label: '💰 "Não Pago Comissão"' },
                      { key: 'justTestingTheMarket', label: '🧪 "Só Testando o Preço"' },
                      { key: 'ifYouHaveBuyerBringHim', label: '🤝 "Se Tiver Cliente Traga"' }
                    ].map(tab => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveObjectionTab(tab.key)}
                        className={`py-2 px-2 text-center rounded-lg font-black transition-all truncate ${
                          activeObjectionTab === tab.key
                            ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Active Objection Text */}
                  {(() => {
                    const getScript = () => {
                      switch (activeObjectionTab) {
                        case 'dontWantAgencies': return selectedProperty.outreachScripts.objectionRebuttals.dontWantAgencies;
                        case 'alreadyHaveBuyers': return selectedProperty.outreachScripts.objectionRebuttals.alreadyHaveBuyers;
                        case 'dontWantToPayCommission': return selectedProperty.outreachScripts.objectionRebuttals.dontWantToPayCommission;
                        case 'justTestingTheMarket': return selectedProperty.outreachScripts.objectionRebuttals.justTestingTheMarket;
                        case 'ifYouHaveBuyerBringHim': return selectedProperty.outreachScripts.objectionRebuttals.ifYouHaveBuyerBringHim;
                        default: return selectedProperty.outreachScripts.objectionRebuttals.dontWantAgencies;
                      }
                    };

                    const script = getScript();

                    return (
                      <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-2">
                        <p className="text-xs sm:text-sm text-slate-900 font-semibold leading-relaxed">
                          &ldquo;{script}&rdquo;
                        </p>
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => copyToClipboard(script, 're_obj_copy')}
                            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-white px-3 py-1 rounded-lg border border-amber-300 transition-colors"
                          >
                            {copiedKey === 're_obj_copy' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 're_obj_copy' ? 'Copiado!' : 'Copiar Resposta'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 3. Cold Call 30s Script */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <h4 className="font-black text-slate-900 text-sm">Roteiro de Ligação Direta (Cold Call 30s)</h4>
                    </div>

                    <button
                      onClick={() => copyToClipboard(selectedProperty.outreachScripts.coldCall30sPitch, 'call_re')}
                      className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200"
                    >
                      {copiedKey === 'call_re' ? 'Copiado!' : 'Copiar Roteiro'}
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {selectedProperty.outreachScripts.coldCall30sPitch}
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <p className="text-sm">Selecione um imóvel na lista ao lado para ver os dados e scripts.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default RealEstateScraperModal;
