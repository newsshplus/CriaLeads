/**
 * Serviço de Conformidade RGPD (Regulamento Geral sobre a Proteção de Dados)
 * & Lista de Supressão / Bloqueio Automático (STOP)
 * 
 * Garante proteção jurídica europeia (RGPD) e brasileira (LGPD):
 * - Interrompe qualquer envio futuro a contactos que solicitaram opt-out ("STOP").
 * - Registra data/hora da exclusão para comprovação legal em auditorias.
 * - Impede acionamento acidental no Gmail, WhatsApp ou cadências automáticas.
 */

export interface SuppressedContact {
  id: string;
  email: string;
  phone?: string;
  companyName?: string;
  reason: 'USER_REQUEST_STOP' | 'MANUAL_BLOCK' | 'BOUNCE' | 'DO_NOT_CONTACT';
  blockedAt: string; // ISO Date
  notes?: string;
}

const STORAGE_KEY = 'prospector_rgpd_suppressed_contacts_v1';

/**
 * Recupera a lista completa de contactos suprimidos/bloqueados
 */
export function getSuppressedContacts(): SuppressedContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Erro ao ler lista de supressão RGPD:', err);
    return [];
  }
}

/**
 * Salva a lista de supressão no armazenamento local
 */
function saveSuppressedContacts(list: SuppressedContact[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Erro ao salvar lista de supressão RGPD:', err);
  }
}

/**
 * Normaliza e-mail para comparação segura
 */
export function normalizeEmail(email?: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Normaliza telefone para dígitos
 */
export function normalizePhone(phone?: string): string {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Verifica se um e-mail ou telefone está na lista negra/supressão RGPD
 */
export function isContactSuppressed(email?: string, phone?: string): boolean {
  const normEmail = normalizeEmail(email);
  const normPhone = normalizePhone(phone);

  if (!normEmail && !normPhone) return false;

  const list = getSuppressedContacts();
  return list.some(item => {
    if (normEmail && normalizeEmail(item.email) === normEmail) return true;
    if (normPhone && item.phone && normalizePhone(item.phone) === normPhone) return true;
    return false;
  });
}

/**
 * Adiciona um contacto à lista de bloqueio permanente (STOP)
 */
export function suppressContact(
  email: string, 
  phone?: string, 
  companyName?: string, 
  reason: SuppressedContact['reason'] = 'USER_REQUEST_STOP',
  notes?: string
): boolean {
  const normEmail = normalizeEmail(email);
  if (!normEmail && !phone) return false;

  const list = getSuppressedContacts();
  
  // Se já existir, atualiza data e motivo
  const existingIdx = list.findIndex(c => normEmail && normalizeEmail(c.email) === normEmail);
  const nowIso = new Date().toISOString();

  if (existingIdx >= 0) {
    list[existingIdx].blockedAt = nowIso;
    list[existingIdx].reason = reason;
    if (notes) list[existingIdx].notes = notes;
    if (phone) list[existingIdx].phone = phone;
    saveSuppressedContacts(list);
    return true;
  }

  const newEntry: SuppressedContact = {
    id: `suppress-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    email: normEmail,
    phone: phone ? phone.trim() : undefined,
    companyName: companyName ? companyName.trim() : undefined,
    reason,
    blockedAt: nowIso,
    notes: notes || 'Bloqueado por conformidade com a solicitação de opt-out (STOP) sob o RGPD.'
  };

  list.unshift(newEntry);
  saveSuppressedContacts(list);
  return true;
}

/**
 * Remove um contacto da lista de bloqueio
 */
export function unsuppressContact(emailOrId: string): boolean {
  const norm = normalizeEmail(emailOrId);
  const list = getSuppressedContacts();
  const initialLen = list.length;
  const filtered = list.filter(c => c.id !== emailOrId && normalizeEmail(c.email) !== norm);
  
  if (filtered.length !== initialLen) {
    saveSuppressedContacts(filtered);
    return true;
  }
  return false;
}

/**
 * Limpa toda a lista de supressão (com confirmação)
 */
export function clearAllSuppressed(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Exporta a lista de supressão em formato CSV para auditorias de conformidade legal
 */
export function exportSuppressionListCsv(): string {
  const list = getSuppressedContacts();
  const headers = ['ID', 'Email', 'Telefone', 'Empresa', 'Motivo', 'BloqueadoEm', 'Notas'];
  const rows = list.map(item => [
    item.id,
    item.email,
    item.phone || '',
    `"${(item.companyName || '').replace(/"/g, '""')}"`,
    item.reason,
    item.blockedAt,
    `"${(item.notes || '').replace(/"/g, '""')}"`
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Analisa se uma mensagem de resposta recebida é um pedido de STOP / exclusão RGPD
 */
export function isStopRequestText(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase().trim();
  const stopKeywords = [
    'stop', 'parar', 'pare', 'remover', 'remova', 
    'excluir', 'exclua', 'descadastrar', 'opt-out', 
    'optout', 'nao enviar', 'não enviar', 'rgpd', 'lgpd', 'tirar da lista'
  ];

  return stopKeywords.some(kw => {
    // Palavra exata ou contenção com fronteira
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(t);
  });
}
