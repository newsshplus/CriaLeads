import React, { useState } from 'react';
import { Lead, BusinessProfile } from '../types';
import { 
  Globe, Phone, MapPin, ExternalLink, Trash2, Mail, 
  AlertTriangle, MessageSquare, PhoneCall, Zap, 
  User, Check, Copy, Award, Send, CheckCircle2,
  Instagram, Linkedin, Star, ShieldAlert, Sparkles
} from 'lucide-react';
import { openWhatsApp1Click } from '../services/whatsAppOutreachHelper';
import { calculateLeadRoiRecommendation } from '../services/roiRecommendationService';
import { generateLocalizedHumanEmail, openGmailInNewTab } from '../services/ptPtOutreachService';
import { isContactSuppressed, suppressContact, unsuppressContact } from '../services/rgpdSuppressionService';
import { resolveRealCompanyWebsite } from '../services/nicheIntelligenceService';
import { extractCleanBrandName } from '../services/freeB2bProspectorService';

interface LeadCardProps {
  lead: Lead;
  isSelected?: boolean;
  businessProfile?: BusinessProfile;
  onSelect?: (id: string) => void;
  onUpdateStatus: (id: string, status: Lead['status']) => void;
  onDelete: (id: string) => void;
  onOpenOmnichannel: (lead: Lead, tab?: 'criahub_crm' | 'cadence' | 'guardian' | 'objection_crusher' | 'whatsapp' | 'email' | 'call' | 'webhook' | 'bant' | 'tech') => void;
  onOpenLiveCopilot?: (lead: Lead) => void;
  onOpenNotes?: (lead: Lead) => void;
  onOpenCriahubDrawer?: (lead: Lead) => void;
  onOpenHunterCall?: (lead: Lead) => void;
  onOpenFocusDialer?: (lead: Lead) => void;
  onUpdateLead?: (lead: Lead) => void;
  onOpenGroqTriage?: (lead: Lead) => void;
  onOpenCockpit?: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ 
  lead, 
  isSelected, 
  businessProfile,
  onSelect, 
  onUpdateStatus, 
  onDelete,
  onOpenOmnichannel,
  onOpenCriahubDrawer,
  onOpenFocusDialer,
  onOpenHunterCall,
  onUpdateLead
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSuppressed, setIsSuppressed] = useState<boolean>(() => isContactSuppressed(lead.email, lead.phone));

  const handleToggleSuppression = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSuppressed) {
      if (window.confirm(`Deseja desbloquear o contacto ${lead.name} (${lead.email || lead.phone})?\nEle poderá voltar a receber comunicações.`)) {
        unsuppressContact(lead.email || '');
        setIsSuppressed(false);
      }
    } else {
      if (window.confirm(`Confirmar bloqueio RGPD (STOP) para ${lead.name} (${lead.email || lead.phone})?\n\nEsta ação garante proteção jurídica: nenhum e-mail ou WhatsApp poderá ser enviado a este contacto.`)) {
        suppressContact(lead.email || '', lead.phone, lead.name, 'USER_REQUEST_STOP', 'Solicitação de opt-out (STOP) sob o RGPD.');
        setIsSuppressed(true);
      }
    }
  };

  const copyToClipboard = (text: string, fieldId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isContacted = lead.status === 'contacted';

  // Análise de Veredito Rápido: LIGAR vs MANDAR EMAIL vs WHATSAPP
  const roiRec = lead.roiRecommendation || calculateLeadRoiRecommendation(lead, businessProfile);
  const primaryPhone = lead.decisionMaker?.directPhone || lead.phone || '';
  const cleanPhone = primaryPhone.replace(/\D/g, '');
  const hasPhone = Boolean(cleanPhone && cleanPhone.length >= 7);
  const isDirectDecisorPhone = Boolean(lead.decisionMaker?.directPhone);
  
  const targetEmail = lead.decisionMaker?.directEmail || lead.email || '';
  const hasEmail = Boolean(targetEmail && targetEmail.includes('@'));

  // Decisor
  const decisorName = lead.decisionMaker?.name || lead.bantPlus?.authority?.keyDecisionMaker || 'Diretoria / Decisor';
  const decisorRole = lead.decisionMaker?.role || lead.bantPlus?.authority?.role || 'Sócio / Gerência';

  // Lógica clara de decisão SDR
  let sdrActionType: 'CALL' | 'EMAIL' | 'WHATSAPP' = 'CALL';
  if (roiRec.verdict === 'EMAIL_ONLY' || (!hasPhone && hasEmail)) {
    sdrActionType = 'EMAIL';
  } else if (roiRec.verdict === 'WHATSAPP_FIRST' || (hasPhone && cleanPhone.length >= 9 && !isDirectDecisorPhone)) {
    sdrActionType = 'WHATSAPP';
  } else if (hasPhone) {
    sdrActionType = 'CALL';
  } else if (hasEmail) {
    sdrActionType = 'EMAIL';
  }

  // Gera o e-mail humanizado em PT-PT (sem brasileirismos) para o Gmail direto
  const localizedEmail = generateLocalizedHumanEmail(lead, lead.country);

  // Logo ou Favicon (resolução de sites reais, inclusive mapeamento de marcas verificadas)
  const resolvedReal = resolveRealCompanyWebsite(lead.name, lead.city, lead.country);
  const candidateWebsite = (lead.website && lead.website.trim()) || resolvedReal.website || '';
  const isRealWebsite = Boolean(
    candidateWebsite &&
    candidateWebsite.startsWith('http') &&
    !candidateWebsite.includes('google.com/maps') &&
    !candidateWebsite.includes('maps.google')
  );
  const effectiveWebsite = isRealWebsite ? candidateWebsite : '';
  const domain = effectiveWebsite ? effectiveWebsite.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0] : '';
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;
  const cleanBrand = extractCleanBrandName(lead.name);

  // Rating e Avaliações
  const rating = lead.rating || 0;
  const reviewsCount = lead.reviews || 0;

  // Classe / Score
  const score = lead.kitAluno?.score?.score ?? lead.icpScore ?? 70;
  const classe = lead.kitAluno?.score?.classificacao ?? (score >= 85 ? 'A' : score >= 65 ? 'B' : score >= 45 ? 'C' : 'D');

  // Disparo do Gmail direto
  const handleOpenGmail = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSuppressed) {
      alert(`⚠️ PROTEÇÃO RGPD / STOP ATIVA:\nO contacto "${lead.name}" (${lead.email || ''}) solicitou a exclusão dos seus dados (STOP) ou foi bloqueado. Novos envios de e-mail estão impedidos para prevenir infrações e multas.`);
      return;
    }
    openGmailInNewTab(localizedEmail.recipient, localizedEmail.subject, localizedEmail.body);
    if (onUpdateLead && lead.status !== 'contacted') {
      onUpdateLead({
        ...lead,
        status: 'contacted'
      });
    }
  };

  // Disparo do WhatsApp direto
  const handleWhatsAppClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isSuppressed) {
      alert(`⚠️ PROTEÇÃO RGPD / STOP ATIVA:\nO contacto "${lead.name}" (${lead.phone || ''}) solicitou exclusão (STOP). O disparo para o WhatsApp está bloqueado para conformidade legal.`);
      return;
    }
    const success = openWhatsApp1Click(lead);
    if (success && onUpdateLead) {
      onUpdateLead({
        ...lead,
        status: 'contacted',
        whatsAppStatus: 'sent'
      });
    } else if (!success) {
      onOpenOmnichannel(lead, 'whatsapp');
    }
  };

  // Disparo de Chamada Telefônica
  const handleStartCall = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (onOpenFocusDialer) {
      onOpenFocusDialer(lead);
    } else if (onOpenHunterCall) {
      onOpenHunterCall(lead);
    } else {
      onOpenOmnichannel(lead, 'call');
    }
  };

  // Abre a visualização aprofundada (Dossiê / Raio-X completo)
  const handleOpenDetailedDossier = () => {
    if (onOpenCriahubDrawer) {
      onOpenCriahubDrawer(lead);
    } else {
      onOpenOmnichannel(lead, 'bant');
    }
  };

  return (
    <div 
      id={`lead-card-${lead.id}`}
      onClick={handleOpenDetailedDossier}
      className={`bg-white rounded-xl border transition-all duration-150 p-4 sm:p-5 flex flex-col justify-between relative cursor-pointer group hover:shadow-md ${
        isSelected 
          ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-indigo-50/20' 
          : 'border-slate-200 hover:border-slate-300'
      } ${isContacted ? 'bg-slate-50/80 border-slate-300/80' : ''}`}
    >
      {/* TOPO: EMPRESA, LOCALIZAÇÃO & CLASSE */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {onSelect && (
              <div onClick={e => e.stopPropagation()} className="pt-0.5">
                <input 
                  type="checkbox" 
                  checked={isSelected}
                  onChange={() => onSelect(lead.id)}
                  className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            )}

            {/* Favicon / Avatar */}
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
              {faviconUrl ? (
                <img 
                  src={faviconUrl} 
                  alt="" 
                  className="w-5 h-5 object-contain"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              ) : (
                <span className="text-xs font-black text-slate-600">
                  {lead.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            {/* Nome & Categoria */}
            <div className="min-w-0 flex-1">
              <h3 
                className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-indigo-600 transition-colors break-words"
                title={lead.name}
              >
                {lead.name}
              </h3>

              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-slate-700">{lead.category || 'Empresa'}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  {lead.city}{lead.country ? `, ${lead.country}` : ''}
                </span>
                {rating > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-700 font-bold text-xs flex items-center gap-0.5">
                      ★ {rating.toFixed(1)} {reviewsCount > 0 ? `(${reviewsCount})` : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Badges: Classe & Retainer High-Ticket */}
          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 self-start pt-1 sm:pt-0">
            {isSuppressed && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
                🚫 RGPD (STOP)
              </span>
            )}
            <span 
              className={`inline-flex items-center text-xs font-extrabold px-2.5 py-1 rounded-md border shadow-2xs ${
                classe === 'A' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                classe === 'B' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                classe === 'C' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                'bg-slate-100 text-slate-700 border-slate-300'
              }`}
            >
              Classe {classe} · {score} pts
            </span>
            <span className="text-[10px] font-black text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
              <span>💎</span>
              <span>Retainer €599 - €997</span>
            </span>
          </div>
        </div>

        {/* 🎯 VEREDITO RÁPIDO DO SDR OU ALERTA DE BLOQUEIO RGPD */}
        {isSuppressed ? (
          <div className="rounded-lg p-2.5 border bg-rose-50 border-rose-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🚫</span>
                <div>
                  <span className="text-xs font-black uppercase tracking-wide text-rose-900">
                    Contacto Bloqueado (RGPD / Opt-Out "STOP")
                  </span>
                  <p className="text-[11px] text-rose-700 leading-tight">
                    Este contacto solicitou opt-out sob o RGPD. Disparos diretos de e-mail e WhatsApp estão suspensos por proteção legal.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSuppression}
                className="px-2 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 border border-rose-300 rounded transition-colors shrink-0"
                title="Desbloquear contacto"
              >
                Desbloquear
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg p-2.5 border transition-all" style={{
            backgroundColor: sdrActionType === 'CALL' ? '#ecfdf5' : sdrActionType === 'EMAIL' ? '#f0f9ff' : '#f0fdf4',
            borderColor: sdrActionType === 'CALL' ? '#a7f3d0' : sdrActionType === 'EMAIL' ? '#bae6fd' : '#bbf7d0'
          }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {sdrActionType === 'CALL' ? '📞' : sdrActionType === 'EMAIL' ? '✉️' : '💬'}
                </span>
                <div>
                  <span className={`text-xs font-black uppercase tracking-wide ${
                    sdrActionType === 'CALL' ? 'text-emerald-900' : sdrActionType === 'EMAIL' ? 'text-sky-900' : 'text-teal-900'
                  }`}>
                    {sdrActionType === 'CALL' ? 'Prioridade: Ligar Agora' : sdrActionType === 'EMAIL' ? 'Prioridade: Enviar E-mail' : 'Prioridade: WhatsApp 1-a-1'}
                  </span>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    {sdrActionType === 'CALL' 
                      ? (isDirectDecisorPhone ? 'Decisor com telefone direto mapeado — maior chance de conversão imediata' : 'Telefone disponível — ligar para filtrar recepção e falar com decisor')
                      : sdrActionType === 'EMAIL' 
                      ? 'Abordagem consultiva por e-mail recomendada (sem telefone direto ativo)' 
                      : 'Telemóvel com WhatsApp — iniciar com mensagem personalizada'}
                  </p>
                </div>
              </div>

              {/* Ticket Estimado */}
              {lead.estimatedBudget && (
                <span className="text-[10px] font-bold text-slate-700 bg-white/80 px-2 py-0.5 rounded border border-slate-200 shrink-0">
                  Ticket: {lead.estimatedBudget}
                </span>
              )}
            </div>
          </div>
        )}

        {/* DECISOR E CANAIS DE CONTATO RÁPIDO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Decisor & Telefone */}
          <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Decisor Mapeado</span>
              <span className="font-bold text-slate-900 truncate block text-xs" title={`${decisorName} (${decisorRole})`}>
                {decisorName}
              </span>
              <span className="text-[11px] text-slate-500 truncate block">
                {primaryPhone || 'Sem telefone cadastrado'}
              </span>
            </div>

            {hasPhone && (
              <button
                type="button"
                onClick={(e) => copyToClipboard(primaryPhone, 'phone', e)}
                className="p-1.5 hover:bg-slate-200 text-slate-600 rounded transition-colors shrink-0"
                title="Copiar Telefone"
              >
                {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* E-mail & Copiar */}
          <div className="p-2 bg-slate-50/80 rounded-lg border border-slate-200/80 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">E-mail Principal</span>
              <span className="font-bold text-slate-900 truncate block text-xs" title={targetEmail || 'E-mail a enriquecer'}>
                {targetEmail || 'E-mail sob consulta'}
              </span>
              <span className="text-[11px] text-slate-500 truncate block">
                {hasEmail ? 'Verificado p/ envio direto' : 'Clique no Raio-X para buscar'}
              </span>
            </div>

            {hasEmail && (
              <button
                type="button"
                onClick={(e) => copyToClipboard(targetEmail, 'email', e)}
                className="p-1.5 hover:bg-slate-200 text-slate-600 rounded transition-colors shrink-0"
                title="Copiar E-mail"
              >
                {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* CANAIS DIGITAIS 1-CLIQUE: WEBSITE, GOOGLE MAPS, YELP, WHATSAPP, GMAIL, INSTAGRAM, LINKEDIN */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1" onClick={e => e.stopPropagation()}>
          {/* Website Real ou Busca Oficial no Google */}
          {isRealWebsite ? (
            <a
              href={effectiveWebsite}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors shadow-xs"
              title={`Abrir Website Oficial: ${effectiveWebsite}`}
            >
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>Website</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
            </a>
          ) : (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`"${cleanBrand}" "${lead.city || ''}"`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
              title="Buscar empresa no Google com 1 clique (busca oficial limpa)"
            >
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              <span>Buscar no Google</span>
              <ExternalLink className="w-2.5 h-2.5 text-amber-500" />
            </a>
          )}

          {/* Google Maps */}
          {lead.googleMapsUrl && (
            <a
              href={lead.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-colors"
              title="Ver Perfil no Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Maps</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
            </a>
          )}

          {/* Yelp Business Reviews (se disponível) */}
          {lead.yelpUrl && (
            <a
              href={lead.yelpUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
              title="Ver Perfil no Yelp Business Reviews"
            >
              <Star className="w-3.5 h-3.5 text-rose-500" />
              <span>Yelp</span>
              <ExternalLink className="w-2.5 h-2.5 text-rose-400" />
            </a>
          )}

          {/* WhatsApp Direto 1-Clique */}
          {hasPhone && (
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
              title="Abrir WhatsApp com mensagem consultiva pronta"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>
          )}

          {/* Gmail Direto 1-Clique */}
          {hasEmail && (
            <button
              type="button"
              onClick={handleOpenGmail}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
              title="Abrir diretamente no Gmail já com Assunto e Corpo PT-PT preenchidos"
            >
              <Send className="w-3.5 h-3.5 text-sky-600" />
              <span>Gmail</span>
            </button>
          )}

          {/* Instagram Verificado / Link Real Operacional */}
          <a
            href={
              lead.socials?.instagram && lead.socials.instagram.startsWith('http')
                ? lead.socials.instagram
                : resolvedReal.instagram
                ? resolvedReal.instagram
                : `https://www.google.com/search?q=${encodeURIComponent(`site:instagram.com "${cleanBrand}" "${lead.city || ''}"`)}`
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-pink-700 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-md transition-colors"
            title="Ver perfil oficial no Instagram"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-600" />
            <span>Instagram</span>
            <ExternalLink className="w-2.5 h-2.5 text-pink-400" />
          </a>

          {/* LinkedIn Decisor / Empresa (Zero 404) */}
          <a
            href={
              lead.decisionMaker?.linkedin && lead.decisionMaker.linkedin.startsWith('http')
                ? lead.decisionMaker.linkedin
                : lead.socials?.linkedin && lead.socials.linkedin.startsWith('http')
                ? lead.socials.linkedin
                : `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/company/ "${lead.name}" "${lead.city || ''}"`)}`
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
            title="Ver perfil oficial ou decisor no LinkedIn"
          >
            <Linkedin className="w-3.5 h-3.5 text-blue-600" />
            <span>LinkedIn</span>
            <ExternalLink className="w-2.5 h-2.5 text-blue-400" />
          </a>
        </div>

        {/* PONTO CRÍTICO / OPORTUNIDADE EM 1 LINHA */}
        {lead.keyFlaws && lead.keyFlaws.length > 0 && (
          <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1.5 truncate pt-0.5">
            <span className="text-amber-500 font-bold shrink-0">⚡ Oportunidade:</span>
            <span className="truncate">{lead.keyFlaws[0]}</span>
          </div>
        )}
      </div>

      {/* RODAPÉ: AÇÃO PRINCIPAL E ACESSO AO DOSSIÊ DETALHADO (100% OTIMIZADO PARA MOBILE) */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2.5" onClick={e => e.stopPropagation()}>
        {/* Ações Primárias: Ligar / WhatsApp / Gmail + Dossiê High-Ticket */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          {/* Botão Primário baseado na melhor decisão (Ligar vs E-mail vs WhatsApp) */}
          {sdrActionType === 'CALL' && hasPhone ? (
            <button
              type="button"
              onClick={handleStartCall}
              className="w-full min-h-[46px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Ligar p/ Decisor</span>
            </button>
          ) : sdrActionType === 'WHATSAPP' && hasPhone ? (
            <button
              type="button"
              onClick={handleWhatsAppClick}
              className="w-full min-h-[46px] px-3 py-2 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Direto</span>
            </button>
          ) : hasEmail ? (
            <button
              type="button"
              onClick={handleOpenGmail}
              className="w-full min-h-[46px] px-3 py-2 bg-sky-600 hover:bg-sky-700 active:scale-[0.98] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Abrir no Gmail</span>
            </button>
          ) : hasPhone ? (
            <button
              type="button"
              onClick={handleStartCall}
              className="w-full min-h-[46px] px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Ligar p/ Telefone</span>
            </button>
          ) : null}

          {/* Botão Ver Dossiê Completo (Raio-X High-Ticket) */}
          <button
            type="button"
            onClick={handleOpenDetailedDossier}
            className={`w-full min-h-[46px] px-3 py-2 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] text-indigo-950 border border-indigo-200/90 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-2xs ${
              !hasPhone && !hasEmail ? 'sm:col-span-2' : ''
            }`}
            title="Abrir Dossiê High-Ticket, Proposta Comercial de €599 e €997, Calculadora ROI e Scripts ProspecPT"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Dossiê High-Ticket (€599-€997)</span>
          </button>
        </div>

        {/* Rodapé Secundário: Status Contactado + Ações (Bloquear RGPD, Excluir) */}
        <div className="flex items-center justify-between gap-2 pt-1 text-xs">
          <div>
            {isContacted ? (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Contactado</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">
                Pressione para ver dossiê 360°
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleSuppression}
              className={`min-h-[40px] min-w-[40px] p-2 rounded-xl flex items-center justify-center transition-colors ${
                isSuppressed 
                  ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200' 
                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent'
              }`}
              title={isSuppressed ? "Desbloquear Contacto (Remover da lista de supressão RGPD)" : "Bloquear RGPD (STOP) — Suprimir contacto para evitar multas"}
              aria-label="Bloquear ou desbloquear RGPD"
            >
              <ShieldAlert className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(lead.id)}
              className="min-h-[40px] min-w-[40px] p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 flex items-center justify-center transition-colors"
              title="Remover Lead"
              aria-label="Remover Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadCard;
