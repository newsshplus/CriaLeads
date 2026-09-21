import { Lead } from '../types';

/**
 * Formata mensagem de WhatsApp personalizada para o lead sem clichês,
 * com variáveis do lead (Decisor, Empresa, Cidade, Dor identificada)
 */
export function formatLeadWhatsAppMessage(lead: Lead): string {
  const decisor = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'responsável';
  const empresa = lead.name;
  const cidade = lead.city ? ` em ${lead.city}` : '';
  const dor = lead.identifiedPain 
    || (lead.digitalGaps && lead.digitalGaps[0]) 
    || 'otimização no fluxo de atendimento e agendamento digital';

  // Se o lead já possui script personalizado gerado pelo copywriter, utiliza-o
  if (lead.outreach?.whatsapp?.option1Curiosity) {
    return lead.outreach.whatsapp.option1Curiosity;
  }

  // Se o lead tem gancho do guia SDR sênior
  const openingHook = lead.seniorIcpQualification?.sdrTrainingGuide?.openingHook;
  if (openingHook) {
    return `Olá ${decisor}! ${openingHook} Teria 2 minutos para avaliarmos como automatizar isso e recuperar oportunidades sem custo inicial?`;
  }

  return `Olá ${decisor}, tudo bem? Vi o posicionamento da ${empresa}${cidade} e identifiquei uma oportunidade direta em relação a ${dor.toLowerCase()}. Conseguimos recuperar de 15% a 30% dos contatos que se perdem no WhatsApp. Teria 2 minutos nesta semana para um diagnóstico rápido?`;
}

/**
 * Retorna a URL pronta para disparo via API do WhatsApp Web / Desktop
 */
export function getWhatsAppOutreachUrl(lead: Lead, customMessage?: string): { url: string; cleanPhone: string } | null {
  const rawPhone = lead.decisionMaker?.directPhone || lead.phone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  if (!cleanPhone) return null;

  const text = customMessage || formatLeadWhatsAppMessage(lead);
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  return { url, cleanPhone };
}

/**
 * Dispara 1-Click WhatsApp abrindo nova aba ou cliente do WhatsApp
 */
export function openWhatsApp1Click(lead: Lead, customMessage?: string): boolean {
  const result = getWhatsAppOutreachUrl(lead, customMessage);
  if (!result || !result.url) return false;

  window.open(result.url, '_blank');
  return true;
}

