/**
 * Prospecção Kit Aluno - Módulo Integrado
 * Portado e aprimorado a partir do repositório https://github.com/plasdigital/prospeccao-kit-aluno.git
 * 
 * Funcionalidades centrais integradas:
 * 1. Régua de Score Transparente (lib/score.mjs & a-regua-do-score.md):
 *    - Pesos padronizados (Site Vivo 25, Instagram 15, Email 15, Telefone 10, WhatsApp 10, Reputação 10, NIF/CNPJ 5, LinkedIn 5, Endereço 5)
 *    - Classificação em Classe A (>=75, quente), B (>=50, bom), C (>=25, fraco), D (<25, descartar)
 *    - Justificativa textual clara para o SDR (o que somou e o que faltou)
 *    - Alerta de "Site Morto" (empresa divulga site no Maps mas está fora do ar -> gancho de refazer o site)
 * 
 * 2. Diagnóstico de Marketing & Oportunidade (lib/marketing.mjs):
 *    - Detecção de Pixel da Meta (Facebook/Instagram Ads)
 *    - Detecção de Tag de Conversão Google Ads
 *    - Google Analytics / GTM
 *    - Mobile Viewport (<meta name="viewport">)
 *    - Botão/Link direto de WhatsApp
 *    - Ano de Copyright do rodapé (detecta sites abandonados)
 *    - Oportunidade de Venda: Alta (não anuncia e site tem problema), Média (não anuncia, site ok), Baixa (já anuncia)
 * 
 * 3. Biblioteca de Anúncios da Meta (lib/anuncios.mjs):
 *    - Geração de link direto para a Meta Ads Library com o país correto (Portugal PT, Brasil BR, etc.)
 * 
 * 4. Higienização de Nomes e Extração de Profissional (lib/nome.mjs):
 *    - Remoção de sufixos societários (Lda, Unipessoal, Ltda, ME, S.A.), slogans e cidades
 *    - Extração de nomes citados no Maps (Dr., Dra., Eng., Arq.) para abordagem direta
 * 
 * 5. Aderência de Nicho & Descarta Forte (lib/aderencia.mjs):
 *    - Eliminação de fornecedores de insumo, cursos, softwares e falsos positivos
 * 
 * 6. Validação de Requisitos Eliminatórios (lib/requisitos.mjs):
 *    - Validação de telemóveis portugueses (+351 9x) e celulares BR
 *    - Faixa equilibrada de avaliações (10 a 350)
 */

import { 
  Lead, 
  KitAlunoData, 
  KitAlunoScore, 
  KitAlunoMarketing, 
  KitAlunoAderencia, 
  KitAlunoNomes, 
  KitAlunoRequisitos,
  KitAlunoScoreSignal 
} from '../types';

// ============================================================================
// 1. CONSTANTES E CONFIGURAÇÃO DA RÉGUA DE SCORE (lib/score.mjs)
// ============================================================================

export const PESOS_PADRAO = {
  site_vivo: 25,
  instagram: 15,
  email: 15,
  telefone: 10,
  whatsapp: 10,
  reputacao: 10, // nota >= 4.0 E avaliacoes >= 10
  cnpj_nif: 5,   // NIF em Portugal ou CNPJ no Brasil
  linkedin: 5,
  endereco: 5
} as const;

export const NOMES_SINAIS: Record<keyof typeof PESOS_PADRAO, string> = {
  site_vivo: 'site no ar',
  instagram: 'Instagram',
  email: 'e-mail',
  telefone: 'telefone',
  whatsapp: 'WhatsApp',
  reputacao: 'boa reputação no Google (4.0+ e 10+ avaliações)',
  cnpj_nif: 'NIF / CNPJ fiscal',
  linkedin: 'LinkedIn',
  endereco: 'endereço físico'
};

export const FAIXAS = [
  { min: 75, classe: 'A' as const, rotulo: 'quente' as const, descricao: 'quente, 75 ou mais' },
  { min: 50, classe: 'B' as const, rotulo: 'bom' as const, descricao: 'bom, 50 a 74' },
  { min: 25, classe: 'C' as const, rotulo: 'fraco' as const, descricao: 'fraco, 25 a 49' },
  { min: 0,  classe: 'D' as const, rotulo: 'descartar' as const, descricao: 'descartar, abaixo de 25' }
];

// ============================================================================
// 2. HIGIENIZAÇÃO DE NOMES E EXTRAÇÃO DE PROFISSIONAL (lib/nome.mjs)
// ============================================================================

const SUFIXOS_SOCIETARIOS = [
  // Portugal
  /\blda\.?\b/gi,
  /\bunipessoal\s+lda\.?\b/gi,
  /\bunipessoal\b/gi,
  /\bsociedade\s+unipessoal\b/gi,
  /\bs\.?a\.?\b/gi,
  /\beirl\b/gi,
  // Brasil
  /\bltda\.?\b/gi,
  /\bme\b/gi,
  /\bepp\b/gi,
  /\beireli\b/gi,
  /\bs\/?a\b/gi,
  /\bme\/epp\b/gi,
  /\bsociedade\s+simples\b/gi
];

const PREFIXOS_TITULOS = [
  { regex: /\b(dr[a]?\.?|doutor[a]?)\s+([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+){1,2})/i, titulo: 'Dr(a).' },
  { regex: /\b(prof[a]?\.?|professor[a]?)\s+([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+){1,2})/i, titulo: 'Prof.' },
  { regex: /\b(eng[a]?\.?|engenheiro[a]?)\s+([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+){1,2})/i, titulo: 'Eng.' },
  { regex: /\b(arq[a]?\.?|arquiteto[a]?)\s+([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+){1,2})/i, titulo: 'Arq.' },
  { regex: /\b(adv[a]?\.?|advogado[a]?)\s+([A-ZÀ-ÿ][a-zà-ÿ]+(?:\s+[A-ZÀ-ÿ][a-zà-ÿ]+){1,2})/i, titulo: 'Adv.' }
];

/**
 * Remove sufixos jurídicos, descrições após hífen/barra e slogans,
 * deixando o nome natural para abordagem ao telefone.
 */
export function limparNomeEmpresa(nomeOriginal: string): string {
  if (!nomeOriginal) return '';
  let nome = nomeOriginal.trim();

  // 1. Remove termos societários
  for (const suf of SUFIXOS_SOCIETARIOS) {
    nome = nome.replace(suf, '');
  }

  // 2. Corta descrições longas após separadores comuns em nomes do Google Maps
  // Ex: "Clínica Sorriso - Ortodontia e Implantes | Lisboa" -> "Clínica Sorriso"
  const separadores = [' - ', ' | ', ' / ', ' — ', ' – ', ' : '];
  for (const sep of separadores) {
    if (nome.includes(sep)) {
      const partes = nome.split(sep);
      // Se a primeira parte tiver pelo menos 3 caracteres, usa ela
      if (partes[0].trim().length >= 3) {
        nome = partes[0].trim();
        break;
      }
    }
  }

  // 3. Limpeza de pontuação solta nas extremidades
  nome = nome.replace(/^[-–—|/,:.\s]+|[-–—|/,:.\s]+$/g, '').trim();

  // 4. Se todo em MAIÚSCULAS e com mais de 4 letras, converte para Title Case (mantendo siglas)
  if (nome === nome.toUpperCase() && nome.length > 5) {
    nome = nome
      .toLowerCase()
      .split(' ')
      .map(palavra => {
        if (['de', 'da', 'do', 'dos', 'das', 'e', 'em'].includes(palavra)) return palavra;
        if (palavra.length <= 3) return palavra.toUpperCase();
        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
      })
      .join(' ');
  }

  return nome || nomeOriginal.trim();
}

/**
 * Extrai nome de profissional de saúde ou especialista citado no título do Google Maps.
 * Ex: "Clínica Dental Dr. João Santos" -> "Dr. João Santos"
 */
export function extrairPessoaCitada(nomeOriginal: string): string | null {
  if (!nomeOriginal) return null;
  for (const { regex } of PREFIXOS_TITULOS) {
    const match = nomeOriginal.match(regex);
    if (match && match[0]) {
      return match[0].trim();
    }
  }
  return null;
}

/**
 * Gera a melhor abordagem natural para a secretária / recepção
 */
export function gerarSugestaoAbordagem(nomeLimpo: string, pessoaCitada: string | null): string {
  if (pessoaCitada) {
    return `Olá, bom dia! É da ${nomeLimpo}? Por favor, o ${pessoaCitada} está disponível para falar rapidamente?`;
  }
  return `Olá, bom dia! É da ${nomeLimpo}? Gostaria de falar com o responsável pela parte comercial ou de atendimento, por favor.`;
}

// ============================================================================
// 3. BIBLIOTECA DE ANÚNCIOS DA META (lib/anuncios.mjs)
// ============================================================================

/**
 * Mapeia o país para a sigla de 2 letras exigida pela URL da Meta Ads Library
 */
export function getMetaCountryCode(country?: string): string {
  if (!country) return 'PT';
  const c = country.toLowerCase().trim();
  if (c.includes('portugal') || c === 'pt') return 'PT';
  if (c.includes('brasil') || c.includes('brazil') || c === 'br') return 'BR';
  if (c.includes('espanha') || c.includes('spain') || c === 'es') return 'ES';
  if (c.includes('estados unidos') || c.includes('usa') || c.includes('us')) return 'US';
  if (c.includes('reino unido') || c.includes('uk') || c === 'gb') return 'GB';
  if (c.includes('frança') || c.includes('france') || c === 'fr') return 'FR';
  if (c.includes('alemanha') || c.includes('germany') || c === 'de') return 'DE';
  if (c.includes('itália') || c.includes('italy') || c === 'it') return 'IT';
  return 'PT'; // Foco padrão: Portugal
}

/**
 * Gera a URL oficial da Biblioteca de Anúncios do Facebook/Meta para busca exata da empresa
 */
export function getMetaAdsLibraryUrl(companyName: string, country: string = 'Portugal'): string {
  const countryCode = getMetaCountryCode(country);
  const cleanName = limparNomeEmpresa(companyName);
  const query = encodeURIComponent(`"${cleanName}"`);
  return `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${countryCode}&media_type=all&search_type=keyword_exact_phrase&q=${query}`;
}

// ============================================================================
// 4. DIAGNÓSTICO DE MARKETING & OPORTUNIDADE (lib/marketing.mjs)
// ============================================================================

export interface AnaliseMarketingOptions {
  html?: string;
  hasWebsite?: boolean;
  websiteUrl?: string;
  isSiteAlive?: boolean;
  detectedTech?: string[];
}

/**
 * Analisa o HTML ou metadados de tecnologia do site da empresa
 * com as mesmas regras determinísticas do script `lib/marketing.mjs`.
 */
export function diagnosticarMarketing(
  options: AnaliseMarketingOptions,
  companyName: string,
  country: string = 'Portugal'
): KitAlunoMarketing {
  const { html = '', hasWebsite = true, websiteUrl, isSiteAlive = true, detectedTech = [] } = options;
  const currentYear = new Date().getFullYear();

  // 1. Pixel da Meta
  const hasMetaScript = /fbq\(|connect\.facebook\.net/i.test(html);
  const hasMetaTech = detectedTech.some(t => /meta|facebook pixel|facebook ads/i.test(t));
  const pixelMeta = hasMetaScript || hasMetaTech;

  // 2. Tag de Conversão Google Ads
  const hasGoogleScript = /["']AW-\d{6,}|googleadservices\.com|googleads\.g\.doubleclick\.net/i.test(html);
  const hasGoogleTech = detectedTech.some(t => /google ads|google conversion|aw-/i.test(t));
  const pixelGoogle = hasGoogleScript || hasGoogleTech;

  // 3. Analytics / GTM
  const hasGtag = /gtag\(|googletagmanager\.com|google-analytics\.com/i.test(html);
  const hasAnalyticsTech = detectedTech.some(t => /google analytics|gtm|ga4/i.test(t));
  const analytics = hasGtag || hasAnalyticsTech;

  // 4. Mobile Viewport
  const hasViewportTag = /<meta[^>]+name=["']?viewport\b/i.test(html);
  // Se não temos o HTML completo, inferimos pelo site ativo padrão
  const mobile = html ? hasViewportTag : true;

  // 5. Botão WhatsApp no site
  const hasWaLink = /wa\.me\/|api\.whatsapp\.com|web\.whatsapp\.com/i.test(html);
  const botaoWhatsapp = hasWaLink;

  // 6. Ano de Copyright
  let anoCopyright: number | null = null;
  const matchCopy = html.match(/(?:©|&copy;|copyright)[^<]{0,40}?((?:19|20)\d{2})/i);
  if (matchCopy && matchCopy[1]) {
    const yr = parseInt(matchCopy[1], 10);
    if (yr >= 1990 && yr <= currentYear + 1) {
      anoCopyright = yr;
    }
  }

  // 7. Status Desatualizado
  const desatualizado = !mobile || (anoCopyright !== null && anoCopyright <= currentYear - 2);

  // 8. Oportunidade (Alta, Média ou Baixa)
  let oportunidade: 'alta' | 'media' | 'baixa' = 'media';
  let justificativaOportunidade = '';

  const metaAdsUrl = getMetaAdsLibraryUrl(companyName, country);

  if (!hasWebsite || !websiteUrl || websiteUrl.includes('google.com/maps')) {
    oportunidade = 'alta';
    justificativaOportunidade = 'Sem site: a empresa não divulga website no Google. A venda principal é o desenvolvimento do site de alta conversão.';
  } else if (!isSiteAlive) {
    oportunidade = 'alta';
    justificativaOportunidade = 'Site fora do ar: divulga um site no Google Maps que não abre (erro de DNS/servidor). Gancho comercial infalível para refazer o site.';
  } else if (pixelMeta || pixelGoogle) {
    oportunidade = 'baixa';
    const canais = [pixelMeta ? 'Meta Ads' : '', pixelGoogle ? 'Google Ads' : ''].filter(Boolean).join(' e ');
    justificativaOportunidade = `Oportunidade baixa de tráfego inicial: a empresa já possui pixel ativo (${canais}), indicando agência ou equipe de marketing atuante.`;
  } else if (desatualizado || !botaoWhatsapp) {
    oportunidade = 'alta';
    const problemas: string[] = [];
    if (!mobile) problemas.push('não é adaptado para telemóvel/celular');
    if (!botaoWhatsapp) problemas.push('não possui botão direto de WhatsApp');
    if (anoCopyright !== null && anoCopyright <= currentYear - 2) problemas.push(`rodapé estagnado em ${anoCopyright}`);
    justificativaOportunidade = `Oportunidade alta: não anuncia (sem pixel detectado) e o site tem falhas graves de conversão (${problemas.join(', ')}). Cabe tráfego pago e modernização.`;
  } else {
    oportunidade = 'media';
    justificativaOportunidade = 'Oportunidade média: não anuncia (sem pixel de tráfego pago), mas o site está navegável. Excelente oportunidade para oferta de tráfego pago local.';
  }

  return {
    pixelMeta,
    pixelGoogle,
    analytics,
    mobile,
    botaoWhatsapp,
    anoCopyright,
    desatualizado,
    oportunidade,
    justificativaOportunidade,
    metaAdsUrl,
    anunciosMetaStatus: pixelMeta ? 'ANUNCIOS_ATIVOS' : 'VERIFICAR_BIBLIOTECA'
  };
}

// ============================================================================
// 5. ADERÊNCIA DE NICHO & DESCARTA FORTE (lib/aderencia.mjs)
// ============================================================================

export interface RegrasNicho {
  confirma?: string[];
  descarta_forte?: string[];
  descarta?: string[];
}

/**
 * Regras especializadas para os principais nichos comerciais
 */
export const REGRAS_NICHOS_PADRAO: Record<string, RegrasNicho> = {
  odontologia: {
    confirma: ['odonto', 'dentista', 'implante', 'ortodontia', 'estetica dental', 'harmonizacao orofacial', 'invisalign', 'protese', 'dente', 'clinica dental'],
    descarta_forte: ['material odontologico', 'dental cremer', 'dental ', 'curso para dentistas', 'pos graduacao odonto', 'software odontologico', 'laboratorio de protese'],
    descarta: ['veterinaria', 'pet shop', 'oftalmologia', 'estetica corporal', 'hospital']
  },
  saude_clinicas: {
    confirma: ['clinica', 'medica', 'medico', 'consultorio', 'cirurgia', 'dermatologia', 'oftalmologia', 'pediatria', 'cardiologia', 'ortopedia'],
    descarta_forte: ['escola de saude', 'faculdade de medicina', 'conselho regional', 'plano de saude funerario', 'material hospitalar'],
    descarta: ['veterinaria', 'pet', 'mecanica', 'autoescola']
  },
  energia_solar: {
    confirma: ['solar', 'fotovoltaica', 'energia solar', 'paineis solares', 'inversor', 'geracao distribuida', 'placas solares'],
    descarta_forte: ['curso instalador solar', 'fabricante de painel', 'treinamento', 'distribuidor exclusivo', 'representante comercial'],
    descarta: ['eletricista residencial', 'material eletrico simples', 'ar condicionado']
  },
  imobiliaria: {
    confirma: ['imobiliaria', 'imoveis', 'aluguel', 'venda de imoveis', 'corretor', 'apartamento', 'moradia', 'arrendamento', 'imobiliario'],
    descarta_forte: ['condominio residencial', 'sindico profissional', 'software imobiliario', 'portal de anuncios'],
    descarta: ['construcao civil pesada', 'arquitetura apenas', 'engenharia estrutural']
  },
  advocacia: {
    confirma: ['advocacia', 'advogado', 'sociedade de advogados', 'direito civil', 'direito trabalhista', 'direito tributario', 'direito empresarial', 'juridico'],
    descarta_forte: ['concurso publico', 'oab', 'faculdade de direito', 'estagio direito', 'apostila juridica'],
    descarta: ['cartorio', 'tabelionato', 'forum', 'vara judicial']
  },
  contabilidade: {
    confirma: ['contabilidade', 'contabil', 'contador', 'bpo financeiro', 'assessoria contabil', 'abertura de empresa', 'fiscal'],
    descarta_forte: ['crc', 'conselho de contabilidade', 'curso de contabilidade', 'software contabil'],
    descarta: ['auditoria publica', 'orgao publico', 'receita federal']
  }
};

/**
 * Avalia se o lead pertence de fato ao nicho desejado usando a lógica do kit-aluno:
 * 1. Checa descarta_forte no nome ou categoria -> reprova imediatamente
 * 2. Checa descarta no nome ou categoria -> reprova
 * 3. Checa confirma -> aprova com segurança
 */
export function avaliarAderenciaNicho(
  companyName: string,
  category: string,
  keyword: string,
  regrasCustomizadas?: RegrasNicho
): KitAlunoAderencia {
  const textoAnalise = `${companyName} ${category} ${keyword}`.toLowerCase();
  
  // Encontra as regras adequadas
  let regras = regrasCustomizadas;
  if (!regras) {
    const k = (keyword || '').toLowerCase();
    if (k.includes('odonto') || k.includes('dent')) regras = REGRAS_NICHOS_PADRAO.odontologia;
    else if (k.includes('solar') || k.includes('fotov')) regras = REGRAS_NICHOS_PADRAO.energia_solar;
    else if (k.includes('imob') || k.includes('imóv') || k.includes('arrend')) regras = REGRAS_NICHOS_PADRAO.imobiliaria;
    else if (k.includes('advog') || k.includes('jurid')) regras = REGRAS_NICHOS_PADRAO.advocacia;
    else if (k.includes('contab')) regras = REGRAS_NICHOS_PADRAO.contabilidade;
    else if (k.includes('medic') || k.includes('saud') || k.includes('clini')) regras = REGRAS_NICHOS_PADRAO.saude_clinicas;
    else {
      // Regras genéricas padrão
      regras = {
        descarta_forte: ['curso', 'escola', 'treinamento', 'distribuidor de', 'material para', 'software para'],
        descarta: ['veterinaria', 'pet', 'publico', 'ministerio']
      };
    }
  }

  // 1. Descarta forte
  if (regras.descarta_forte) {
    for (const termo of regras.descarta_forte) {
      if (textoAnalise.includes(termo.toLowerCase())) {
        return {
          veredito: 'nao',
          motivo: `Descartado pelo filtro forte: termo "${termo}" encontrado (provável fornecedor, curso ou software, não cliente final)`,
          descartaDetectado: termo
        };
      }
    }
  }

  // 2. Descarta comum
  if (regras.descarta) {
    for (const termo of regras.descarta) {
      if (textoAnalise.includes(termo.toLowerCase())) {
        return {
          veredito: 'nao',
          motivo: `Descartado por desvio de segmento: termo "${termo}" incompatível com o nicho`,
          descartaDetectado: termo
        };
      }
    }
  }

  // 3. Confirma
  if (regras.confirma) {
    for (const termo of regras.confirma) {
      if (textoAnalise.includes(termo.toLowerCase())) {
        return {
          veredito: 'sim',
          motivo: `Aderência confirmada ao nicho pelo termo "${termo}"`,
          confirmaDetectado: termo
        };
      }
    }
  }

  return {
    veredito: 'indefinido',
    motivo: 'Nenhum termo forte de confirmação ou descarte encontrado; conferir na ligação'
  };
}

// ============================================================================
// 6. VALIDAÇÃO DE REQUISITOS ELIMINATÓRIOS (lib/requisitos.mjs)
// ============================================================================

/**
 * Valida o número de telefone de acordo com o país:
 * - Em Portugal: telemóvel começa com 91, 92, 93, 96 (indicativos móveis)
 * - No Brasil: celular com 9 dígitos (+55 DD 9XXXX-XXXX)
 */
export function classificarTipoTelefone(phone: string, country: string = 'Portugal'): {
  tipo: 'telemovel' | 'fixo' | 'central_ou_invalido';
  e164?: string;
} {
  if (!phone) return { tipo: 'central_ou_invalido' };
  const digits = phone.replace(/\D/g, '');
  const isPt = country.toLowerCase().includes('portugal') || country.toLowerCase().includes('pt');

  if (isPt) {
    // Portugal: telemóvel tem 9 dígitos nacionais começando com 9
    // Se vier com prefixo 351, remove
    let clean = digits;
    if (clean.startsWith('351') && clean.length > 9) {
      clean = clean.slice(3);
    }
    if (clean.length === 9) {
      if (/^9[1236]/.test(clean)) {
        return { tipo: 'telemovel', e164: `+351${clean}` };
      }
      if (/^2[1-9]/.test(clean)) {
        return { tipo: 'fixo', e164: `+351${clean}` };
      }
    }
    return { tipo: 'central_ou_invalido' };
  }

  // Brasil: celular tem 11 dígitos com 9 no terceiro dígito (ex: 11988887777)
  let cleanBr = digits;
  if (cleanBr.startsWith('55') && cleanBr.length > 11) {
    cleanBr = cleanBr.slice(2);
  }
  if (cleanBr.length === 11 && cleanBr.charAt(2) === '9') {
    return { tipo: 'telemovel', e164: `+55${cleanBr}` };
  }
  if (cleanBr.length === 10) {
    return { tipo: 'fixo', e164: `+55${cleanBr}` };
  }

  return { tipo: 'central_ou_invalido' };
}

/**
 * Checa requisitos de corte:
 * - Faixa de avaliações (ex: mínimo 10, máximo 350 para não pegar franquias inalcançáveis)
 * - Telefone válido
 */
export function checarRequisitosEliminatorios(
  lead: Partial<Lead>,
  country: string = 'Portugal',
  minAvaliacoes: number = 10,
  maxAvaliacoes: number = 350
): KitAlunoRequisitos {
  const motivosReprovacao: string[] = [];
  const reviews = lead.reviews ?? 0;
  const rating = lead.rating ?? 0;

  // 1. Reputação no Google
  if (reviews < minAvaliacoes) {
    motivosReprovacao.push(`Poucas avaliações no Google (${reviews} avaliações, mínimo recomendado: ${minAvaliacoes})`);
  }
  if (reviews > maxAvaliacoes) {
    motivosReprovacao.push(`Muitas avaliações (${reviews} avaliações, teto recomendado: ${maxAvaliacoes}). Provável mega-rede com agência interna.`);
  }

  // 2. Telefone
  const telClass = classificarTipoTelefone(lead.phone || '', country);
  if (!lead.phone) {
    motivosReprovacao.push('Não possui telefone de contato registrado');
  }

  return {
    aprovado: motivosReprovacao.length === 0,
    motivosReprovacao,
    tipoTelefone: telClass.tipo,
    celularE164: telClass.e164
  };
}

// ============================================================================
// 7. CÁLCULO DA RÉGUA DE SCORE & JUSTIFICATIVA (lib/score.mjs)
// ============================================================================

export function calcularScoreKitAluno(
  lead: Partial<Lead>,
  country: string = 'Portugal',
  marketing?: KitAlunoMarketing
): KitAlunoScore {
  const sinais: Record<string, KitAlunoScoreSignal> = {};
  let totalPontos = 0;

  // 1. Site no ar (+25)
  const hasWeb = !!lead.website && !lead.website.includes('google.com/maps');
  const siteMorto = lead.websiteAudit?.liveStatus === 'NO_WEBSITE' || 
                    lead.websiteAudit?.liveStatus === 'UNREACHABLE' || 
                    lead.digital360Audit?.websiteAudit?.liveStatus === 'OFFLINE_FATAL';
  const siteVivo = hasWeb && !siteMorto;
  sinais.site_vivo = {
    tem: siteVivo,
    pontos: siteVivo ? PESOS_PADRAO.site_vivo : 0,
    nota: siteMorto ? 'Site fora do ar!' : hasWeb ? 'No ar' : 'Sem site'
  };
  totalPontos += sinais.site_vivo.pontos;

  // 2. Instagram (+15)
  const hasInsta = !!lead.socials?.instagram || 
                   !!lead.digital360Audit?.socialsAudit?.instagram?.exists;
  sinais.instagram = {
    tem: hasInsta,
    pontos: hasInsta ? PESOS_PADRAO.instagram : 0,
    nota: hasInsta ? 'Presente' : 'Não encontrado'
  };
  totalPontos += sinais.instagram.pontos;

  // 3. E-mail (+15)
  const hasEmail = !!lead.email && lead.email.includes('@') && !lead.email.includes('exemplo.com');
  sinais.email = {
    tem: hasEmail,
    pontos: hasEmail ? PESOS_PADRAO.email : 0,
    nota: hasEmail ? 'Válido' : 'Ausente'
  };
  totalPontos += sinais.email.pontos;

  // 4. Telefone (+10)
  const hasPhone = !!lead.phone && lead.phone.replace(/\D/g, '').length >= 8;
  sinais.telefone = {
    tem: hasPhone,
    pontos: hasPhone ? PESOS_PADRAO.telefone : 0,
    nota: hasPhone ? 'Presente' : 'Ausente'
  };
  totalPontos += sinais.telefone.pontos;

  // 5. WhatsApp (+10)
  const hasWhatsapp = marketing?.botaoWhatsapp || 
                      lead.phone?.replace(/\D/g, '').length >= 9 || 
                      !!lead.digital360Audit?.chatbotAudit?.hasChatbot;
  sinais.whatsapp = {
    tem: !!hasWhatsapp,
    pontos: hasWhatsapp ? PESOS_PADRAO.whatsapp : 0,
    nota: hasWhatsapp ? 'Detectado' : 'Não detectado'
  };
  totalPontos += sinais.whatsapp.pontos;

  // 6. Reputação Google (+10): rating >= 4.0 E reviews >= 10
  const rating = lead.rating || 0;
  const reviews = lead.reviews || 0;
  const boaReputacao = rating >= 4.0 && reviews >= 10;
  sinais.reputacao = {
    tem: boaReputacao,
    pontos: boaReputacao ? PESOS_PADRAO.reputacao : 0,
    nota: `${rating.toFixed(1)}★ (${reviews} avaliações)`
  };
  totalPontos += sinais.reputacao.pontos;

  // 7. NIF / CNPJ (+5)
  const hasFiscal = !!lead.fiscalRegistry?.taxId && lead.fiscalRegistry.taxId.length > 5;
  sinais.cnpj_nif = {
    tem: hasFiscal,
    pontos: hasFiscal ? PESOS_PADRAO.cnpj_nif : 0,
    nota: hasFiscal ? (lead.fiscalRegistry?.taxIdLabel || 'Fiscal') : 'Pendente'
  };
  totalPontos += sinais.cnpj_nif.pontos;

  // 8. LinkedIn (+5)
  const hasLinkedin = !!lead.socials?.linkedin || 
                      !!lead.decisionMaker?.linkedin || 
                      !!lead.digital360Audit?.socialsAudit?.linkedin?.exists;
  sinais.linkedin = {
    tem: hasLinkedin,
    pontos: hasLinkedin ? PESOS_PADRAO.linkedin : 0,
    nota: hasLinkedin ? 'Localizado' : 'Não localizado'
  };
  totalPontos += sinais.linkedin.pontos;

  // 9. Endereço (+5)
  const hasAddress = !!lead.address && lead.address.length > 5;
  sinais.endereco = {
    tem: hasAddress,
    pontos: hasAddress ? PESOS_PADRAO.endereco : 0,
    nota: hasAddress ? 'Completo' : 'Incompleto'
  };
  totalPontos += sinais.endereco.pontos;

  // Normalização de 0 a 100
  const scoreFinal = Math.min(100, Math.max(0, totalPontos));

  // Faixa de pontuação
  const faixa = FAIXAS.find(f => scoreFinal >= f.min) || FAIXAS[FAIXAS.length - 1];

  // Justificativa textual detalhada (o que somou e o que faltou)
  const somou: string[] = [];
  const faltou: string[] = [];

  for (const [key, sinal] of Object.entries(sinais)) {
    const nomeAmigavel = NOMES_SINAIS[key as keyof typeof PESOS_PADRAO] || key;
    const peso = PESOS_PADRAO[key as keyof typeof PESOS_PADRAO] || 0;
    if (sinal.tem) {
      somou.push(`${nomeAmigavel} +${peso}`);
    } else {
      faltou.push(`${nomeAmigavel} (${peso})`);
    }
  }

  let situacaoSite: 'com_site' | 'sem_site' | 'site_morto' = 'com_site';
  if (!hasWeb) situacaoSite = 'sem_site';
  if (siteMorto) situacaoSite = 'site_morto';

  let justificativaNota = `${faixa.classe} · ${scoreFinal} de 100 (${faixa.descricao}). `;
  if (somou.length > 0) {
    justificativaNota += `Somou: ${somou.join(', ')}. `;
  }
  if (faltou.length > 0) {
    justificativaNota += `Faltou: ${faltou.join(', ')}.`;
  }
  if (siteMorto) {
    justificativaNota += ' ⚠️ Atenção: site cadastrado no Google está fora do ar!';
  }

  return {
    score: scoreFinal,
    classificacao: faixa.classe,
    rotulo: faixa.rotulo,
    justificativaNota,
    sinais,
    situacaoSite,
    siteMorto
  };
}

// ============================================================================
// 8. ENRIQUECIMENTO COMPLETO DO LEAD (Integrador)
// ============================================================================

/**
 * Aplica todas as regras do `prospeccao-kit-aluno` em um lead do sistema,
 * gerando e associando o objeto `kitAluno` de forma não-destrutiva.
 */
export function enrichLeadWithKitAluno(
  lead: Lead,
  country: string = 'Portugal',
  nicheKeyword?: string
): Lead {
  const cleanName = limparNomeEmpresa(lead.name);
  const pessoaCitada = extrairPessoaCitada(lead.name);
  const sugestaoAbordagem = gerarSugestaoAbordagem(cleanName, pessoaCitada);

  const nomes: KitAlunoNomes = {
    nomeOriginalMaps: lead.name,
    nomeEmpresaLimpo: cleanName,
    nomePessoaCitado: pessoaCitada,
    sugestaoAbordagem
  };

  const marketing = diagnosticarMarketing({
    hasWebsite: !!lead.website && !lead.website.includes('google.com/maps'),
    websiteUrl: lead.website,
    isSiteAlive: lead.websiteAudit?.liveStatus !== 'NO_WEBSITE' && lead.websiteAudit?.liveStatus !== 'UNREACHABLE',
    detectedTech: lead.techStack?.detectedTools || lead.websiteAudit?.detectedTech || []
  }, cleanName, country);

  const aderencia = avaliarAderenciaNicho(
    lead.name,
    lead.category || '',
    nicheKeyword || lead.category || ''
  );

  const requisitos = checarRequisitosEliminatorios(lead, country, 8, 400);

  const score = calcularScoreKitAluno(lead, country, marketing);

  const kitAlunoData: KitAlunoData = {
    score,
    marketing,
    aderencia,
    nomes,
    requisitos,
    enriquecidoEm: new Date().toISOString()
  };

  // Se extraiu um nome de médico/especialista e o decisor atual é genérico, atualiza
  let decisionMaker = lead.decisionMaker;
  if (pessoaCitada && (!decisionMaker?.name || decisionMaker.name.includes('Sócio') || decisionMaker.name.includes('Diretoria') || decisionMaker.name.includes('Decisor Comercial'))) {
    decisionMaker = {
      ...decisionMaker,
      name: pessoaCitada,
      role: 'Responsável Clínico / Proprietário',
      roleCategory: 'DONO_CEO_SOCIO',
      matchConfidence: 94,
      matchRationale: `Nome de autoridade profissional extraído do registro do estabelecimento: "${pessoaCitada}".`
    };
  }

  return {
    ...lead,
    kitAluno: kitAlunoData,
    decisionMaker
  };
}
