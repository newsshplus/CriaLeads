import { Lead, BusinessProfile } from '../types';
import { searchRealBusinesses, RealBusiness } from './letscrapeService';
import { searchFreeApolloB2bLeads, FreeB2bSearchParams, extractCleanBrandName } from './freeB2bProspectorService';
import { searchViaDuckDuckGoHtml } from './agentReachService';
import { checkLeadStatus, getContactedHistory } from './storageService';
import { calculateLeadRoiRecommendation } from './roiRecommendationService';
import { OmniAssertiveValidatorService } from './omniAssertiveValidatorService';
import { getCurrencyConfig } from './countryService';

export interface SimultaneousSearchParams {
  keyword: string;
  country: string;
  city: string;
  district?: string;
  roleFilter?: 'ALL' | 'OWNERS' | 'MANAGERS' | 'COMMERCIAL';
  businessProfile: BusinessProfile;
  targetCount?: number;
  signal?: AbortSignal;
  onProgress?: (step: string) => void;
}

export interface SimultaneousSearchResult {
  leads: Lead[];
  totalFound: number;
  uniqueCount: number;
  totalDaysPlanned: number; // Quantos dias de meta (5/dia) foram garantidos
  dailyBatchesCount: number;
  hubsQueried: string[];
  sourcesQueried: string[];
  executionTimeMs: number;
  summary: string;
}

/**
 * Normaliza o nome da empresa para deduplicação sem repetições
 */
export function normalizeCompanyKey(name: string): string {
  if (!name) return '';
  return extractCleanBrandName(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Normaliza o domínio para deduplicação
 */
export function normalizeDomainKey(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '').toLowerCase().trim();
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase().trim();
  }
}

/**
 * Normaliza telefone pegando apenas os últimos 8 dígitos numéricos
 */
export function normalizePhoneKey(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 8) {
    return digits.slice(-8);
  }
  return digits;
}

/**
 * Mapeia os principais polos/bairros comerciais de uma cidade para busca paralela multilocal
 */
export function getCityCommercialHubs(city: string, country: string, district?: string): string[] {
  const normCity = (city || '').toLowerCase().trim();

  if (district && district !== 'Todas' && district.trim().length > 2) {
    return [district.trim(), `${city} Centro`, `${city} Comercial`];
  }

  if (normCity.includes('florianopolis') || normCity.includes('florianópolis')) {
    return ['Centro', 'Saco Grande / SC-401', 'Itacorubi / Parque Tecnológico', 'Jurerê Internacional', 'Estreito / Continente'];
  }
  if (normCity.includes('são paulo') || normCity.includes('sao paulo')) {
    return ['Avenida Paulista & Jardins', 'Faria Lima & Itaim Bibi', 'Pinheiros & Vila Olímpia', 'Tatuapé & Mooca', 'Santana & Zona Norte'];
  }
  if (normCity.includes('rio de janeiro')) {
    return ['Centro / Carioca', 'Barra da Tijuca', 'Botafogo & Ipanema', 'Tijuca & Zona Norte'];
  }
  if (normCity.includes('curitiba')) {
    return ['Batel', 'Centro Cívico', 'Ecoville / Mossunguê', 'Água Verde', 'Cabral'];
  }
  if (normCity.includes('belo horizonte')) {
    return ['Savassi', 'Lourdes', 'Belvedere & Vila da Serra', 'Funcionários', 'Barro Preto'];
  }
  if (normCity.includes('porto alegre')) {
    return ['Moinhos de Vento', 'Bela Vista', 'Carlos Gomes', 'Menino Deus'];
  }
  if (normCity.includes('joinville')) {
    return ['América', 'Distrito Industrial', 'Centro', 'Glória'];
  }
  if (normCity.includes('campinas')) {
    return ['Cambuí', 'Taquaral', 'Barão Geraldo / Polo Tecnológico', 'Nova Campinas'];
  }
  if (normCity.includes('lisboa')) {
    return ['Avenidas Novas & Saldanha', 'Parque das Nações', 'Baixa & Chiado', 'Campo de Ourique & Amoreiras', 'Oeiras & Taguspark'];
  }
  if (normCity.includes('porto')) {
    return ['Boavista & Avenida da França', 'Foz do Douro', 'Baixa do Porto', 'Matosinhos & Leça', 'Vila Nova de Gaia'];
  }

  // Fallback para qualquer cidade: divide em 3 sub-regiões comerciais
  return [
    city,
    `${city} Centro`,
    `${city} Polo Empresarial / Comercial`,
    `${city} Zona Sul / Bairros Nobres`
  ];
}

/**
 * Converte um RealBusiness do Google Maps para o formato Lead
 */
function convertRealBusinessToLead(
  b: RealBusiness,
  keyword: string,
  city: string,
  country: string,
  currencySymbol: string,
  batchId: string,
  batchName: string,
  formattedDate: string,
  hubName: string
): Lead {
  const rating = b.rating || 4.7;
  const reviews = b.reviews || 25;
  const isHighRep = rating >= 4.7 && reviews >= 20;
  const icpScore = Math.min(98, Math.max(72, Math.round(rating * 16 + Math.min(reviews, 100) * 0.15)));
  const icpTier = icpScore >= 85 ? 'SCORE_A' : 'SCORE_B';

  const cleanName = extractCleanBrandName(b.name);

  return {
    id: b.id || `lead-simul-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: cleanName,
    category: b.category || keyword,
    description: b.description || `Empresa estabelecida em ${hubName}, ${city} com forte presença local.`,
    address: b.address || `${hubName}, ${city} - ${country}`,
    city: b.city || city,
    district: b.district || hubName,
    country: b.country || country,
    website: b.website && b.website.startsWith('http') ? b.website : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' ' + city)}`,
    phone: b.phone || '',
    email: b.email || '',
    rating: rating,
    reviews: reviews,
    googleMapsLink: b.googleMapsLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanName + ' ' + city)}`,
    score: icpScore,
    icpScore: icpScore,
    icpTier: icpTier,
    intentScore: Math.min(95, icpScore + 2),
    intentPriority: icpScore >= 85 ? 'HIGH' : 'MEDIUM',
    identifiedPain: `Otimização de conversão digital, aceleração de atendimento no WhatsApp e automação de captação de clientes.`,
    suggestedAction: `Ligar para o Decisor Comercial / Sócio apresentando diagnóstico de captação e plano de melhorias mensais.`,
    digitalGaps: ['Site com oportunidade de aceleração móvel', 'Sem qualificação automática de leads no WhatsApp 24/7', 'Potencial de expansão em tráfego local'],
    budgetMaturity: isHighRep ? 'Alta' : 'Média',
    decisionMaker: {
      name: `Diretoria Executiva / Sócio`,
      role: 'Sócio-Proprietário / Decisor',
      roleCategory: 'DONO_CEO_SOCIO',
      directPhone: b.phone || '',
      directEmail: b.email || '',
      linkedinDirectSearch: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(cleanName + ' ' + city + ' sócio OR diretor OR proprietário')}`,
      googleDorkUrl: `https://www.google.com/search?q=${encodeURIComponent('site:linkedin.com/in/ "' + cleanName + '" (sócio OR dono OR diretor OR proprietário)')}`
    },
    outreach: {
      whatsapp: {
        option1Curiosity: `Olá, tudo bem? Acompanhando o mercado de ${keyword} em ${city}, notei a alta reputação da ${cleanName} (${rating}⭐). Preparamos uma análise de 2 minutos sobre melhorias práticas no funil de captação de vocês. Poderia te enviar por aqui?`,
        option2RoiDirect: `Olá! Identificamos 3 gargalos de conversão no ecossistema digital da ${cleanName} que podem estar vazando potenciais clientes todo mês. Teria 3 minutos para falarmos sobre como resolver isso?`
      },
      email: {
        subject: `Diagnóstico de Captação & Melhorias Comerciais — ${cleanName}`,
        bodyAida: `Olá,\n\nIdentificamos que a ${cleanName} possui excelente posicionamento em ${city}, mas detectamos oportunidades imediatas para dobrar a retenção de contatos digitais via automação.\n\nPodemos apresentar um plano prático esta semana?`,
        bodyPas: `Olá,\n\nMuitas empresas do segmento de ${keyword} enfrentam perda de até 40% dos interessados por falta de resposta instantânea 24/7.\n\nDesenvolvemos um fluxo de resposta e melhoria contínua que estanca esse vazamento.\n\nFaz sentido uma conversa de 10 minutos?`
      },
      coldCall: {
        iceBreaker5s: `Olá, bom dia! Aqui é do time de diagnóstico comercial. Gostaria de falar com o responsável pela expansão ou sócio da ${cleanName}, por favor.`,
        anchorQuestion: `Notei o volume expressivo de clientes que vocês atendem em ${city}. Vocês já possuem um sistema que atende e qualifica esses contatos instantaneamente 24 horas por dia?`,
        pitch15s: `Ajudamos empresas do setor de ${keyword} a transformar visitas e ligações perdidas em contratos fechados com melhorias mensais garantidas.`
      }
    },
    webhookPayloads: {
      criahubCrmSync: {
        leadId: b.id || `lead-${Date.now()}`,
        companyName: cleanName,
        contactName: 'Decisor Comercial',
        phone: b.phone || '',
        email: b.email || '',
        icpTier: icpTier,
        score: icpScore,
        niche: keyword,
        location: `${city}, ${country}`,
        suggestedService: 'Plano Mensal de Melhoria Contínua & Agente IA WhatsApp',
        status: 'Prospecção Fria'
      },
      hubspotCrmTask: {
        taskName: `Ligar para ${cleanName} (Meta Diária 5 Leads)`,
        company: cleanName,
        contactName: 'Decisor Comercial',
        priority: icpTier === 'SCORE_A' ? 'HIGH' : 'MEDIUM',
        dealStage: 'Prospecção Fria',
        callScriptNotes: `Ligar com foco na dor de qualificação de leads e plano de mensalidade de serviços.`,
        identifiedPain: `Otimização de conversão e captação digital`,
        dueDate: new Date(Date.now() + 86400000).toISOString()
      }
    },
    intentScore: icpScore,
    urgencyFactor: `Empresa com alta demanda em ${city} necessitando de blindagem de atendimento.`,
    keyFlaws: ['Atendimento manual com tempo de resposta elevado', 'Oportunidade de landing page de alta conversão', 'Falta de cadência omnichannel'],
    status: 'new',
    originApi: 'rapidapi_google_maps',
    originApiLabel: `Google Maps (${hubName}) + OSINT Simultâneo`,
    batchId,
    batchName,
    capturedAt: formattedDate
  };
}

/**
 * MOTOR DE BUSCA SIMULTÂNEA MULTILOCAL & MULTI-FONTES
 * - Executa em paralelo (Promise.allSettled) no Google Maps (múltiplos polos/bairros), Apollo/LinkedIn OSINT e Web Crawler
 * - Faz deduplicação cirúrgica sem repetição de empresas (telefone, domínio e nome normalizado)
 * - Checa histórico global de contatos (Anti-Queimação: avisa se já foi contatado anteriormente)
 * - Programa a meta diária (5 leads/dia), dividindo os leads qualificados em lotes diários (Dia 1, Dia 2... até cobrir todos)
 */
export async function searchSimultaneousMultiSourceLeads(
  params: SimultaneousSearchParams
): Promise<SimultaneousSearchResult> {
  const startTime = Date.now();
  const { keyword, country, city, district, roleFilter = 'ALL', businessProfile, signal, onProgress } = params;
  const targetCount = params.targetCount || 50;
  const currency = getCurrencyConfig(country);

  const now = new Date();
  const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  const batchId = `batch-simul-${now.getTime()}`;
  const batchName = `Busca Simultânea: ${keyword} — ${city} (${country})`;

  const hubs = getCityCommercialHubs(city, country, district);
  const primaryHubs = hubs.slice(0, 3); // Top 3 polos simultâneos

  onProgress?.(`1/4 Disparando busca simultânea em ${primaryHubs.length} polos de ${city} + Apollo/LinkedIn OSINT + Google Maps...`);

  // =========================================================================
  // 1. DISPARO SIMULTÂNEO EM PARALELO (Promise.allSettled)
  // =========================================================================

  const gmapsPromises = primaryHubs.map((hub, idx) => {
    return searchRealBusinesses({
      keyword,
      country,
      location: city,
      district: hub,
      radius: 20,
      strictMode: false,
      limit: 18,
      signal
    }).catch(err => {
      console.warn(`[Simultâneo] Erro no polo ${hub}:`, err?.message || err);
      return { businesses: [] as RealBusiness[], engineUsed: 'none', latencyMs: 0 };
    });
  });

  const apolloParams: FreeB2bSearchParams = {
    keyword,
    country,
    city,
    district: primaryHubs[0],
    roleFilter,
    perPage: 25
  };

  const apolloPromise = searchFreeApolloB2bLeads(apolloParams, businessProfile, signal).catch(err => {
    console.warn(`[Simultâneo] Erro no motor Apollo/LinkedIn:`, err?.message || err);
    return { leads: [] as Lead[], searchSummary: '' };
  });

  const webDorkQuery = `${keyword} ${city} ${country} contato telefone`;
  const webCrawlerPromise = searchViaDuckDuckGoHtml(webDorkQuery, 15, signal).catch(() => []);

  // Executa tudo ao mesmo tempo
  const [gmapsResultsSettled, apolloResultSettled, webResultsSettled] = await Promise.allSettled([
    Promise.allSettled(gmapsPromises),
    apolloPromise,
    webCrawlerPromise
  ]);

  onProgress?.(`2/4 Agregando resultados de todos os polos e executando deduplicação anti-repetição...`);

  // =========================================================================
  // 2. COLETA E NORMALIZAÇÃO DE TODOS OS RESULTADOS
  // =========================================================================

  const rawCandidateLeads: Lead[] = [];

  // Coleta Google Maps dos vários polos
  if (gmapsResultsSettled.status === 'fulfilled') {
    gmapsResultsSettled.value.forEach((res, hubIdx) => {
      if (res.status === 'fulfilled') {
        const hubName = primaryHubs[hubIdx] || city;
        const businesses = res.value.businesses || [];
        businesses.forEach(b => {
          rawCandidateLeads.push(convertRealBusinessToLead(
            b,
            keyword,
            city,
            country,
            currency.symbol,
            batchId,
            batchName,
            formattedDate,
            hubName
          ));
        });
      }
    });
  }

  // Coleta Apollo / LinkedIn OSINT
  if (apolloResultSettled.status === 'fulfilled' && apolloResultSettled.value.leads) {
    apolloResultSettled.value.leads.forEach(l => {
      rawCandidateLeads.push({
        ...l,
        batchId,
        batchName,
        capturedAt: formattedDate,
        originApiLabel: l.originApiLabel || 'Apollo.io + LinkedIn OSINT'
      });
    });
  }

  // Coleta Web Crawler
  if (webResultsSettled.status === 'fulfilled' && Array.isArray(webResultsSettled.value)) {
    webResultsSettled.value.forEach(b => {
      rawCandidateLeads.push(convertRealBusinessToLead(
        b,
        keyword,
        city,
        country,
        currency.symbol,
        batchId,
        batchName,
        formattedDate,
        'Web Crawler'
      ));
    });
  }

  onProgress?.(`3/4 Deduplicando por telefone, domínio e razão social (ZERO repetições na busca)...`);

  // =========================================================================
  // 3. DEDUPLICAÇÃO CIRÚRGICA RIGOROSA (Sem Repetições na Mesma Busca)
  // =========================================================================

  const seenPhones = new Set<string>();
  const seenDomains = new Set<string>();
  const seenNames = new Set<string>();
  const uniqueLeadsMap = new Map<string, Lead>();

  for (const candidate of rawCandidateLeads) {
    const nameKey = normalizeCompanyKey(candidate.name);
    const domainKey = normalizeDomainKey(candidate.website);
    const phoneKey = normalizePhoneKey(candidate.phone);

    // Evita chaves vazias ou genéricas
    const isDomainGeneric = !domainKey || domainKey.includes('google.') || domainKey.includes('maps.') || domainKey.includes('instagram.') || domainKey.includes('facebook.');

    // Checa se já vimos por qualquer um dos 3 identificadores únicos
    const isDuplicate = 
      (nameKey.length >= 4 && seenNames.has(nameKey)) ||
      (!isDomainGeneric && seenDomains.has(domainKey)) ||
      (phoneKey.length >= 8 && seenPhones.has(phoneKey));

    if (!isDuplicate) {
      if (nameKey.length >= 4) seenNames.add(nameKey);
      if (!isDomainGeneric) seenDomains.add(domainKey);
      if (phoneKey.length >= 8) seenPhones.add(phoneKey);

      uniqueLeadsMap.set(candidate.id, candidate);
    } else {
      // Se já existe, tenta enriquecer o lead existente com dados novos (ex: decisor ou telefone que o outro não tinha)
      const existingId = Array.from(uniqueLeadsMap.keys()).find(id => {
        const item = uniqueLeadsMap.get(id);
        if (!item) return false;
        if (nameKey.length >= 4 && normalizeCompanyKey(item.name) === nameKey) return true;
        if (!isDomainGeneric && normalizeDomainKey(item.website) === domainKey) return true;
        if (phoneKey.length >= 8 && normalizePhoneKey(item.phone) === phoneKey) return true;
        return false;
      });

      if (existingId) {
        const existing = uniqueLeadsMap.get(existingId)!;
        // Mescla decisor se o candidato tiver nome de decisor específico
        if (candidate.decisionMaker?.name && !existing.decisionMaker?.name.includes('Sócio') && !candidate.decisionMaker.name.includes('Decisor Comercial')) {
          existing.decisionMaker = candidate.decisionMaker;
        }
        // Mescla telefone se o existente não tinha
        if (!existing.phone && candidate.phone) {
          existing.phone = candidate.phone;
        }
        // Mescla website real se o existente só tinha link do Google Maps
        if (existing.website?.includes('google.com/maps') && candidate.website && !candidate.website.includes('google.com/maps')) {
          existing.website = candidate.website;
        }
      }
    }
  }

  let uniqueLeads = Array.from(uniqueLeadsMap.values());

  onProgress?.(`4/4 Cruzando com histórico anti-queimação e gerando Planejamento Diário (5 Leads/Dia)...`);

  // =========================================================================
  // 4. HISTÓRICO ANTI-QUEIMAÇÃO (Detecta se já foi contatado para não queimar)
  // =========================================================================

  uniqueLeads = uniqueLeads.map(lead => {
    const statusResult = checkLeadStatus(lead);
    if (statusResult.contacted) {
      return {
        ...lead,
        status: 'contacted',
        lastContactedAt: statusResult.date,
        contactOutcome: statusResult.outcome,
        contactOutcomeLabel: statusResult.outcomeLabel,
        contactNotes: statusResult.notes,
        alreadyContactedWarning: {
          isContacted: true,
          contactedAt: statusResult.date,
          formattedDate: statusResult.formattedDate,
          outcome: statusResult.outcome,
          outcomeLabel: statusResult.outcomeLabel,
          notes: statusResult.notes,
          operatorName: statusResult.operatorName
        }
      };
    }
    return lead;
  });

  // =========================================================================
  // 5. ENRIQUECIMENTO ROI, AUDITORIA OMNI-ASSERTIVA & CLASSIFICAÇÃO
  // =========================================================================

  // Ordena por qualificação (Score A primeiro, depois Score B)
  uniqueLeads.sort((a, b) => {
    // Prioriza não contatados na fila do dia
    if (a.status === 'new' && b.status !== 'new') return -1;
    if (a.status !== 'new' && b.status === 'new') return 1;
    return (b.icpScore || b.score || 0) - (a.icpScore || a.score || 0);
  });

  // Limita ao teto solicitado mantendo volume alto
  if (uniqueLeads.length > targetCount) {
    uniqueLeads = uniqueLeads.slice(0, targetCount);
  }

  // Enriquece com auditoria e ROI
  uniqueLeads = OmniAssertiveValidatorService.enrichLeadsWithAudit(uniqueLeads, country);

  // =========================================================================
  // 6. PROGRAMAÇÃO E PLANEJAMENTO DE 5 LEADS POR DIA (Cadência Diária)
  // =========================================================================

  // Atribui o dia do cronograma para cada lead (5 leads por dia)
  uniqueLeads = uniqueLeads.map((lead, idx) => {
    const dayNumber = Math.floor(idx / 5) + 1;
    const targetDateLabel = dayNumber === 1 
      ? 'Hoje' 
      : dayNumber === 2 
      ? 'Amanhã' 
      : `Dia ${dayNumber} (D+${dayNumber - 1})`;

    const dayLabel = dayNumber === 1 
      ? 'Dia 1 (Meta de Hoje)' 
      : dayNumber === 2 
      ? 'Dia 2 (Amanhã)' 
      : `Dia ${dayNumber} (Planejado)`;

    // Recalcula o ROI e a recomendação de mensalidade
    const roiRec = calculateLeadRoiRecommendation(lead, businessProfile);

    return {
      ...lead,
      cadenceDay: dayNumber,
      cadenceDayLabel: dayLabel,
      cadenceTargetDate: targetDateLabel,
      roiRecommendation: roiRec
    };
  });

  const totalDaysPlanned = Math.ceil(uniqueLeads.length / 5);
  const executionTimeMs = Date.now() - startTime;

  return {
    leads: uniqueLeads,
    totalFound: rawCandidateLeads.length,
    uniqueCount: uniqueLeads.length,
    totalDaysPlanned,
    dailyBatchesCount: totalDaysPlanned,
    hubsQueried: primaryHubs,
    sourcesQueried: ['Google Maps (Multi-Polos)', 'Apollo.io B2B OSINT', 'LinkedIn X-Ray Sócios', 'DuckDuckGo Web Crawler'],
    executionTimeMs,
    summary: `Busca simultânea realizada com sucesso em ${primaryHubs.length} polos de ${city}. ${uniqueLeads.length} empresas únicas e qualificadas mapeadas = ${totalDaysPlanned} dias de prospecção garantidos (meta: 5 ligações/dia)!`
  };
}
