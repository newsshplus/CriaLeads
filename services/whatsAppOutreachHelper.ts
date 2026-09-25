import { Lead, BusinessProfile } from '../types';
import { getSavedBusinessProfile } from './storageService';
import { isContactSuppressed } from './rgpdSuppressionService';

/**
 * Formata mensagem de WhatsApp personalizada para o lead sem clichês,
 * com abordagem profissional e genérica como Estrategista Digital (Nivaldo Freitas),
 * com aviso legal RGPD de cancelamento (STOP)
 */
export function formatLeadWhatsAppMessage(lead: Lead, customProfile?: BusinessProfile): string {
  const profile = customProfile || getSavedBusinessProfile();
  const senderName = profile?.senderName?.trim() || 'Nivaldo Freitas';
  const rawDecisor = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || '';
  const isGenericDecisor = !rawDecisor || rawDecisor.toLowerCase().includes('responsável') || rawDecisor.toLowerCase().includes('diretoria') || rawDecisor.toLowerCase().includes('comercial');
  const decisor = isGenericDecisor ? '' : rawDecisor.trim();
  const empresa = lead.name;
  const isPortugal = (lead.country || '').toLowerCase().includes('portugal') || (lead.city || '').toLowerCase().includes('lisboa') || (lead.city || '').toLowerCase().includes('porto');

  if (isPortugal) {
    const saudacao = decisor ? `Olá, ${decisor}` : `Olá à equipa da ${empresa}`;
    return `${saudacao}, tudo bem? 

O meu nome é ${senderName}, sou estrategista digital independente na área de consultoria digital em Portugal.

Acompanho o vosso setor e notei que a ${empresa} tem excelente presença, mas tem uma oportunidade imediata de acelerar a triagem de contactos e agendamentos no telemóvel para não perder pedidos de clientes qualificados.

Teria 2 minutos para lhe partilhar um diagnóstico prático sem compromisso?

(Nota RGPD: Se não desejar receber mais mensagens, basta responder STOP para remover o vosso contacto permanentemente).`;
  }

  // Abordagem Brasil / Internacional
  const saudacao = decisor ? `Olá, ${decisor}` : `Olá à equipe da ${empresa}`;
  return `${saudacao}, tudo bem?

Meu nome é ${senderName}, atuo como estrategista e consultor digital independente.

Analisando o posicionamento da ${empresa}, identifiquei uma oportunidade direta de acelerar o atendimento no WhatsApp para reter mais clientes qualificados.

Teria 2 minutos nesta semana para um diagnóstico prático de melhoria?

(Nota LGPD/RGPD: Caso prefira não receber mais mensagens, basta responder com STOP).`;
}

/**
 * Retorna a URL pronta para disparo via API do WhatsApp Web / Desktop
 */
export function getWhatsAppOutreachUrl(lead: Lead, customMessage?: string): { url: string; cleanPhone: string; isSuppressed: boolean } | null {
  const isSuppressed = isContactSuppressed(lead.email, lead.phone);
  const rawPhone = lead.decisionMaker?.directPhone || lead.phone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  if (!cleanPhone) return null;

  const text = customMessage || formatLeadWhatsAppMessage(lead);
  const encodedText = encodeURIComponent(text);
  const url = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  return { url, cleanPhone, isSuppressed };
}

/**
 * Dispara 1-Click WhatsApp abrindo nova aba ou cliente do WhatsApp
 */
export function openWhatsApp1Click(lead: Lead, customMessage?: string): boolean {
  if (isContactSuppressed(lead.email, lead.phone)) {
    alert(`⚠️ ATENÇÃO - CONFORMIDADE RGPD / STOP:\nEste contacto (${lead.name}) solicitou exclusão da base (STOP) ou foi bloqueado. O envio foi cancelado.`);
    return false;
  }

  const result = getWhatsAppOutreachUrl(lead, customMessage);
  if (!result || !result.url) return false;

  window.open(result.url, '_blank');
  return true;
}

