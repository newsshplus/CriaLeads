/**
 * Serviço Especializado de Abordagem PT-PT (Português de Portugal)
 * & Abertura Direta 1-Clique no Gmail sem Fricção
 * 
 * Regras Estritas PT-PT:
 * - 0 Brasileirismos (sem "você", "time", "dobrar retenção", "dar uma olhada", "otimizando").
 * - Tratamento cortês e profissional europeu: "Escrevo-lhe", "a vossa empresa", "a nossa equipa", "contacto", "telemóvel".
 * - Tom humano, próximo e não-cliché (como continuidade de conversa ou acompanhamento de setor).
 */

import { Lead, BusinessProfile } from '../types';
import { getSavedBusinessProfile } from './storageService';

export interface LocalizedEmailData {
  recipient: string;
  subject: string;
  body: string;
  gmailComposeUrl: string;
  mailtoUrl: string;
  country: string;
  tone: string;
}

/**
 * Monta o link que abre o Gmail diretamente com destinatário, assunto e corpo pré-preenchidos
 */
export function buildDirectGmailUrl(to: string, subject: string, body: string): string {
  const cleanTo = (to || '').trim();
  const cleanSubject = encodeURIComponent(subject || '');
  const cleanBody = encodeURIComponent(body || '');
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${cleanTo}&su=${cleanSubject}&body=${cleanBody}`;
}

/**
 * Monta o link padrão mailto
 */
export function buildMailtoUrl(to: string, subject: string, body: string): string {
  const cleanTo = (to || '').trim();
  const cleanSubject = encodeURIComponent(subject || '');
  const cleanBody = encodeURIComponent(body || '');
  return `mailto:${cleanTo}?subject=${cleanSubject}&body=${cleanBody}`;
}

/**
 * Identifica se a abordagem deve ser em Português de Portugal
 */
export function isPortugalTarget(country?: string, city?: string): boolean {
  const c = (country || '').toLowerCase();
  const ci = (city || '').toLowerCase();
  return (
    c.includes('portugal') ||
    c === 'pt' ||
    ci.includes('lisboa') ||
    ci.includes('porto') ||
    ci.includes('oeiras') ||
    ci.includes('cascais') ||
    ci.includes('sintra') ||
    ci.includes('braga') ||
    ci.includes('coimbra') ||
    ci.includes('faro') ||
    ci.includes('setúbal') ||
    ci.includes('aveiro')
  );
}

/**
 * Gera e-mail executivo humanizado, contextualizado e sem clichês em Português de Portugal (ou adaptado ao país)
 */
export function generateLocalizedHumanEmail(
  lead: Lead, 
  countryContext?: string, 
  customProfile?: BusinessProfile
): LocalizedEmailData {
  const country = lead.country || countryContext || 'Portugal';
  const isPt = isPortugalTarget(country, lead.city);
  const companyName = lead.name || 'Empresa';
  const city = lead.city || 'Portugal';
  const niche = lead.category || 'o vosso setor';

  // Perfil configurado para remetente e RGPD
  const profile = customProfile || getSavedBusinessProfile();
  const senderName = profile?.senderName?.trim() || 'Nivaldo Freitas';
  const senderRole = profile?.senderRole?.trim() || 'Estrategista Digital & Consultoria Digital Independente';
  const rgpdNotice = profile?.rgpdOptOutNotice?.trim() || 
    'Aviso de Privacidade & RGPD: Esta comunicação destina-se estritamente ao âmbito profissional B2B. Caso não pretenda receber futuros contactos ou pretenda a eliminação imediata dos seus dados, responda a esta mensagem com a palavra "STOP". O seu endereço será automaticamente bloqueado no nosso sistema.';

  // Decisor
  const rawDecisor = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || '';
  const isGenericDecisor = !rawDecisor || rawDecisor.toLowerCase().includes('responsável') || rawDecisor.toLowerCase().includes('diretoria') || rawDecisor.toLowerCase().includes('comercial');
  const decisorName = isGenericDecisor ? '' : rawDecisor.trim();

  // Brecha real identificada
  const flaw = lead.keyFlaws?.[0] || lead.bantPlus?.need?.operationalFlaws?.[0] || '';
  let flawExplanationPt = 'os contactos e pedidos de orçamento que chegam através do site e redes sociais ainda não dispõem de triagem imediata por WhatsApp 24/7';
  if (flaw.toLowerCase().includes('pixel') || flaw.toLowerCase().includes('remarketing')) {
    flawExplanationPt = 'o vosso website não tem etiquetas ativas de remarketing (Pixel Meta / Google Ads), deixando de acompanhar os visitantes que não converteram de imediato';
  } else if (flaw.toLowerCase().includes('móvel') || flaw.toLowerCase().includes('mobile')) {
    flawExplanationPt = 'a versão móvel do website apresenta alguns pontos de lentidão que podem dificultar o pedido de contacto rápido no telemóvel';
  } else if (flaw.toLowerCase().includes('avalia') || flaw.toLowerCase().includes('google')) {
    flawExplanationPt = 'a vossa ficha no Google tem um excelente potencial ainda por explorar para atrair clientes de maior poder de compra na zona';
  }

  // Destinatário
  const recipient = lead.decisionMaker?.directEmail || lead.email || '';

  let subject = '';
  let body = '';

  if (isPt) {
    // E-mail em Português de Portugal puro, cordial, elegante e focado em continuidade de relação
    const saudacao = decisorName ? `Bom dia, ${decisorName},` : `Bom dia à administração da ${companyName},`;

    subject = `A propósito da ${companyName} em ${city} — breve acompanhamento`;

    body = `${saudacao}

Escrevo-lhe na sequência de uma análise e do acompanhamento independente que tenho vindo a fazer ao setor de ${niche} na zona de ${city}.

Como decerto saberá, a ${companyName} tem uma posição consolidada e de grande prestígio na região. No entanto, numa verificação recente ao vosso ecossistema de captação digital, notei um ponto prático de melhoria: ${flawExplanationPt}.

Numa conjuntura em que os clientes exigem resposta em poucos segundos no telemóvel, implementámos recentemente num parceiro do vosso ramo uma solução simples de triagem inteligente e qualificação direta, que permitiu reter dezenas de novos contratos sem necessidade de investimento pesado.

Gostaria de lhe partilhar um breve resumo em 5 minutos, sem qualquer compromisso. 

Teria disponibilidade para falarmos brevemente na próxima quinta-feira pela manhã?

Com os melhores cumprimentos,

${senderName}
${senderRole}

---
${rgpdNotice}`;
  } else {
    // Para outros países (Brasil / Espanha / Internacional)
    const saudacao = decisorName ? `Olá, ${decisorName},` : `Olá à equipe da ${companyName},`;

    subject = `Diagnóstico de captação comercial — ${companyName} (${city})`;

    body = `${saudacao}

Escrevo na sequência de uma análise independente e acompanhamento estratégico que realizo no setor de ${niche} em ${city}.

A ${companyName} possui excelente posicionamento, mas ao analisarmos a jornada digital do seu cliente, notei que ${flawExplanationPt}.

Implementamos recentemente em empresas do seu setor um sistema de triagem ágil que converte interessados de forma automática, garantindo retorno imediato.

Faria sentido conversarmos 10 minutos nesta semana para apresentar esse estudo prático?

Atenciosamente,

${senderName}
${senderRole}

---
${rgpdNotice}`;
  }

  return {
    recipient,
    subject,
    body,
    gmailComposeUrl: buildDirectGmailUrl(recipient, subject, body),
    mailtoUrl: buildMailtoUrl(recipient, subject, body),
    country,
    tone: isPt ? 'PT-PT (Formal, Humano, Sem Brasileirismos)' : 'PT-BR / Internacional'
  };
}

/**
 * Abre diretamente o Gmail em uma nova aba com o e-mail pré-preenchido
 */
export function openGmailInNewTab(to: string, subject: string, body: string): boolean {
  if (typeof window === 'undefined') return false;
  const url = buildDirectGmailUrl(to, subject, body);
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    return Boolean(win);
  } catch {
    return false;
  }
}
