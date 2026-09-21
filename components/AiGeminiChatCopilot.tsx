import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Send, Bot, User, ArrowRight, CheckCircle2, 
  Flame, Building2, Home, MapPin, Phone, Globe, Mail, 
  Layers, Download, RefreshCw, BarChart3, ChevronRight, 
  ExternalLink, MessageSquare, PhoneCall, Zap, Play, 
  Filter, SlidersHorizontal, Trash2, ShieldCheck, Star,
  Compass, ArrowUpRight, Cpu, FileText, Check, Copy,
  HelpCircle, BookOpen, Lightbulb, Target, Clock, ArrowLeft,
  Calendar, CheckCircle
} from 'lucide-react';
import { Lead, BusinessProfile } from '../types';
import { RealEstatePropertyLead } from '../services/realEstateTypes';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'gemini';
  text: string;
  timestamp: string;
  type?: 'text' | 'leads_b2b' | 'leads_real_estate' | 'pipeline_stats' | 'copy_pitch' | 'wizard_step';
  wizardStep?: 'initial' | 'b2b_country' | 'b2b_niche' | 'b2b_city' | 'b2b_filters' | 'b2b_confirm' | 're_country' | 're_type' | 're_city' | 're_timeframe' | 're_confirm';
  leads?: Lead[];
  realEstateLeads?: RealEstatePropertyLead[];
  statsData?: any;
  copyPitch?: {
    leadName: string;
    decisionMaker: string;
    whatsapp: string;
    emailSubject: string;
    emailBody: string;
  };
  suggestedActions?: {
    label: string;
    sublabel?: string;
    icon?: string;
    actionType: string;
    payload?: any;
  }[];
}

const CHAT_STORAGE_KEY = 'CRIA_GEMINI_COPILOT_CHAT_V6_CLAUDE';
const CHAT_TTL_MS = 24 * 60 * 60 * 1000; // 24 Horas

interface CountryData {
  code: string;
  name: string;
  flag: string;
  currency: string;
  defaultCity: string;
  secondCity: string;
  thirdCity: string;
  coastalCity: string;
  cities: { name: string; tag?: string }[];
  b2bNiches: { name: string; keyword: string; icon: string; desc: string }[];
  portals: string;
}

function getCountryConfig(code?: string): CountryData {
  const c = (code || 'PT').toUpperCase();
  if (c === 'ES') {
    return {
      code: 'ES',
      name: 'Espanha',
      flag: '🇪🇸',
      currency: '€ (EUR)',
      defaultCity: 'Madrid',
      secondCity: 'Barcelona',
      thirdCity: 'Valência',
      coastalCity: 'Málaga',
      cities: [
        { name: 'Madrid', tag: 'Capital & Finanças' },
        { name: 'Barcelona', tag: 'Polo Econômico' },
        { name: 'Valência', tag: 'Costa Leste' },
        { name: 'Sevilha', tag: 'Sul / Andaluzia' },
        { name: 'Málaga', tag: 'Costa del Sol' },
        { name: 'Bilbao', tag: 'Norte Industrial' }
      ],
      b2bNiches: [
        { name: 'Clínicas Dentais', keyword: 'clínica dental', icon: '🦷', desc: 'Dentistas, ortodontia e implantes' },
        { name: 'Gimnasios & Fitness', keyword: 'gimnasio fitness', icon: '🏋️', desc: 'Academias, crossfit e pilates' },
        { name: 'Bufetes de Abogados', keyword: 'bufete de abogados', icon: '⚖️', desc: 'Advocacia corporativa e civil' },
        { name: 'Clínicas de Estética', keyword: 'clínica estética', icon: '✨', desc: 'Estética facial e dermatologia' },
        { name: 'Restaurantes Gourmet', keyword: 'restaurante gourmet', icon: '🍽️', desc: 'Alta gastronomia e hotelaria' }
      ],
      portals: 'Idealista.com, Fotocasa e Habitaclia'
    };
  }
  if (c === 'BR') {
    return {
      code: 'BR',
      name: 'Brasil',
      flag: '🇧🇷',
      currency: 'R$ (BRL)',
      defaultCity: 'São Paulo',
      secondCity: 'Rio de Janeiro',
      thirdCity: 'Belo Horizonte',
      coastalCity: 'Florianópolis',
      cities: [
        { name: 'Florianópolis', tag: 'Litoral Tech / SC' },
        { name: 'São Paulo', tag: 'Maior Mercado' },
        { name: 'Rio de Janeiro', tag: 'Zona Sul / Barra' },
        { name: 'Belo Horizonte', tag: 'Sudeste' },
        { name: 'Curitiba', tag: 'Sul' },
        { name: 'Porto Alegre', tag: 'Sul' }
      ],
      b2bNiches: [
        { name: 'Clínicas Odontológicas', keyword: 'clínica odontológica', icon: '🦷', desc: 'Dentistas, implantes e estética dental' },
        { name: 'Academias & Crossfit', keyword: 'academia fitness', icon: '🏋️', desc: 'Centros esportivos e studios' },
        { name: 'Escritórios de Advocacia', keyword: 'escritório de advocacia', icon: '⚖️', desc: 'Direito tributário, cível e trabalhista' },
        { name: 'Clínicas de Estética', keyword: 'clínica de estética', icon: '✨', desc: 'Harmonização e dermatologia' },
        { name: 'Construção Civil & Obras', keyword: 'engenharia civil construcao', icon: '🏗️', desc: 'Empreiteiras e arquitetura' }
      ],
      portals: 'Zap Imóveis, OLX Brasil e VivaReal'
    };
  }
  // Default Portugal
  return {
    code: 'PT',
    name: 'Portugal',
    flag: '🇵🇹',
    currency: '€ (EUR)',
    defaultCity: 'Lisboa',
    secondCity: 'Porto',
    thirdCity: 'Braga',
    coastalCity: 'Cascais',
    cities: [
      { name: 'Lisboa', tag: 'Capital & Grande Lisboa' },
      { name: 'Porto', tag: 'Norte & Polo Empresarial' },
      { name: 'Cascais', tag: 'Linha / Alto Padrão' },
      { name: 'Oeiras', tag: 'Tech Valley' },
      { name: 'Braga', tag: 'Minho / Crescimento' },
      { name: 'Setúbal', tag: 'Margem Sul' },
      { name: 'Coimbra', tag: 'Centro Universitário' },
      { name: 'Faro (Algarve)', tag: 'Sul / Litoral' }
    ],
    b2bNiches: [
      { name: 'Clínicas Dentárias', keyword: 'clínica dentária', icon: '🦷', desc: 'Médicos dentistas, ortodontia e implantes' },
      { name: 'Ginásios & Fitness', keyword: 'ginásio fitness', icon: '🏋️', desc: 'Clubes de fitness, pilates e personal' },
      { name: 'Escritórios de Advocacia', keyword: 'escritório de advocacia', icon: '⚖️', desc: 'Sociedades de advogados e consultoria' },
      { name: 'Clínicas de Estética', keyword: 'clínica de estética', icon: '✨', desc: 'Medicina estética e cuidados avançados' },
      { name: 'Restauração & Gastronomia', keyword: 'restaurante', icon: '🍽️', desc: 'Restaurantes, cafetarias e hotelaria' },
      { name: 'Engenharia & Arquitetura', keyword: 'gabinete arquitetura engenharia', icon: '🏗️', desc: 'Projetos, reabilitação e construção' }
    ],
    portals: 'Idealista.pt, OLX.pt, Imovirtual e Supercasa'
  };
}

function resolveEffectiveCountry(text: string, fallbackCountry: string = 'PT'): string {
  const t = text.toLowerCase();
  if (
    t.includes('portugal') || t.includes(' pt ') || t.endsWith(' pt') || t.startsWith('pt ') ||
    t.includes('lisboa') || t.includes('porto') || t.includes('braga') || t.includes('cascais') ||
    t.includes('sintra') || t.includes('oeiras') || t.includes('setubal') || t.includes('setúbal') ||
    t.includes('coimbra') || t.includes('faro') || t.includes('algarve') || t.includes('aveiro')
  ) {
    return 'PT';
  }
  if (
    t.includes('espanha') || t.includes('españa') || t.includes('spain') || t.includes(' es ') ||
    t.includes('madrid') || t.includes('barcelona') || t.includes('valencia') || t.includes('valência') ||
    t.includes('sevilla') || t.includes('sevilha') || t.includes('málaga') || t.includes('malaga')
  ) {
    return 'ES';
  }
  if (
    t.includes('brasil') || t.includes('brazil') || t.includes(' br ') ||
    t.includes('são paulo') || t.includes('sao paulo') || t.includes('rio de janeiro') ||
    t.includes('curitiba') || t.includes('belo horizonte') || t.includes('florianópolis') || t.includes('florianopolis')
  ) {
    return 'BR';
  }
  return fallbackCountry || 'PT';
}

function getInitialWelcomeMessages(country: string = 'PT', allowedModules: 'b2b' | 'real_estate' | 'all' = 'all'): ChatMessage[] {
  const config = getCountryConfig(country);

  const actions: { label: string; sublabel?: string; icon?: string; actionType: string; payload?: any }[] = [];

  if (allowedModules === 'b2b' || allowedModules === 'all') {
    actions.push({
      label: '🏢 Empresas & Negócios B2B',
      sublabel: `Mapear clínicas, academias, escritórios com donos, sócios e WhatsApp em ${config.name}`,
      actionType: 'wizard_select_b2b',
      payload: { country: config.code }
    });
  }

  if (allowedModules === 'real_estate' || allowedModules === 'all') {
    actions.push({
      label: '🏡 Imóveis Direto com Proprietário (FSBO)',
      sublabel: `Garimpar anúncios particulares sem comissão de agência nos portais de ${config.name}`,
      actionType: 'wizard_select_re',
      payload: { country: config.code }
    });
  }

  actions.push({
    label: '💡 Como Funciona o Assistente?',
    sublabel: 'Aprenda sobre o fluxo guiado, critérios de qualificação e métricas',
    actionType: 'guide_prompt_formula'
  });

  return [
    {
      id: 'claude-onboarding-1',
      sender: 'gemini',
      text: `Olá! Sou o seu **Copilot de Prospecção Inteligente**.

Vou guiar você passo a passo em um fluxo claro e estruturado, para você definir com calma cada parâmetro (país, nicho/transação, cidade e filtros) **sem buscas automáticas indesejadas**.

Para começarmos, **qual tipo de busca você gostaria de fazer hoje?**`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 'initial',
      suggestedActions: actions
    }
  ];
}

function loadSavedChatMessages(country: string = 'PT', allowedModules: 'b2b' | 'real_estate' | 'all' = 'all'): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.timestamp === 'number' && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        const isFresh = Date.now() - parsed.timestamp < CHAT_TTL_MS;
        const matchesCountry = !parsed.country || parsed.country.toUpperCase() === (country || 'PT').toUpperCase();
        if (isFresh && matchesCountry) {
          return parsed.messages;
        }
      }
    }
  } catch (e) {
    console.error('Erro ao ler mensagens salvas do chat:', e);
  }
  return getInitialWelcomeMessages(country, allowedModules);
}

interface AiGeminiChatCopilotProps {
  country?: string;
  businessProfile: BusinessProfile;
  leads: Lead[];
  filteredLeads?: Lead[];
  realEstateLeads: RealEstatePropertyLead[];
  isLoading?: boolean;
  allowedModules?: 'b2b' | 'real_estate' | 'all';
  userRole?: string;
  searchParams?: { keyword: string; city: string; district?: string; country: any };
  reCountry?: string;
  reCity?: string;
  onExecuteB2bSearch: (keyword: string, city?: string, country?: string) => void;
  onExecuteRealEstateSearch: (city: string, country?: string, transactionType?: 'SALE' | 'RENT', maxDaysAgo?: number, zone?: string) => void;
  onFilterScoreA: () => void;
  onFilterWithPhone: () => void;
  onExportCsv: () => void;
  onSwitchToTableView: () => void;
  onSwitchToKanbanView: () => void;
  onOpenSdrCockpit: (lead: Lead) => void;
  onOpenColdCallHunter: (lead: Lead) => void;
  onOpenCriahubDrawer: (lead: Lead) => void;
  onOpenOmnichannel: (lead: Lead, tab?: any) => void;
  onOpenSettings?: () => void;
  onOpenRealEstateModal?: () => void;
  onUpdateLeadStatus?: (id: string, status: Lead['status']) => void;
}

export const AiGeminiChatCopilot: React.FC<AiGeminiChatCopilotProps> = ({
  country = 'PT',
  businessProfile,
  leads = [],
  filteredLeads = [],
  realEstateLeads = [],
  isLoading = false,
  allowedModules = 'all',
  userRole,
  searchParams,
  reCountry,
  reCity,
  onExecuteB2bSearch,
  onExecuteRealEstateSearch,
  onFilterScoreA,
  onFilterWithPhone,
  onExportCsv,
  onSwitchToTableView,
  onSwitchToKanbanView,
  onOpenSdrCockpit,
  onOpenColdCallHunter,
  onOpenCriahubDrawer,
  onOpenOmnichannel,
  onOpenSettings,
  onOpenRealEstateModal,
  onUpdateLeadStatus
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return loadSavedChatMessages(country, allowedModules);
  });

  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentCountryConfig = getCountryConfig(country);

  // Estado do assistente com etapas do wizard
  const [wizardState, setWizardState] = useState<{
    step: 'idle' | 'b2b_country' | 'b2b_niche' | 'b2b_city' | 'b2b_filters' | 'b2b_confirm' | 're_country' | 're_type' | 're_city' | 're_timeframe' | 're_confirm';
    mode?: 'b2b' | 'real_estate' | null;
    country: string;
    niche?: string;
    nicheLabel?: string;
    city?: string;
    transactionType?: 'SALE' | 'RENT';
    timeframeLabel?: string;
    maxDaysAgo?: number;
    criteria?: string;
    criteriaLabel?: string;
  }>({
    step: 'idle',
    country: country || 'PT'
  });

  // Persistência automática das mensagens
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
          timestamp: Date.now(),
          country: country || 'PT',
          messages
        }));
      }
    } catch (e) {
      console.error('Erro ao persistir histórico do chat:', e);
    }
  }, [messages, country]);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Se novos leads B2B foram carregados após busca, exibe no chat
  const prevLeadsLengthRef = useRef(leads.length);
  useEffect(() => {
    if (leads.length > 0 && leads.length !== prevLeadsLengthRef.current) {
      const topLeads = leads.slice(0, 8);
      const scoreACount = leads.filter(l => l.icpTier === 'SCORE_A').length;
      
      const newMsg: ChatMessage = {
        id: `leads-batch-${Date.now()}`,
        sender: 'gemini',
        text: `✨ Encontrei e processei **${leads.length} empresas reais** com decisores mapeados e canais de contato! (${scoreACount} com Score A de alta conversão).`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: 'leads_b2b',
        leads: topLeads,
        suggestedActions: [
          { label: '⭐ Filtrar Apenas Score A', actionType: 'filter_score_a' },
          { label: '📱 Leads com WhatsApp Validado', actionType: 'filter_phone' },
          { label: '📊 Ver Tabela Completa', actionType: 'switch_table' },
          { label: '📥 Baixar em CSV', actionType: 'export_csv' },
          { label: '🔄 Iniciar Nova Prospecção', actionType: 'reset_wizard' }
        ]
      };
      setMessages(prev => [...prev, newMsg]);
    }
    prevLeadsLengthRef.current = leads.length;
  }, [leads]);

  // Se novos imóveis FSBO foram carregados
  const prevReLengthRef = useRef(realEstateLeads.length);
  useEffect(() => {
    if (realEstateLeads.length > 0 && realEstateLeads.length !== prevReLengthRef.current) {
      const topRe = realEstateLeads.slice(0, 6);
      const newMsg: ChatMessage = {
        id: `re-batch-${Date.now()}`,
        sender: 'gemini',
        text: `🏡 Garimpei **${realEstateLeads.length} imóveis diretamente com proprietários particulares (FSBO)** nos portais imobiliários!`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: 'leads_real_estate',
        realEstateLeads: topRe,
        suggestedActions: [
          { label: '📥 Exportar CSV dos Imóveis', actionType: 'export_csv' },
          { label: '🔄 Nova Captação Imobiliária', actionType: 'wizard_select_re', payload: { country: currentCountryConfig.code } },
          { label: '🏢 Alternar para Prospecção B2B', actionType: 'wizard_select_b2b', payload: { country: currentCountryConfig.code } }
        ]
      };
      setMessages(prev => [...prev, newMsg]);
    }
    prevReLengthRef.current = realEstateLeads.length;
  }, [realEstateLeads]);

  const handleResetChat = () => {
    const welcome = getInitialWelcomeMessages(country, allowedModules);
    setMessages(welcome);
    setWizardState({ step: 'idle', country: country || 'PT' });
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
        timestamp: Date.now(),
        country: country || 'PT',
        messages: welcome
      }));
    } catch (e) {
      console.error(e);
    }
  };

  // Funções de Passo do Wizard B2B
  const startB2bWizard = (targetCountry?: string) => {
    const activeCountry = targetCountry || wizardState.country || country || 'PT';
    setWizardState(prev => ({ ...prev, mode: 'b2b', country: activeCountry, step: 'b2b_country' }));

    const botReply: ChatMessage = {
      id: `bot-b2b-c-${Date.now()}`,
      sender: 'gemini',
      text: `🏢 **Excelente! Vamos estruturar sua busca de Empresas B2B.**

**Passo 1 de 4:** Em qual **país** você deseja prospectar?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 'b2b_country',
      suggestedActions: [
        { label: '🇵🇹 Portugal', sublabel: 'Mercado em Euros (€) • Lisboa, Porto, Cascais...', actionType: 'wizard_b2b_set_country', payload: { country: 'PT' } },
        { label: '🇪🇸 Espanha', sublabel: 'Mercado em Euros (€) • Madrid, Barcelona, Valência...', actionType: 'wizard_b2b_set_country', payload: { country: 'ES' } },
        { label: '🇧🇷 Brasil', sublabel: 'Mercado em Reais (R$) • Florianópolis, SP, RJ, BH...', actionType: 'wizard_b2b_set_country', payload: { country: 'BR' } }
      ]
    };
    setMessages(prev => [...prev, botReply]);
  };

  const askB2bNiche = (selectedCountry: string) => {
    const cfg = getCountryConfig(selectedCountry);
    setWizardState(prev => ({ ...prev, country: selectedCountry, step: 'b2b_niche' }));

    const botReply: ChatMessage = {
      id: `bot-b2b-n-${Date.now()}`,
      sender: 'gemini',
      text: `🎯 **País selecionado:** ${cfg.name} ${cfg.flag}.

**Passo 2 de 4:** Qual é o **nicho ou segmento** de empresas que deseja prospectar?

Escolha um dos segmentos recomendados abaixo ou **digite qualquer outro nicho no campo de texto**:`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 'b2b_niche',
      suggestedActions: [
        ...cfg.b2bNiches.map(n => ({
          label: `${n.icon} ${n.name}`,
          sublabel: n.desc,
          actionType: 'wizard_b2b_set_niche',
          payload: { keyword: n.keyword, label: n.name, country: selectedCountry }
        })),
        { label: '🌍 Trocar de País', actionType: 'wizard_select_b2b' }
      ]
    };
    setMessages(prev => [...prev, botReply]);
  };

  const askB2bCity = (selectedNicheKeyword: string, selectedNicheLabel: string, selectedCountry: string) => {
    const cfg = getCountryConfig(selectedCountry);
    setWizardState(prev => ({ 
      ...prev, 
      niche: selectedNicheKeyword, 
      nicheLabel: selectedNicheLabel, 
      country: selectedCountry,
      step: 'b2b_city' 
    }));

    const botReply: ChatMessage = {
      id: `bot-b2b-city-${Date.now()}`,
      sender: 'gemini',
      text: `📍 **Nicho definido:** ${selectedNicheLabel}.

**Passo 3 de 4:** Em qual **cidade, concelho ou zona** você deseja prospectar?

Escolha uma das praças com maior densidade empresarial em ${cfg.name} ou **digite qualquer cidade/bairro no chat**:`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 'b2b_city',
      suggestedActions: [
        ...cfg.cities.map(c => ({
          label: `📍 ${c.name}`,
          sublabel: c.tag,
          actionType: 'wizard_b2b_set_city',
          payload: { city: c.name, keyword: selectedNicheKeyword, nicheLabel: selectedNicheLabel, country: selectedCountry }
        })),
        { label: '✏️ Alterar Nicho', actionType: 'wizard_b2b_reask_niche', payload: { country: selectedCountry } }
      ]
    };
    setMessages(prev => [...prev, botReply]);
  };

  const askB2bFilters = (city: string, keyword: string, nicheLabel: string, selectedCountry: string) => {
    const cfg = getCountryConfig(selectedCountry);
    setWizardState(prev => ({
      ...prev,
      city,
      niche: keyword,
      nicheLabel,
      country: selectedCountry,
      step: 'b2b_filters'
    }));

    const botReply: ChatMessage = {
      id: `bot-b2b-f-${Date.now()}`,
      sender: 'gemini',
      text: `⚡ **Localidade:** ${city} (${cfg.name} ${cfg.flag}).

**Passo 4 de 4:** Qual o critério de qualificação você deseja priorizar?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 'b2b_filters',
      suggestedActions: [
        {
          label: '⚡ Padrão Ouro (WhatsApp Validado + Sócios)',
          sublabel: 'Recomendado: prioriza empresas com contato direto de sócios e diretores',
          actionType: 'wizard_b2b_set_filters',
          payload: { city, keyword, nicheLabel, country: selectedCountry, criteria: 'PADRAO_OURO', criteriaLabel: 'Padrão Ouro (WhatsApp + Sócios)' }
        },
        {
          label: '⭐ Apenas Score A (Alta Prioridade & Fit Elevado)',
          sublabel: 'Foco exclusivo nas oportunidades mais qualificadas e rentáveis',
          actionType: 'wizard_b2b_set_filters',
          payload: { city, keyword, nicheLabel, country: selectedCountry, criteria: 'SCORE_A', criteriaLabel: 'Apenas Score A (Fit Elevado)' }
        },
        {
          label: '🌐 Varredura Ampla (Todos os Leads Encontrados)',
          sublabel: 'Máximo volume de dados para prospecção em escala',
          actionType: 'wizard_b2b_set_filters',
          payload: { city, keyword, nicheLabel, country: selectedCountry, criteria: 'TODOS', criteriaLabel: 'Varredura Completa' }
        }
      ]
    };
    setMessages(prev => [...prev, botReply]);
  };

  const showB2bConfirmation = (city: string, keyword: string, nicheLabel: string, selectedCountry: string, criteria: string, criteriaLabel: string) => {
    const cfg = getCountryConfig(selectedCountry);
    setWizardState(prev => ({
      ...prev,
      city,
      niche: keyword,
      nicheLabel,
      country: selectedCountry,
      criteria,
      criteriaLabel,
      step: 'b2b_confirm'
    }));

    const botReply: ChatMessage = {
      id: `bot-b2b-confirm-${Date.now()}`,
      sender: 'gemini',
      text: `🚀 **Tudo configurado para sua Prospecção B2B!**

📋 **Resumo da Busca:**
• **País:** ${cfg.name} ${cfg.flag}
• **Nicho:** ${nicheLabel} (\`${keyword}\`)
• **Cidade:** ${city}
• **Critério:** ${criteriaLabel}

Deseja que eu dispare o robô de varredura agora para mapear donos, sócios e WhatsApp?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 'b2b_confirm',
      suggestedActions: [
        {
          label: '▶️ Iniciar Prospecção Agora',
          sublabel: `Buscar ${nicheLabel} em ${city} (${cfg.name})`,
          actionType: 'wizard_b2b_execute',
          payload: { city, keyword, country: selectedCountry }
        },
        {
          label: '✏️ Alterar Parâmetros',
          sublabel: 'Voltar ao início da prospecção B2B',
          actionType: 'wizard_select_b2b',
          payload: { country: selectedCountry }
        }
      ]
    };
    setMessages(prev => [...prev, botReply]);
  };

  // Funções de Passo do Wizard Imóveis FSBO
  const startRealEstateWizard = (targetCountry?: string) => {
    const activeCountry = targetCountry || wizardState.country || country || 'PT';
    setWizardState(prev => ({ ...prev, mode: 'real_estate', country: activeCountry, step: 're_country' }));

    const botReply: ChatMessage = {
      id: `bot-re-c-${Date.now()}`,
      sender: 'gemini',
      text: `🏡 **Excelente! Vamos configurar a Captação de Imóveis Direto com Proprietário (FSBO).**

**Passo 1 de 4:** Em qual **país** você deseja garimpar os portais imobiliários?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 're_country',
      suggestedActions: [
        { label: '🇵🇹 Portugal', sublabel: 'Idealista.pt, OLX.pt, Imovirtual • Euros (€)', actionType: 'wizard_re_set_country', payload: { country: 'PT' } },
        { label: '🇪🇸 Espanha', sublabel: 'Idealista.com, Fotocasa • Euros (€)', actionType: 'wizard_re_set_country', payload: { country: 'ES' } },
        { label: '🇧🇷 Brasil', sublabel: 'Zap Imóveis, OLX Brasil, VivaReal • Reais (R$)', actionType: 'wizard_re_set_country', payload: { country: 'BR' } }
      ]
    };
    setMessages(prev => [...prev, botReply]);
  };

  const askReType = (selectedCountry: string) => {
    const cfg = getCountryConfig(selectedCountry);
    setWizardState(prev => ({ ...prev, country: selectedCountry, step: 're_type' }));

    const botReply: ChatMessage = {
      id: `bot-re-t-${Date.now()}`,
      sender: 'gemini',
      text: `🔑 **País selecionado:** ${cfg.name} ${cfg.flag} (${cfg.portals}).

**Passo 2 de 4:** Qual é o **tipo de transação** que você deseja captar?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 're_type',
      suggestedActions: [
        {
          label: '🏠 Venda Direta com Proprietário',
          sublabel: 'Angariação com exclusividade, comissão cheia e maior valor',
          actionType: 'wizard_re_set_type',
          payload: { transactionType: 'SALE', country: selectedCountry }
        },
        {
          label: '🔑 Arrendamento / Aluguel Particular',
          sublabel: 'Gestão patrimonial, carteira recorrente e liquidez rápida',
          actionType: 'wizard_re_set_type',
          payload: { transactionType: 'RENT', country: selectedCountry }
        },
        { label: '🌍 Trocar de País', actionType: 'wizard_select_re' }
      ]
    };
    setMessages(prev => [...prev, botReply]);
  };

  const askReCity = (transactionType: 'SALE' | 'RENT', selectedCountry: string) => {
    const cfg = getCountryConfig(selectedCountry);
    setWizardState(prev => ({ 
      ...prev, 
      transactionType, 
      country: selectedCountry,
      step: 're_city' 
    }));

    const botReply: ChatMessage = {
      id: `bot-re-city-${Date.now()}`,
      sender: 'gemini',
      text: `📍 **Transação:** ${transactionType === 'SALE' ? 'Venda Direta Particular' : 'Arrendamento Particular'}.

**Passo 3 de 4:** Em qual **cidade, concelho ou zona** você quer garimpar os proprietários?

Escolha uma das praças com maior liquidez em ${cfg.name} ou **digite qualquer cidade/bairro no chat**:`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 're_city',
      suggestedActions: [
        ...cfg.cities.map(c => ({
          label: `📍 ${c.name}`,
          sublabel: c.tag,
          actionType: 'wizard_re_set_city',
          payload: { city: c.name, transactionType, country: selectedCountry }
        })),
        { label: '✏️ Alterar Tipo de Transação', actionType: 'wizard_re_reask_type', payload: { country: selectedCountry } }
      ]
    };
    setMessages(prev => [...prev, botReply]);
  };

  const askReTimeframe = (city: string, transactionType: 'SALE' | 'RENT', selectedCountry: string) => {
    const cfg = getCountryConfig(selectedCountry);
    setWizardState(prev => ({
      ...prev,
      city,
      transactionType,
      country: selectedCountry,
      step: 're_timeframe'
    }));

    const botReply: ChatMessage = {
      id: `bot-re-time-${Date.now()}`,
      sender: 'gemini',
      text: `⏱️ **Localidade:** ${city} (${cfg.name} ${cfg.flag}).

**Passo 4 de 4:** Qual a **antiguidade dos anúncios** que deseja filtrar nos portais?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 're_timeframe',
      suggestedActions: [
        {
          label: '⚡ Últimas 24 Horas (Oportunidade de Ouro)',
          sublabel: 'Seja o 1º consultor a ligar para o dono antes da concorrência',
          actionType: 'wizard_re_set_timeframe',
          payload: { city, transactionType, country: selectedCountry, maxDaysAgo: 1, timeframeLabel: 'Últimas 24 horas' }
        },
        {
          label: '📅 Até 3 Dias (Equilíbrio Ideal)',
          sublabel: 'Excelente combinação de frescor de anúncio e volume de imóveis',
          actionType: 'wizard_re_set_timeframe',
          payload: { city, transactionType, country: selectedCountry, maxDaysAgo: 3, timeframeLabel: 'Até 3 dias' }
        },
        {
          label: '🗓️ Até 7 Dias (Semana Corrente)',
          sublabel: 'Varredura ampla da última semana de publicações',
          actionType: 'wizard_re_set_timeframe',
          payload: { city, transactionType, country: selectedCountry, maxDaysAgo: 7, timeframeLabel: 'Até 7 dias' }
        },
        {
          label: '⏳ Mais de 15 a 30 Dias (Proprietários Cansados)',
          sublabel: 'Donos que tentaram vender sozinhos e agora aceitam mediação com mais facilidade',
          actionType: 'wizard_re_set_timeframe',
          payload: { city, transactionType, country: selectedCountry, maxDaysAgo: 30, timeframeLabel: '15 a 30 dias (Desgaste de Mercado)' }
        }
      ]
    };
    setMessages(prev => [...prev, botReply]);
  };

  const showReConfirmation = (city: string, transactionType: 'SALE' | 'RENT', selectedCountry: string, maxDaysAgo: number, timeframeLabel: string) => {
    const cfg = getCountryConfig(selectedCountry);
    setWizardState(prev => ({
      ...prev,
      city,
      transactionType,
      country: selectedCountry,
      maxDaysAgo,
      timeframeLabel,
      step: 're_confirm'
    }));

    const botReply: ChatMessage = {
      id: `bot-re-confirm-${Date.now()}`,
      sender: 'gemini',
      text: `🚀 **Tudo pronto para a Captação Imobiliária FSBO!**

📋 **Resumo dos Critérios:**
• **Portais:** ${cfg.portals} (${cfg.name} ${cfg.flag})
• **Transação:** ${transactionType === 'SALE' ? 'Venda Direta Particular' : 'Arrendamento Particular'}
• **Cidade:** ${city}
• **Antiguidade do Anúncio:** ${timeframeLabel}

Posso disparar o robô nos portais agora para extrair os contatos e telefones diretos dos proprietários?`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      type: 'wizard_step',
      wizardStep: 're_confirm',
      suggestedActions: [
        {
          label: '▶️ Iniciar Captação Agora',
          sublabel: `Garimpar particulares em ${city} (${cfg.name})`,
          actionType: 'wizard_re_execute',
          payload: { city, transactionType, country: selectedCountry, maxDaysAgo }
        },
        {
          label: '✏️ Alterar Parâmetros',
          sublabel: 'Voltar ao início da captação de imóveis',
          actionType: 'wizard_select_re',
          payload: { country: selectedCountry }
        }
      ]
    };
    setMessages(prev => [...prev, botReply]);
  };

  // Motor Central de Ações
  const handleExecuteAction = (action: { label: string; actionType: string; payload?: any }) => {
    const selectedCountry = action.payload?.country || wizardState.country || country || 'PT';

    switch (action.actionType) {
      case 'wizard_select_b2b': {
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: 'Quero buscar Empresas & Negócios B2B.',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        startB2bWizard(selectedCountry);
        break;
      }

      case 'wizard_b2b_set_country': {
        const chosenCountry = action.payload?.country || 'PT';
        const cfg = getCountryConfig(chosenCountry);
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `País escolhido: ${cfg.name} ${cfg.flag}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        askB2bNiche(chosenCountry);
        break;
      }

      case 'wizard_b2b_set_niche': {
        const kw = action.payload?.keyword || 'clínica dentária';
        const lbl = action.payload?.label || 'Clínicas';
        const c = action.payload?.country || wizardState.country || 'PT';
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `Nicho: ${lbl}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        askB2bCity(kw, lbl, c);
        break;
      }

      case 'wizard_b2b_reask_niche': {
        const c = action.payload?.country || wizardState.country || 'PT';
        askB2bNiche(c);
        break;
      }

      case 'wizard_b2b_set_city': {
        const city = action.payload?.city || 'Lisboa';
        const kw = action.payload?.keyword || wizardState.niche || 'clínica dentária';
        const lbl = action.payload?.nicheLabel || wizardState.nicheLabel || 'Empresas';
        const c = action.payload?.country || wizardState.country || 'PT';
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `Cidade: ${city}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        askB2bFilters(city, kw, lbl, c);
        break;
      }

      case 'wizard_b2b_set_filters': {
        const city = action.payload?.city || wizardState.city || 'Lisboa';
        const kw = action.payload?.keyword || wizardState.niche || 'clínica dentária';
        const lbl = action.payload?.nicheLabel || wizardState.nicheLabel || 'Empresas';
        const c = action.payload?.country || wizardState.country || 'PT';
        const crit = action.payload?.criteria || 'PADRAO_OURO';
        const critLabel = action.payload?.criteriaLabel || 'Padrão Ouro';
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `Critério: ${critLabel}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        showB2bConfirmation(city, kw, lbl, c, crit, critLabel);
        break;
      }

      case 'wizard_b2b_execute': {
        const city = action.payload?.city || wizardState.city || 'Lisboa';
        const kw = action.payload?.keyword || wizardState.niche || 'clínica dentária';
        const c = action.payload?.country || wizardState.country || 'PT';
        const cfg = getCountryConfig(c);

        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `Confirmado: Iniciar busca de ${wizardState.nicheLabel || kw} em ${city} (${cfg.name}).`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        const botReply: ChatMessage = {
          id: `bot-exec-${Date.now()}`,
          sender: 'gemini',
          text: `🚀 **Disparando robô de Prospecção B2B em ${city}, ${cfg.name} ${cfg.flag}...**

Consultando registros no Google Maps, enriquecendo decisores e testando canais de WhatsApp. Os resultados aparecerão aqui e na tabela a seguir!`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        };
        setMessages(prev => [...prev, userMsg, botReply]);
        onExecuteB2bSearch(kw, city, c);
        break;
      }

      // --- IMÓVEIS FSBO ---
      case 'wizard_select_re': {
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: 'Quero buscar Imóveis Direto com Proprietário (FSBO).',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        startRealEstateWizard(selectedCountry);
        break;
      }

      case 'wizard_re_set_country': {
        const chosenCountry = action.payload?.country || 'PT';
        const cfg = getCountryConfig(chosenCountry);
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `País escolhido: ${cfg.name} ${cfg.flag}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        askReType(chosenCountry);
        break;
      }

      case 'wizard_re_set_type': {
        const tType = action.payload?.transactionType || 'SALE';
        const c = action.payload?.country || wizardState.country || 'PT';
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `Transação: ${tType === 'SALE' ? 'Venda Direta' : 'Arrendamento Particular'}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        askReCity(tType, c);
        break;
      }

      case 'wizard_re_reask_type': {
        const c = action.payload?.country || wizardState.country || 'PT';
        askReType(c);
        break;
      }

      case 'wizard_re_set_city': {
        const city = action.payload?.city || 'Lisboa';
        const tType = action.payload?.transactionType || wizardState.transactionType || 'SALE';
        const c = action.payload?.country || wizardState.country || 'PT';
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `Cidade: ${city}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        askReTimeframe(city, tType, c);
        break;
      }

      case 'wizard_re_set_timeframe': {
        const city = action.payload?.city || wizardState.city || 'Lisboa';
        const tType = action.payload?.transactionType || wizardState.transactionType || 'SALE';
        const c = action.payload?.country || wizardState.country || 'PT';
        const maxDays = action.payload?.maxDaysAgo !== undefined ? action.payload.maxDaysAgo : 3;
        const tfLabel = action.payload?.timeframeLabel || 'Até 3 dias';
        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `Antiguidade: ${tfLabel}`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, userMsg]);
        showReConfirmation(city, tType, c, maxDays, tfLabel);
        break;
      }

      case 'wizard_re_execute': {
        const city = action.payload?.city || wizardState.city || 'Lisboa';
        const tType = action.payload?.transactionType || wizardState.transactionType || 'SALE';
        const c = action.payload?.country || wizardState.country || 'PT';
        const maxDays = action.payload?.maxDaysAgo !== undefined ? action.payload.maxDaysAgo : wizardState.maxDaysAgo || 3;
        const cfg = getCountryConfig(c);

        const userMsg: ChatMessage = {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: `Confirmado: Disparar varredura de imóveis particulares em ${city} (${cfg.name}).`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        };
        const botReply: ChatMessage = {
          id: `bot-re-exec-${Date.now()}`,
          sender: 'gemini',
          text: `🚀 **Disparando robô de Captação FSBO em ${city}, ${cfg.name} ${cfg.flag}...**

Filtrando anúncios de particulares nos portais **${cfg.portals}** publicados há ${wizardState.timeframeLabel || 'poucos dias'}. Os imóveis aparecerão diretamente no chat!`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        };
        setMessages(prev => [...prev, userMsg, botReply]);
        onExecuteRealEstateSearch(city, c, tType, maxDays);
        break;
      }

      case 'guide_prompt_formula': {
        const cfg = getCountryConfig(selectedCountry);
        const botReply: ChatMessage = {
          id: `bot-guide-${Date.now()}`,
          sender: 'gemini',
          text: `💡 **Como Funciona o Copilot de Prospecção:**

O assistente foi desenhado para ser **100% conversacional e transparente**. Você tem controle total em cada etapa:

1. **Escolha do País:** Selecione **Portugal 🇵🇹**, **Espanha 🇪🇸** ou **Brasil 🇧🇷**.
2. **Segmento ou Transação:** No B2B, você escolhe o nicho (Clínicas, Academias, etc.). No Imobiliário, escolhe Venda ou Arrendamento.
3. **Localidade Exata:** Escolha a cidade ou digite qualquer concelho ou bairro.
4. **Filtro & Antiguidade:** Defina se quer foco em WhatsApp, Score A, ou anúncios recentes nas últimas 24h.
5. **Confirmação:** Nenhuma busca é disparada antes de você revisar e confirmar!

👇 **Escolha por onde quer começar:**`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'wizard_step',
          suggestedActions: [
            { label: '🏢 Prospecção B2B Passo a Passo', actionType: 'wizard_select_b2b', payload: { country: cfg.code } },
            { label: '🏡 Captação Imóveis FSBO Passo a Passo', actionType: 'wizard_select_re', payload: { country: cfg.code } }
          ]
        };
        setMessages(prev => [...prev, botReply]);
        break;
      }

      case 'filter_score_a':
        onFilterScoreA();
        break;
      case 'filter_phone':
        onFilterWithPhone();
        break;
      case 'export_csv':
        onExportCsv();
        break;
      case 'switch_table':
        onSwitchToTableView();
        break;
      case 'switch_kanban':
        onSwitchToKanbanView();
        break;
      case 'reset_wizard':
        handleResetChat();
        break;
      default:
        handleSendMessage(action.label);
        break;
    }
  };

  // Processamento de texto digitado livremente pelo usuário
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');

    const qLower = query.toLowerCase();

    setTimeout(() => {
      // 1. Tratamento caso o usuário diga que não pediu determinado país ou que ainda não decidiu
      if (
        (qLower.includes('não pedi') || qLower.includes('nao pedi') || qLower.includes('pedi em portugal') || qLower.includes('não decidi') || qLower.includes('nao decidi') || qLower.includes('ainda não') || qLower.includes('ainda nao'))
      ) {
        const detectedCountry = resolveEffectiveCountry(query, 'PT');
        const cfg = getCountryConfig(detectedCountry);
        setWizardState(prev => ({ ...prev, country: detectedCountry, step: 'idle' }));

        const botReply: ChatMessage = {
          id: `bot-clarification-${Date.now()}`,
          sender: 'gemini',
          text: `Compreendido perfeitamente! Vamos manter o foco 100% em **${cfg.name} ${cfg.flag}**.

Como você ainda está definindo os detalhes, **vamos fazer isso passo a passo sem pressa e sem disparar buscas automáticas**.

Qual módulo você gostaria de configurar primeiro para ${cfg.name}?`,
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          type: 'wizard_step',
          suggestedActions: [
            { label: '🏢 Configurar Busca B2B', sublabel: `Passo a passo de empresas em ${cfg.name}`, actionType: 'wizard_select_b2b', payload: { country: cfg.code } },
            { label: '🏡 Configurar Captação FSBO', sublabel: `Passo a passo de imóveis particulares em ${cfg.name}`, actionType: 'wizard_select_re', payload: { country: cfg.code } },
            { label: '🌍 Trocar País', actionType: 'guide_prompt_formula' }
          ]
        };
        setMessages(prev => [...prev, botReply]);
        return;
      }

      // 2. Se o usuário estiver no meio de um passo do wizard, aproveita o texto digitado
      if (wizardState.step === 'b2b_niche') {
        const userNiche = query;
        askB2bCity(userNiche, userNiche, wizardState.country);
        return;
      }

      if (wizardState.step === 'b2b_city') {
        const userCity = query;
        askB2bFilters(userCity, wizardState.niche || 'empresas', wizardState.nicheLabel || userCity, wizardState.country);
        return;
      }

      if (wizardState.step === 're_city') {
        const userCity = query;
        askReTimeframe(userCity, wizardState.transactionType || 'SALE', wizardState.country);
        return;
      }

      // 3. Detecção de intenção inicial (B2B vs Imóveis) caso não esteja em nenhum passo
      const detectedCountry = resolveEffectiveCountry(query, wizardState.country || country || 'PT');
      const cfg = getCountryConfig(detectedCountry);

      if (qLower.includes('imóve') || qLower.includes('imove') || qLower.includes('apartamento') || qLower.includes('casa') || qLower.includes('fsbo') || qLower.includes('particular')) {
        startRealEstateWizard(detectedCountry);
        return;
      }

      if (qLower.includes('b2b') || qLower.includes('empresa') || qLower.includes('clínica') || qLower.includes('clinica') || qLower.includes('advocacia') || qLower.includes('academia') || qLower.includes('restaurante')) {
        startB2bWizard(detectedCountry);
        return;
      }

      // 4. Resposta padrão instrutiva
      const botReply: ChatMessage = {
        id: `bot-fallback-${Date.now()}`,
        sender: 'gemini',
        text: `Recebi sua mensagem: *" ${query} "*.

Para garantir uma busca assertiva e sem resultados genéricos em **${cfg.name} ${cfg.flag}**, como deseja prosseguir?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        type: 'wizard_step',
        suggestedActions: [
          { label: '🏢 Buscar Empresas B2B', actionType: 'wizard_select_b2b', payload: { country: cfg.code } },
          { label: '🏡 Buscar Imóveis Particulares (FSBO)', actionType: 'wizard_select_re', payload: { country: cfg.code } },
          { label: '🔄 Reiniciar Conversa', actionType: 'reset_wizard' }
        ]
      };
      setMessages(prev => [...prev, botReply]);
    }, 350);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] max-w-5xl mx-auto w-full bg-[#181614] border border-[#2D2925] rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Top Header Estilo Claude.ai (Limpo, Elegante, Tons Aconchegantes) */}
      <div className="px-4 sm:px-6 py-3.5 bg-[#1F1D1A] border-b border-[#2D2925] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 flex items-center justify-center text-white shadow-md shadow-amber-950/40 ring-1 ring-white/15">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-stone-100 tracking-tight flex items-center gap-1.5">
                <span>Claude & Gemini SDR Copilot</span>
                <span className="text-xs">{currentCountryConfig.flag}</span>
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                Guia Passo a Passo
              </span>
              <span className="hidden sm:inline-flex text-[9px] font-medium px-1.5 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700">
                Memória 24h
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Ambiente de prospecção guiada: selecione cada parâmetro com clareza antes de executar
            </p>
          </div>
        </div>

        {/* Botões de Ação Rápida no Header */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleResetChat}
            className="px-2.5 py-1.5 rounded-xl bg-[#282521] hover:bg-[#34302B] text-xs font-semibold text-stone-300 hover:text-white border border-[#3A352F] transition-colors flex items-center gap-1.5 shadow-sm"
            title="Reiniciar chat e abrir o menu inicial"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Reiniciar Guia</span>
          </button>

          {leads.length > 0 && (
            <button
              onClick={onSwitchToTableView}
              className="px-3 py-1.5 rounded-xl bg-[#282521] hover:bg-[#34302B] text-xs font-semibold text-stone-300 hover:text-white border border-[#3A352F] transition-colors flex items-center gap-1.5 shadow-sm"
              title="Abrir tabela completa com todos os dados"
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Tabela</span>
              <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded-md text-[10px] font-mono">
                {leads.length}
              </span>
            </button>
          )}

          <button
            onClick={onExportCsv}
            disabled={leads.length === 0 && realEstateLeads.length === 0}
            className="px-3 py-1.5 rounded-xl bg-[#282521] hover:bg-[#34302B] text-xs font-semibold text-stone-300 hover:text-white border border-[#3A352F] disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-sm"
            title="Exportar dados garimpados em formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Área de Mensagens do Chat com Rolagem Estilo Claude.ai */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} space-y-2 max-w-full`}
          >
            {/* Linha da Mensagem */}
            <div className={`flex items-start gap-3 max-w-[94%] sm:max-w-[88%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-tr from-stone-700 to-stone-600' 
                  : 'bg-gradient-to-br from-amber-600 to-orange-700 shadow-amber-950/40'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              </div>

              <div className={`rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed shadow-md ${
                msg.sender === 'user'
                  ? 'bg-amber-600/95 text-white rounded-tr-none font-medium'
                  : 'bg-[#211F1C] border border-[#2F2B26] text-stone-200 rounded-tl-none space-y-2'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <div className={`text-[10px] mt-1.5 flex items-center justify-end ${
                  msg.sender === 'user' ? 'text-amber-200' : 'text-stone-500'
                }`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>

            {/* Ações Sugeridas / Seletores do Wizard Passo a Passo Estilo Claude Cards */}
            {msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div className="w-full pl-11 pr-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-2xl">
                  {msg.suggestedActions.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleExecuteAction(action)}
                      className="text-left p-3 rounded-2xl bg-[#1D1B18] hover:bg-[#282521] border border-[#2F2B26] hover:border-amber-500/60 transition-all flex items-center justify-between group shadow-sm active:scale-[0.99]"
                    >
                      <div className="space-y-0.5 pr-2">
                        <div className="text-xs sm:text-sm font-semibold text-stone-200 group-hover:text-amber-300 transition-colors">
                          {action.label}
                        </div>
                        {action.sublabel && (
                          <div className="text-[11px] text-stone-400 leading-snug">
                            {action.sublabel}
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-amber-400 shrink-0 group-hover:translate-x-0.5 transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Renderização de Cards de Leads B2B embutidos no Chat */}
            {msg.type === 'leads_b2b' && msg.leads && msg.leads.length > 0 && (
              <div className="w-full pl-11 pr-2 space-y-3 mt-2">
                <div className="flex items-center justify-between text-xs text-stone-400 font-semibold px-1">
                  <span>Empresas Encontradas com Decisores Mapeados:</span>
                  <span className="text-amber-400 font-mono">{msg.leads.length} exibidos</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {msg.leads.map((lead) => {
                    const decName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Decisor Mapeado';
                    const decRole = lead.decisionMaker?.role || lead.bantPlus?.authority?.role || 'Administrador / Sócio';
                    const phoneToCall = lead.decisionMaker?.directPhone || lead.phone;
                    const cleanPhone = phoneToCall ? phoneToCall.replace(/\D/g, '') : '';

                    return (
                      <div
                        key={lead.id}
                        className="bg-[#1E1C19] border border-[#2F2B26] hover:border-amber-500/50 rounded-2xl p-4 transition-all hover:shadow-xl hover:shadow-amber-950/20 flex flex-col justify-between space-y-3 group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                  lead.icpTier === 'SCORE_A' 
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                                    : lead.icpTier === 'SCORE_B'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-stone-800 text-stone-300'
                                }`}>
                                  {lead.icpTier || 'SCORE_B'} • Fit {lead.icpScore}%
                                </span>
                                {lead.intentPriority === 'HIGH' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                    <Flame className="w-2.5 h-2.5 fill-rose-500 text-rose-500 animate-pulse" />
                                    Prioritário
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-bold text-stone-100 mt-1 group-hover:text-amber-300 transition-colors line-clamp-1">
                                {lead.name}
                              </h4>
                              <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-stone-500 shrink-0" />
                                <span>{lead.city || 'Cidade'} • {lead.category}</span>
                              </p>
                            </div>

                            {lead.rating > 0 && (
                              <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-xl text-amber-300 text-xs font-bold shrink-0">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{lead.rating}</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 p-2.5 bg-[#141311] border border-[#2D2925] rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-stone-400 font-medium">Decisor:</span>
                              <span className="text-stone-100 font-bold truncate max-w-[160px]">{decName}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-stone-500">Função:</span>
                              <span className="text-amber-300 font-semibold truncate max-w-[160px]">{decRole}</span>
                            </div>
                            {phoneToCall && (
                              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-800">
                                <span className="text-stone-400 font-medium flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-emerald-400" /> Telefone:
                                </span>
                                <span className="text-emerald-400 font-mono font-bold">{phoneToCall}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-stone-800 flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1">
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                  lead.outreach?.whatsapp?.option1Curiosity || `Olá ${decName}, tudo bem? Gostaria de conversar com você sobre a ${lead.name}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                                title="Abrir WhatsApp com Cópia Pronta"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp</span>
                              </a>
                            )}

                            <button
                              onClick={() => onOpenColdCallHunter(lead)}
                              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Abrir Teleprompter de Ligação Fria"
                            >
                              <PhoneCall className="w-3 h-3 text-amber-400" />
                              <span className="hidden sm:inline">Ligação</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => onOpenSdrCockpit(lead)}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
                              title="Abrir Cockpit com todas as estratégias"
                            >
                              <Zap className="w-3 h-3" />
                              <span>Cockpit</span>
                            </button>

                            <button
                              onClick={() => onOpenCriahubDrawer(lead)}
                              className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl transition-colors"
                              title="CRM Drawer & Copy"
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Renderização de Imóveis FSBO no Chat */}
            {msg.type === 'leads_real_estate' && msg.realEstateLeads && msg.realEstateLeads.length > 0 && (
              <div className="w-full pl-11 pr-2 space-y-3 mt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {msg.realEstateLeads.map((re) => {
                    const portalName = re.portalLabel || re.portalSource || 'Portal';
                    const cityStr = re.city || (re as any).location?.city || 'Localidade';
                    const zoneStr = re.zoneOrDistrict || (re as any).location?.zone || '';
                    const ownerStr = re.ownerName || (re as any).advertiser?.name || 'Proprietário Particular';
                    const phoneStr = re.phone || (re as any).advertiser?.phone || '';
                    const cleanPhone = re.whatsappCleanPhone || (phoneStr ? phoneStr.replace(/\D/g, '') : '');
                    const priceDisplay = re.price || (re as any).priceFormatted || 'Sob Consulta';

                    return (
                      <div
                        key={re.id}
                        className="bg-[#1E1C19] border border-[#2F2B26] hover:border-amber-500/50 rounded-2xl p-4 transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                              {portalName} • FSBO DIRETO
                            </span>
                            <h4 className="text-sm font-bold text-stone-100 mt-1 line-clamp-1">
                              {re.title}
                            </h4>
                            <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-stone-500 shrink-0" />
                              <span>{cityStr} {zoneStr ? `• ${zoneStr}` : ''}</span>
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-emerald-400 font-mono">
                              {priceDisplay}
                            </div>
                            <span className="text-[10px] text-stone-400">
                              {re.transactionType === 'SALE' ? 'Venda Direta' : 'Arrendamento'}
                            </span>
                          </div>
                        </div>

                        <div className="p-2 bg-[#141311] rounded-xl border border-[#2D2925] flex items-center justify-between text-xs">
                          <span className="text-stone-400 font-medium">Proprietário:</span>
                          <span className="text-stone-100 font-bold truncate max-w-[170px]">{ownerStr}</span>
                        </div>

                        {phoneStr && (
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-800">
                            <span className="text-xs font-mono text-emerald-400 font-bold">
                              {phoneStr}
                            </span>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                  `Olá! Vi o anúncio do seu imóvel (${re.title}) e gostaria de conversar diretamente com você.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>WhatsApp Direto</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading Indicator Suave */}
        {isLoading && (
          <div className="flex items-start gap-3 pl-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white shrink-0 animate-spin">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div className="bg-[#211F1C] border border-amber-500/30 rounded-2xl rounded-tl-none p-4 text-xs text-stone-300 flex items-center gap-3 shadow-lg">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Executando varredura em tempo real com validação e sem dados fictícios...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões Rápidas Deslizáveis (Carrossel Horizontal Acima do Input) */}
      <div className="px-3 sm:px-6 py-2 bg-[#1B1916] border-t border-[#2D2925] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-bold uppercase text-stone-500 shrink-0 hidden sm:inline">
          💡 Rápido:
        </span>
        <button
          onClick={() => handleExecuteAction({ label: '🏢 Empresas B2B', actionType: 'wizard_select_b2b', payload: { country: currentCountryConfig.code } })}
          className="px-2.5 py-1 rounded-xl bg-[#25221E] hover:bg-[#302C26] text-stone-300 text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
        >
          <span>🏢 Passo a Passo B2B</span>
        </button>
        <button
          onClick={() => handleExecuteAction({ label: '🏡 Imóveis FSBO', actionType: 'wizard_select_re', payload: { country: currentCountryConfig.code } })}
          className="px-2.5 py-1 rounded-xl bg-[#25221E] hover:bg-[#302C26] text-stone-300 text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
        >
          <span>🏡 Passo a Passo Imóveis</span>
        </button>
        <button
          onClick={() => handleExecuteAction({ label: '💡 Como Funciona', actionType: 'guide_prompt_formula', payload: { country: currentCountryConfig.code } })}
          className="px-2.5 py-1 rounded-xl bg-[#25221E] hover:bg-[#302C26] text-stone-300 text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
        >
          <span>💡 Dicas & Filtros</span>
        </button>
        <button
          onClick={() => handleResetChat()}
          className="px-2.5 py-1 rounded-xl bg-[#25221E] hover:bg-[#302C26] text-amber-400 text-xs font-medium shrink-0 transition-colors flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Input de Chat Fixo na Base (Estilo Claude Minimalista e Confortável) */}
      <div className="p-3 sm:p-4 bg-[#1A1816] border-t border-[#2D2925]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              wizardState.step === 'b2b_niche' 
                ? 'Digite o nicho de empresa desejado...' 
                : wizardState.step === 'b2b_city' || wizardState.step === 're_city'
                ? 'Digite a cidade, concelho ou bairro...'
                : `Converse com o Copilot ou escolha as opções acima...`
            }
            className="w-full bg-[#121110] border border-[#2D2925] focus:border-amber-500 rounded-2xl pl-4 pr-12 py-3.5 text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 shadow-inner transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 p-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl disabled:opacity-30 transition-all shadow-md shadow-amber-950/40 active:scale-95"
            title="Enviar mensagem para o Copilot"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
