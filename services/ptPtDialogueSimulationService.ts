import { Lead, PtPtSdrDialogueSimulation } from '../types';
import { executeAiCompletion } from './aiProviderService';
import { purifyPtPtText, detectLeadNiche } from './realtimeSdrAiOutreachService';

/**
  * URL padrão da CriaHub para captação de clientes em Portugal
  */
export const CRIAHUB_FREE_AUDIT_URL = 'https://www.criahub.global/pt/plano-digital-gratis/';
export const CRIAHUB_PACKAGES_URL = 'https://www.criahub.global/pt/store/pacotes/';

/**
  * Banco de Casos de Sucesso Análogos em Portugal para suporte ao SDR
  */
const PORTUGAL_NICHE_CASE_STUDIES: Record<string, { title: string; beforeAfter: string; result: string }> = {
  calcado_vestuario: {
    title: 'Marca de Calçado & Confeções em Guimarães / Porto',
    beforeAfter: 'WooCommerce desatualizado, sem checkout acelerado para telemóvel e catálogo sem sincronização.',
    result: '+42% nas encomendas online nos primeiros 60 dias após implementação de Google Shopping otimizado e reestruturação da loja online.'
  },
  ecom_retalho: {
    title: 'Retalho Especializado no Eixo Lisboa / Braga',
    beforeAfter: 'Taxa de abandono de carrinho acima de 76% no telemóvel e ausência de API de Conversões do Meta.',
    result: 'Redução de 34% no custo por aquisição (CPA) com campanhas de Google Search e recuperação automática de carrinhos abandonados.'
  },
  restauracao: {
    title: 'Grupo de Restauração & Hospitalidade no Grande Porto',
    beforeAfter: 'Dependência excessiva de plataformas com comissões de 30% e pedidos por telemóvel sem triagem.',
    result: '+180 reservas diretas por mês pelo sítio web próprio com pacotes a partir de € 599 sem pagamento de comissões externas.'
  },
  odonto: {
    title: 'Clínica Dentária & Medicina Especializada em Lisboa',
    beforeAfter: 'Faltas a consultas superiores a 25% e orçamentos de implantes sem acompanhamento no WhatsApp.',
    result: 'Recuperação de mais de € 8.400 em tratamentos pendentes no primeiro mês com confirmação automática de consultas.'
  },
  imobiliario: {
    title: 'Mediadora Imobiliária & Gestão de Ativos em Cascais / Sintra',
    beforeAfter: 'Leads de angariação que demoravam mais de 3 horas a receber primeiro contacto.',
    result: 'Tempo de resposta reduzido para menos de 45 segundos e aumento de 3x em visitas qualificadas agendadas.'
  },
  b2b_geral: {
    title: 'Empresa de Serviços Corporativos e Distribuição B2B',
    beforeAfter: 'Sítio web institucional sem captura de contactos, dependente exclusivamente de recomendações boca a boca.',
    result: 'Geração média de 14 novos pedidos de cotação qualificados por mês através de campanhas cirúrgicas de Google Ads de fundo de funil.'
  }
};

/**
  * Gera a simulação determinística completa de 4 blocos para qualquer lead raspado em Portugal
  */
export function generateDeterministicPtPtDialogue(
  lead: Partial<Lead>,
  rawScrapedData?: {
    techDetected?: string[];
    strengthsNotes?: string;
    identifiedFlaw?: string;
    packageRecommendation?: string;
  }
): PtPtSdrDialogueSimulation {
  const company = lead.name || 'Empresa Analisada';
  const decisor = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Estimado(a) Gestor(a)';
  const city = lead.city || 'Lisboa';
  const district = lead.district || 'Distrito de Lisboa';
  const locationLabel = district ? `${district}, ${city}` : city;
  const website = lead.website || 'sítio web institucional';
  
  // Detecção de Nicho
  const blueprint = detectLeadNiche(lead as Lead);
  const nicheKey = blueprint?.nicheId || 'b2b_geral';
  const caseStudy = PORTUGAL_NICHE_CASE_STUDIES[nicheKey] || PORTUGAL_NICHE_CASE_STUDIES.b2b_geral;

  // Pontos Fortes e Gargalos
  const strengths = rawScrapedData?.strengthsNotes 
    ? [rawScrapedData.strengthsNotes]
    : [
        `Reconhecida presença e solidez de marca na região de ${city}`,
        `Catálogo com excelente potencial de conversão e diferenciais competitivos consolidados`
      ];

  const mainBottleneck = rawScrapedData?.identifiedFlaw 
    || (lead.keyFlaws && lead.keyFlaws.length > 0 ? lead.keyFlaws[0] : null)
    || `Ausência de tracking avançado (Pixel Meta sem CAPI / Tag Google Ads) e falta de botão de contacto direto por telemóvel/WhatsApp no ecrã mobile`;

  const idealOffer = rawScrapedData?.packageRecommendation 
    || `Pacote CriaHub E-commerce & Tráfego Pago a partir de € 599 + Diagnóstico Digital Grátis`;

  // Palavras-chave Google Ads de fundo de funil
  const categoryClean = (lead.category || blueprint.nicheLabel || 'serviços especializados').toLowerCase();
  const kw1 = `[${categoryClean} ${city.toLowerCase()}]`;
  const kw2 = `[comprar ${categoryClean} online portugal]`;
  const kw3 = `[empresa de ${categoryClean} em ${district.toLowerCase() || 'lisboa'}]`;

  // Diálogo Passo a Passo (WhatsApp / LinkedIn)
  const sdrMessage1 = `Viva ${decisor}, com os meus cumprimentos.
Daqui fala a equipa de engenharia de negócios da CriaHub Portugal.

Estive a analisar o posicionamento da ${company} em ${city} e destaco o vosso excelente rigor no catálogo de produtos e solidez no mercado. 

Contudo, reparei num pormenor técnico no vosso sítio web (${website}) que está a dispersar visitas: ${mainBottleneck.toLowerCase()}. 

Como estamos sediados cá em Portugal e acompanhamos operações no eixo Lisboa / Porto há 3 anos, mapeámos exatamente como estancar essa perda sem custos pesados. 

Faria sentido partilhar consigo uma análise objetiva de 1 página que preparámos para a vossa equipa?`;

  const prospectResponse1 = `Viva. Agradeço o contacto, mas já temos um parceiro que nos apoia com a parte digital e não temos orçamento nem tempo para reuniões neste momento. Se quiser, envie por e-mail para darmos uma vista de olhos.`;

  const sdrMessage2 = `Compreendo perfeitamente, ${decisor}. A vossa prudência orçamental e respeito pelo parceiro atual são 100% legítimos. 

O nosso propósito não é substituir ninguém nem vender pacotes dispendiosos. Recentemente apoiámos uma ${caseStudy.title} que enfrentava precisamente essa questão: ${caseStudy.beforeAfter}

O resultado com a nossa esteira foi ${caseStudy.result}

Para que a vossa equipa avalie sem qualquer compromisso nem custo, preparámos o Diagnóstico Digital Grátis da CriaHub. Leva menos de 2 minutos para verificar os pontos exatos a otimizar:
👉 ${CRIAHUB_FREE_AUDIT_URL}

Se preferir, posso enviar-lhe diretamente em PDF por este canal.`;

  const prospectResponse2 = `Parece-me interessante esse caso de estudo. Como é que funciona esse diagnóstico e quanto custa uma intervenção dessas se quisermos avançar?`;

  const sdrMessage3Close = `O diagnóstico é 100% gratuito e sem qualquer compromisso: emitimos um raio-x técnico da velocidade no telemóvel, falhas de rastreio e palavras-chave onde estão a perder clientes para a concorrência.

Caso decidam avançar com a implementação, temos pacotes desenhados para o mercado português a partir de € 599, sem contratos de fidelização agressivos e com foco imediato em retorno de tesouraria.

Pode aceder de imediato aqui ao seu diagnóstico:
👉 ${CRIAHUB_FREE_AUDIT_URL}
(Ou consultar o detalhe dos nossos pacotes em: ${CRIAHUB_PACKAGES_URL})

Fica-lhe mais conveniente conversarmos 10 minutos amanhã às 10h30 ou às 15h00 para lhe apresentar os dados no ecrã?`;

  // Cold Call de 1 Minuto
  const coldCall1Min = {
    opening: `"Viva, bom dia. Daqui fala da CriaHub Portugal. Procuro pelo(a) responsável pela direção da ${company}, por favor." (Transição imediata com firmeza e educação, sem tom de televenda)`,
    hook: `"Viva ${decisor}, daqui fala da CriaHub. Estou a ligar muito rapidamente no seguimento de uma análise técnica que fizemos ao sítio web da ${company} em ${city}. Notámos que no telemóvel os clientes não conseguem aceder de imediato ao vosso contacto direto nem têm o rastreio do Google Ads ativo. Tem 30 segundos para eu lhe explicar o impacto disto na vossa faturação?"`,
    quickPitch: `"A CriaHub opera cá em Portugal há mais de 3 anos e estruturámos pacotes de e-commerce e tráfego pago a partir de € 599 que recuperam essa faturação logo no primeiro mês, tal como fizemos com outras empresas do vosso setor."`,
    close: `"Não lhe quero tomar tempo de operação agora. Quero apenas propor uma demonstração no ecrã de 10 minutos na quinta-feira às 14h30 para lhe entregar o diagnóstico grátis da ${company}. Fica-lhe bem este horário ou prefere na sexta de manhã?"`
  };

  return {
    quickDiagnostic: {
      companyAndLocation: `${company} • ${locationLabel}`,
      strengths,
      mainBottleneck,
      idealCriahubOffer: idealOffer,
      opportunityVerdict: 'Lead Quente'
    },
    dialogueSimulation: {
      sdrMessage1: purifyPtPtText(sdrMessage1),
      prospectResponse1: purifyPtPtText(prospectResponse1),
      sdrMessage2: purifyPtPtText(sdrMessage2),
      prospectResponse2: purifyPtPtText(prospectResponse2),
      sdrMessage3Close: purifyPtPtText(sdrMessage3Close)
    },
    coldCall1Min: {
      opening: purifyPtPtText(coldCall1Min.opening),
      hook: purifyPtPtText(coldCall1Min.hook),
      quickPitch: purifyPtPtText(coldCall1Min.quickPitch),
      close: purifyPtPtText(coldCall1Min.close)
    },
    googleAdsKeywords: [kw1, kw2, kw3],
    googleAdsAdSuggestion: {
      headline: purifyPtPtText(`${company} | Otimização Digital & Vendas em ${city}`),
      description: purifyPtPtText(`Aumente as vendas online e receba clientes no WhatsApp em 45s. Pacotes CriaHub a partir de €599. Diagnóstico Grátis.`)
    },
    caseStudyAnalog: caseStudy,
    landingPageLinks: {
      freePlanUrl: CRIAHUB_FREE_AUDIT_URL,
      packagesUrl: CRIAHUB_PACKAGES_URL
    },
    generatedAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
    engineUsed: 'Motor Determinístico CriaHub Portugal B2B (PT-PT Puro)'
  };
}

/**
  * Gera a simulação em tempo real com IA (Gemini ou Groq) a partir dos dados brutos de Scraping
  */
export async function generateLiveAiPtPtDialogue(
  lead: Partial<Lead>,
  rawScrapedContext?: string
): Promise<PtPtSdrDialogueSimulation> {
  const company = lead.name || 'Empresa';
  const decisor = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Decisor';
  const city = lead.city || 'Lisboa';
  const district = lead.district || '';
  const website = lead.website || '';
  const category = lead.category || 'Serviços B2B / Comércio';
  const techDetected = lead.techStack?.detectedTools?.join(', ') || 'WordPress, WooCommerce, Meta Pixel';
  const flaws = lead.keyFlaws?.join('; ') || 'Falta de tracking e resposta lenta';

  const systemPrompt = `Você é um Diretor de Vendas B2B (Head of Outbound/SDR) e Consultor Estratégico de Tráfego Pago especialista no mercado corporativo de Portugal.
Sua missão é analisar dados brutos de empresas coletados via web scraping e cruzá-los com a nossa oferta da CriaHub (pacotes de e-commerce a partir de €599, tráfego pago, web design e diagnóstico digital grátis).

REGRAS OBRIGATÓRIAS DE COMUNICAÇÃO:
1. Linguagem PT-PT Estrita: Use obrigatoriamente equipa, contacto, sítio web, telemóvel, portes de envio, faturação, orçamento, loja online, ecrã, concelho, distrito. É TERMINANTEMENTE PROIBIDO usar termos do Brasil (galera, bacana, legal, time, celular, frete, print, cara, show).
2. Postura Corporativa: Neutralize qualquer amadorismo. A abordagem deve soar como um consultor sénior baseado cá em Portugal há 3 anos, sério e orientado a dados.
3. Dinâmica da Conversa: A simulação deve prever a resistência natural do empresário português (desconfiança inicial, falta de tempo ou orçamento, "já temos agência") e demonstrar como o SDR contorna a objeção para agendar a reunião ou encaminhar para a página de Diagnóstico Grátis (https://www.criahub.global/pt/plano-digital-gratis/) ou Pacotes (https://www.criahub.global/pt/store/pacotes/).

RETORNE EXCLUSIVAMENTE UM JSON VÁLIDO no seguinte formato, sem markdown ao redor:
{
  "quickDiagnostic": {
    "companyAndLocation": "Nome da Empresa • Cidade/Distrito, Portugal",
    "strengths": [
      "Ponto forte 1 identificado no site/marca",
      "Ponto forte 2 identificado"
    ],
    "mainBottleneck": "Descrição clara do gargalo principal (tracking, UX telemóvel, checkout, ausência WhatsApp)",
    "idealCriahubOffer": "Pacote CriaHub sugerido (€599+, Tráfego Pago ou Diagnóstico Grátis)",
    "opportunityVerdict": "Lead Quente"
  },
  "dialogueSimulation": {
    "sdrMessage1": "Abordagem inicial do SDR da CriaHub no WhatsApp/LinkedIn com âncora de proximidade local (baseados cá em Portugal há mais de 3 anos no fuso de Lisboa), elogio sincero e apontamento técnico da falha no sítio web.",
    "prospectResponse1": "Resposta realista do empresário português com objeção típica (ex: Já temos parceiro / Envie por email / Não temos tempo).",
    "sdrMessage2": "Contorno da objeção pelo SDR com autoridade técnica, apresentando um caso de sucesso análogo do mesmo nicho em Portugal e proposta do Diagnóstico Grátis.",
    "prospectResponse2": "Demonstração de abertura ou curiosidade técnica do empresário ('Como funciona esse diagnóstico? Quanto custa?').",
    "sdrMessage3Close": "Fechamento do SDR direcionando com precisão para https://www.criahub.global/pt/plano-digital-gratis/ e propondo chamada rápida de 10 minutos."
  },
  "coldCall1Min": {
    "opening": "Abertura rápida com foco no decisor em PT-PT",
    "hook": "Pergunta sobre o gargalo identificado no sítio web",
    "quickPitch": "Apresentação dos pacotes CriaHub com foco em ROI (€599+)",
    "close": "Pedido de agendamento de 10 minutos"
  },
  "googleAdsKeywords": [
    "[termo 1 de pesquisa exata no google ads em portugal]",
    "[termo 2 de pesquisa exata]",
    "[termo 3 de pesquisa exata]"
  ],
  "googleAdsAdSuggestion": {
    "headline": "Título do anúncio no Google Ads para o nicho",
    "description": "Texto descritivo do anúncio voltado para o consumidor/empresa portuguesa"
  },
  "caseStudyAnalog": {
    "title": "Caso de Estudo Realista no Nicho em Portugal",
    "beforeAfter": "Cenário antes",
    "result": "Métrica e resultado alcançado"
  }
}`;

  const userPrompt = `DADOS BRUTOS DA EMPRESA RASPADA (SCRAPING):
- Empresa: ${company}
- Website: ${website || 'Não informado'}
- Localização: ${city}${district ? ` (${district})` : ''}, Portugal
- Segmento/Nicho: ${category}
- Tecnologias Detetadas: ${techDetected}
- Gaps Técnicos Identificados: ${flaws}
- Decisor Focal: ${decisor}
${rawScrapedContext ? `\nInformações adicionais do Scraping:\n${rawScrapedContext}` : ''}

Gere o JSON com a Ficha de Diagnóstico Rápido, Simulação da Troca de Conversa, Cold Call de 1 Minuto e Palavras-Chave de Google Ads:`;

  try {
    const aiResponse = await executeAiCompletion({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.25,
      jsonMode: true
    });

    let cleanText = aiResponse.text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      cleanText = cleanText.substring(firstBrace, lastBrace + 1);
    }
    const parsed = JSON.parse(cleanText);

    if (parsed && parsed.quickDiagnostic && parsed.dialogueSimulation && parsed.coldCall1Min) {
      return {
        quickDiagnostic: {
          companyAndLocation: purifyPtPtText(parsed.quickDiagnostic.companyAndLocation || `${company} • ${city}, Portugal`),
          strengths: (parsed.quickDiagnostic.strengths || []).map((s: string) => purifyPtPtText(s)),
          mainBottleneck: purifyPtPtText(parsed.quickDiagnostic.mainBottleneck || flaws),
          idealCriahubOffer: purifyPtPtText(parsed.quickDiagnostic.idealCriahubOffer || 'Pacote CriaHub a partir de €599'),
          opportunityVerdict: parsed.quickDiagnostic.opportunityVerdict || 'Lead Quente'
        },
        dialogueSimulation: {
          sdrMessage1: purifyPtPtText(parsed.dialogueSimulation.sdrMessage1),
          prospectResponse1: purifyPtPtText(parsed.dialogueSimulation.prospectResponse1),
          sdrMessage2: purifyPtPtText(parsed.dialogueSimulation.sdrMessage2),
          prospectResponse2: purifyPtPtText(parsed.dialogueSimulation.prospectResponse2),
          sdrMessage3Close: purifyPtPtText(parsed.dialogueSimulation.sdrMessage3Close)
        },
        coldCall1Min: {
          opening: purifyPtPtText(parsed.coldCall1Min.opening),
          hook: purifyPtPtText(parsed.coldCall1Min.hook),
          quickPitch: purifyPtPtText(parsed.coldCall1Min.quickPitch),
          close: purifyPtPtText(parsed.coldCall1Min.close)
        },
        googleAdsKeywords: (parsed.googleAdsKeywords || []).map((k: string) => purifyPtPtText(k)),
        googleAdsAdSuggestion: parsed.googleAdsAdSuggestion ? {
          headline: purifyPtPtText(parsed.googleAdsAdSuggestion.headline),
          description: purifyPtPtText(parsed.googleAdsAdSuggestion.description)
        } : undefined,
        caseStudyAnalog: parsed.caseStudyAnalog ? {
          title: purifyPtPtText(parsed.caseStudyAnalog.title),
          beforeAfter: purifyPtPtText(parsed.caseStudyAnalog.beforeAfter),
          result: purifyPtPtText(parsed.caseStudyAnalog.result)
        } : undefined,
        landingPageLinks: {
          freePlanUrl: CRIAHUB_FREE_AUDIT_URL,
          packagesUrl: CRIAHUB_PACKAGES_URL
        },
        generatedAt: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
        engineUsed: aiResponse.engineUsed ? `${aiResponse.engineUsed} (PT-PT Calibrado)` : 'Groq / Gemini AI (Portugal B2B)'
      };
    }
  } catch (err: any) {
    console.warn('⚠️ Falha na geração IA de diálogo PT-PT, usando fallback determinístico:', err?.message);
  }

  return generateDeterministicPtPtDialogue(lead);
}

/**
  * Converte a simulação de 4 blocos em Markdown elegante pronto para exportar ou copiar
  */
export function formatDialogueSimulationToMarkdown(simulation: PtPtSdrDialogueSimulation): string {
  return `### RELATÓRIO DE INTELIGÊNCIA COMERCIAL E SIMULAÇÃO DE DIÁLOGO (PT-PT)

#### 1. Ficha de Diagnóstico Rápido (Dados do Scraping)
- **Empresa & Concelho/Distrito:** ${simulation.quickDiagnostic.companyAndLocation}
- **Pontos Fortes Identificados:**
${simulation.quickDiagnostic.strengths.map(s => `  • ${s}`).join('\n')}
- **Gargalo Principal (A Falha):** ${simulation.quickDiagnostic.mainBottleneck}
- **Oferta CriaHub Ideal:** ${simulation.quickDiagnostic.idealCriahubOffer}
${simulation.quickDiagnostic.opportunityVerdict ? `- **Veredicto:** ${simulation.quickDiagnostic.opportunityVerdict}` : ''}

---

#### 2. Simulação da Troca de Conversa (WhatsApp / LinkedIn)
*Transcrição exata passo a passo:*

**[SDR CriaHub - Mensagem 1]:**
${simulation.dialogueSimulation.sdrMessage1}

**[Empresário Português - Resposta 1]:**
"${simulation.dialogueSimulation.prospectResponse1}"

**[SDR CriaHub - Mensagem 2]:**
${simulation.dialogueSimulation.sdrMessage2}

**[Empresário Português - Resposta 2]:**
"${simulation.dialogueSimulation.prospectResponse2}"

**[SDR CriaHub - Mensagem 3 (Fechamento/CTA)]:**
${simulation.dialogueSimulation.sdrMessage3Close}

---

#### 3. Simulação de Script de Chamada Telefónica (Cold Call de 1 Minuto)
- **Abertura:** ${simulation.coldCall1Min.opening}
- **Gancho:** ${simulation.coldCall1Min.hook}
- **Pitch Rápido:** ${simulation.coldCall1Min.quickPitch}
- **Fecho:** ${simulation.coldCall1Min.close}

---

#### 4. Palavras-Chave de Sinergia (Google Ads)
${simulation.googleAdsKeywords.map((kw, i) => `${i + 1}. \`${kw}\``).join('\n')}

${simulation.googleAdsAdSuggestion ? `
*Sugestão de Anúncio:*
- **Título:** ${simulation.googleAdsAdSuggestion.headline}
- **Descrição:** ${simulation.googleAdsAdSuggestion.description}
` : ''}
*Gerado em:* ${simulation.generatedAt} | *Motor:* ${simulation.engineUsed || 'CriaHub Portugal B2B'}
`;
}
