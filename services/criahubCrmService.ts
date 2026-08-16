import { Lead, CriahubCrmConfig, BusinessProfile, AiLiveCopilotAnalysis } from '../types';
import { logWebhookDispatch } from './storageService';

const CRIAHUB_CONFIG_KEY = 'criahub_crm_config_v1';

export const DEFAULT_CRIAHUB_CONFIG: CriahubCrmConfig = {
  webhookUrl: 'https://xcgphxriuopvqohvidfi.supabase.co/functions/v1/webhook-handler',
  organizationId: '',
  apiToken: '',
  evolutionInstanceName: 'prospector-sdr-01',
  evolutionApiUrl: '',
  resendApiKey: '',
  senderEmail: 'sdr@suaempresa.com.br',
  autoSyncOnContacted: true,
  defaultPipelineStage: 'Prospecção Fria'
};

export function getCriahubCrmConfig(): CriahubCrmConfig {
  try {
    const raw = localStorage.getItem(CRIAHUB_CONFIG_KEY);
    if (raw) {
      return { ...DEFAULT_CRIAHUB_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error loading Criahub CRM config:', e);
  }
  return DEFAULT_CRIAHUB_CONFIG;
}

export function saveCriahubCrmConfig(config: Partial<CriahubCrmConfig>): CriahubCrmConfig {
  const current = getCriahubCrmConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(CRIAHUB_CONFIG_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving Criahub CRM config:', e);
  }
  return updated;
}

/**
 * Builds the CriahubADS webhook URL with the organization_id and source=crialeads.
 * The CriahubADS function /functions/v1/webhook-handler reads org_id + source from the query string.
 */
export function buildCriahubCrmWebhookUrl(): string {
  const config = getCriahubCrmConfig();
  const separator = config.webhookUrl.includes('?') ? '&' : '?';
  const orgParam = config.organizationId
    ? `org_id=${encodeURIComponent(config.organizationId)}`
    : 'org_id=SEU_ORG_ID_CRIAHUB';
  return `${config.webhookUrl}${separator}${orgParam}&source=crialeads`;
}

/**
 * Builds a standardized, ultra-complete payload for CriahubCRM (CriahubADS) and attached automation engines (Evolution API v2, Resend, n8n).
 */
export function buildCriahubCrmPayload(
  lead: Lead, 
  businessProfile?: BusinessProfile, 
  customOptions?: { 
    channelPriority?: 'WHATSAPP' | 'EMAIL' | 'OMNICHANNEL' | 'LEAD_ONLY';
    whatsappVariation?: 'A' | 'B' | 'C';
    pipelineStage?: string;
  }
) {
  const config = getCriahubCrmConfig();
  const channelPriority = customOptions?.channelPriority || 'OMNICHANNEL';
  const variation = customOptions?.whatsappVariation || 'A';
  const stage = customOptions?.pipelineStage || config.defaultPipelineStage;

  // Selected WhatsApp variation
  const guardianShield = lead.guardian?.whatsappShield;
  const spinning = guardianShield?.spinningVariations;
  let whatsappText = lead.outreach.whatsapp.option1Curiosity;
  if (variation === 'B' && spinning?.variationB) {
    whatsappText = spinning.variationB;
  } else if (variation === 'C' && spinning?.variationC) {
    whatsappText = spinning.variationC;
  } else if (variation === 'A' && spinning?.variationA) {
    whatsappText = spinning.variationA;
  }

  // Sanitized clean phone for WhatsApp
  const rawPhone = lead.phone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const formattedWhatsAppNumber = cleanPhone.length > 0
    ? (cleanPhone.startsWith('55') || cleanPhone.startsWith('351') ? cleanPhone : `55${cleanPhone}`)
    : '';

  // Email subject & body
  const emailSubject = lead.guardian?.emailShield?.cleanPlainText?.subject || lead.outreach.email.subject;
  const emailBody = lead.guardian?.emailShield?.cleanPlainText?.body || lead.outreach.email.bodyAida;

  return {
    source: 'Architect-Prospector-AI',
    apiVersion: '2026-v2',
    dispatchedAt: new Date().toISOString(),
    event: 'LEAD_PROSPECTED_QUALIFIED',
    
    // Core Lead Identification (mapped to CriahubADS leads table)
    lead: {
      id: lead.id,
      companyName: lead.name,
      name: lead.name,
      category: lead.category,
      address: lead.address,
      city: lead.city,
      district: lead.district || '',
      country: lead.country || 'Brasil',
      website: lead.website || '',
      phone: lead.phone || '',
      whatsappNumber: formattedWhatsAppNumber,
      email: lead.email || '',
      rating: lead.rating,
      reviewsCount: lead.reviews,
      googleMapsUrl: lead.googleMapsLink || '',
      status: lead.status,
      pipelineStage: stage,
      notes: lead.notes || ''
    },

    // AI Prospecting & ICP Matching Metrics
    qualification: {
      icpTier: lead.icpTier,
      icpScore: lead.icpScore,
      intentScore: lead.intentScore,
      intentPriority: lead.intentPriority,
      identifiedPain: lead.identifiedPain,
      urgencyFactor: lead.urgencyFactor,
      budgetMaturity: lead.budgetMaturity,
      matchReason: lead.matchReason || '',
      keyFlaws: lead.keyFlaws || lead.digitalGaps || []
    },

    // Decision Maker & Authority Profile
    decisionMaker: {
      name: lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Decisor Comercial',
      role: lead.decisionMaker?.role || lead.bantPlus?.authority?.role || 'Sócio / Diretor',
      orgStructure: lead.bantPlus?.authority?.orgStructure || 'Diretoria',
      directPhone: lead.decisionMaker?.directPhone || lead.phone || '',
      directEmail: lead.decisionMaker?.directEmail || lead.email || '',
      linkedin: lead.decisionMaker?.linkedin || lead.bantPlus?.authority?.linkedinSearchUrl || ''
    },

    // Deep BANT+ Full Diagnostic
    bantPlus: lead.bantPlus ? {
      budget: {
        estimatedBudget: lead.bantPlus.budget.estimatedBudget,
        companySize: lead.bantPlus.budget.companySize,
        estimatedRevenue: lead.bantPlus.budget.estimatedRevenue,
        rating: lead.bantPlus.budget.rating
      },
      authority: lead.bantPlus.authority,
      need: lead.bantPlus.need,
      timeline: lead.bantPlus.timeline
    } : null,

    // Tech Stack & Gaps Scanner
    techStack: lead.techStack ? {
      detectedTools: lead.techStack.detectedTools,
      cms: lead.techStack.cmsOrPlatform,
      analyticsAndPixels: lead.techStack.analyticsAndPixels,
      crmAndAutomation: lead.techStack.crmAndAutomation,
      vulnerabilitiesAndGaps: lead.techStack.vulnerabilitiesAndGaps
    } : null,

    // Outbound Automation Dispatch Payloads (Evolution API / WhatsApp)
    evolutionApiWhatsApp: {
      instance: config.evolutionInstanceName || 'prospector-sdr-01',
      number: formattedWhatsAppNumber,
      text: whatsappText,
      delaySeconds: guardianShield?.temporalHumanization?.typingDelaySeconds || 22,
      presence: guardianShield?.temporalHumanization?.presenceState || 'composing',
      variationUsed: variation,
      options: {
        linkPreview: true,
        quoted: null
      },
      webhookCallbackUrl: `${buildCriahubCrmWebhookUrl()}/callbacks/whatsapp`
    },

    // Email Outbound Payload (Resend / SendGrid / SES)
    resendEmail: {
      from: config.senderEmail || 'sdr@suaempresa.com.br',
      to: lead.email || '',
      subject: emailSubject,
      plainText: emailBody,
      html: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #1e293b;"><p>${emailBody.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p></div>`,
      tags: [
        { name: 'icp_tier', value: lead.icpTier },
        { name: 'lead_id', value: lead.id },
        { name: 'company', value: lead.name }
      ],
      headers: {
        'X-Entity-Ref-ID': lead.id,
        'X-Prospector-Intent': lead.intentPriority
      }
    },

    // 21-Day Cadence & Stop Trigger Rule
    cadence21d: lead.cadence ? {
      currentStep: 1,
      totalSteps: lead.cadence.steps.length,
      status: lead.cadence.isAutomationActive ? 'ACTIVE' : 'INACTIVE',
      stopTriggerRule: lead.cadence.stopTriggerRule,
      crmStopPayload: lead.cadence.crmStopPayload,
      nextScheduledTouch: lead.cadence.steps[0] ? {
        day: lead.cadence.steps[0].day,
        channel: lead.cadence.steps[0].primaryChannel,
        title: lead.cadence.steps[0].title
      } : null
    } : null,

    // Elite Sales Objection Battlecards for Human SDRs / Closers
    aiSalesBattlecard: {
      coldCall: lead.outreach.coldCall,
      topObjections: lead.objectionCrusher ? Object.values(lead.objectionCrusher.objections) : [],
      urgencyFactor: lead.urgencyFactor
    }
  };
}

/**
 * Dispatches the enriched Lead to CriahubCRM (CriahubADS webhook-handler) or any Custom Webhook Endpoint.
 */
export async function sendLeadToCriahubCrm(
  lead: Lead, 
  businessProfile?: BusinessProfile, 
  customOptions?: { 
    channelPriority?: 'WHATSAPP' | 'EMAIL' | 'OMNICHANNEL' | 'LEAD_ONLY';
    whatsappVariation?: 'A' | 'B' | 'C';
    pipelineStage?: string;
    targetUrlOverride?: string;
  }
): Promise<{ success: boolean; message: string; payload: any; responseData?: any }> {
  const config = getCriahubCrmConfig();
  const defaultTarget = buildCriahubCrmWebhookUrl();
  const targetUrl = customOptions?.targetUrlOverride || defaultTarget;
  const payload = buildCriahubCrmPayload(lead, businessProfile, customOptions);

  if (!targetUrl || !targetUrl.startsWith('http')) {
    // Simulated Dispatch when no real URL configured
    logWebhookDispatch({
      type: 'CUSTOM_WEBHOOK',
      targetUrl: targetUrl || 'Criahub CRM (Simulado)',
      payload,
      status: 'SIMULATED',
      response: 'Payload validado e formatado com sucesso para CriahubCRM & CriahubADS.'
    });

    return {
      success: true,
      message: `Simulação concluída com sucesso para ${lead.name}. Payload gerado conforme especificação CriahubCRM & CriahubADS.`,
      payload
    };
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Prospector-Source': 'Architect-Prospector-AI',
      'X-Lead-ID': lead.id
    };

    if (config.apiToken) {
      headers['Authorization'] = `Bearer ${config.apiToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    let responseJson: any = null;
    try {
      responseJson = JSON.parse(responseText);
    } catch {
      responseJson = { raw: responseText };
    }

    if (response.ok) {
      logWebhookDispatch({
        type: 'CUSTOM_WEBHOOK',
        targetUrl,
        payload,
        status: 'SUCCESS',
        response: responseJson
      });

      return {
        success: true,
        message: `Lead ${lead.name} sincronizado com sucesso no CriahubCRM (Status HTTP ${response.status}).`,
        payload,
        responseData: responseJson
      };
    } else {
      logWebhookDispatch({
        type: 'CUSTOM_WEBHOOK',
        targetUrl,
        payload,
        status: 'FAILED',
        response: `HTTP ${response.status}: ${responseText.slice(0, 200)}`
      });

      return {
        success: false,
        message: `Falha na resposta do CriahubCRM (HTTP ${response.status}): ${responseText.slice(0, 150)}`,
        payload,
        responseData: responseJson
      };
    }
  } catch (error: any) {
    console.error('Error sending lead to Criahub CRM:', error);
    logWebhookDispatch({
      type: 'CUSTOM_WEBHOOK',
      targetUrl,
      payload,
      status: 'FAILED',
      response: error.message || 'Erro de conexão ou CORS'
    });

    return {
      success: false,
      message: `Erro ao conectar com ${targetUrl}: ${error.message || 'Erro de rede/CORS'}. Verifique se a URL aceita requisições POST.`,
      payload
    };
  }
}

/**
 * Dispatches a real-time Live Conversation & AI Copilot Analysis Turn to CriahubCRM (CriahubADS).
 */
export async function sendLiveCallAnalysisToCriahubCrm(
  lead: Lead | null,
  analysis: AiLiveCopilotAnalysis,
  transcript: string
): Promise<{ success: boolean; message: string }> {
  const config = getCriahubCrmConfig();
  const targetUrl = buildCriahubCrmWebhookUrl();

  const liveCallPayload = {
    source: 'Architect-Prospector-AI',
    event: 'LIVE_CALL_AI_COPILOT_ANALYSIS',
    timestamp: analysis.timestamp || new Date().toISOString(),
    lead: lead ? {
      id: lead.id,
      companyName: lead.name,
      contactName: lead.decisionMaker?.name || 'Decisor',
      phone: lead.phone,
      email: lead.email,
      icpTier: lead.icpTier
    } : null,
    transcriptSnippet: transcript,
    aiAnalysis: {
      sentiment: analysis.sentiment,
      sentimentConfidence: analysis.sentimentConfidence,
      buyingSignalScore: analysis.buyingSignalScore,
      detectedIntent: analysis.detectedIntent,
      identifiedObjectionCategory: analysis.identifiedObjectionCategory,
      liveRebuttalScript: analysis.liveRebuttalScript,
      whatsappQuickResponse: analysis.whatsappQuickResponse,
      keyPsychologicalTrigger: analysis.keyPsychologicalTrigger,
      nextBestAction: analysis.nextBestAction,
      suggestedMeetingTimes: analysis.suggestedMeetingTimes,
      isReadyForClosing: analysis.isReadyForClosing
    },
    crmActivityNote: analysis.criahubCrmNote || `[AI Copilot Realtime] Sentimento: ${analysis.sentiment.toUpperCase()} | Sinal de Compra: ${analysis.buyingSignalScore}% | Próxima Ação: ${analysis.nextBestAction}`
  };

  if (!targetUrl || !targetUrl.startsWith('http')) {
    logWebhookDispatch({
      type: 'CUSTOM_WEBHOOK',
      targetUrl: 'Criahub CRM (Live Call Sync Simulado)',
      payload: liveCallPayload,
      status: 'SIMULATED',
      response: 'Análise de áudio/chamada registrada no histórico do Criahub CRM com sucesso.'
    });
    return { success: true, message: 'Análise de chamada simulada e registrada com sucesso.' };
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Prospector-Event': 'LIVE_CALL_AI_COPILOT_ANALYSIS'
      },
      body: JSON.stringify(liveCallPayload)
    });

    return {
      success: response.ok,
      message: response.ok ? 'Análise de chamada ao vivo enviada para o Criahub CRM com sucesso.' : `Falha HTTP ${response.status}`
    };
  } catch (e: any) {
    return { success: false, message: e.message || 'Erro ao sincronizar análise' };
  }
}
