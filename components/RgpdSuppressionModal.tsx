import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, Trash2, UserX, Download, 
  Plus, Search, RefreshCw, X, Check, Lock, Info 
} from 'lucide-react';
import { 
  SuppressedContact, 
  getSuppressedContacts, 
  suppressContact, 
  unsuppressContact, 
  exportSuppressionListCsv,
  clearAllSuppressed
} from '../services/rgpdSuppressionService';

interface RgpdSuppressionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RgpdSuppressionModal: React.FC<RgpdSuppressionModalProps> = ({
  isOpen,
  onClose
}) => {
  const [contacts, setContacts] = useState<SuppressedContact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const refreshList = () => {
    setContacts(getSuppressedContacts());
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() && !newPhone.trim()) {
      alert('Informe ao menos um e-mail ou telefone para bloquear.');
      return;
    }

    const ok = suppressContact(
      newEmail.trim(), 
      newPhone.trim(), 
      newCompany.trim(), 
      'MANUAL_BLOCK', 
      newNotes.trim() || 'Bloqueado manualmente no painel RGPD.'
    );

    if (ok) {
      setNewEmail('');
      setNewPhone('');
      setNewCompany('');
      setNewNotes('');
      setIsAdding(false);
      refreshList();
      showNotification('Contacto bloqueado com sucesso (adicionado à lista de supressão RGPD).');
    }
  };

  const handleUnblock = (id: string, email: string) => {
    if (window.confirm(`Deseja desbloquear o contacto ${email || id}?`)) {
      unsuppressContact(id);
      refreshList();
      showNotification('Contacto removido da lista de bloqueio.');
    }
  };

  const handleExportCsv = () => {
    const csvContent = exportSuppressionListCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rgpd_lista_supressao_stop_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Arquivo CSV de conformidade RGPD exportado.');
  };

  const handleClearAll = () => {
    if (window.confirm('ATENÇÃO: Deseja realmente limpar toda a lista de supressão RGPD? Todos os e-mails e telefones bloqueados serão liberados.')) {
      clearAllSuppressed();
      refreshList();
      showNotification('Lista de supressão limpa.');
    }
  };

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const filtered = contacts.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      c.email?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.companyName?.toLowerCase().includes(q) ||
      c.notes?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="bg-slate-900 px-5 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Conformidade RGPD & Lista de Supressão (STOP)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {contacts.length} Bloqueados
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Proteção legal contra multas RGPD/LGPD: nenhum e-mail ou WhatsApp será enviado a estes destinatários.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedbackMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Informative Banner */}
        <div className="bg-amber-50/80 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Como funciona o STOP automático:</strong> Todas as mensagens de 1º contacto de e-mail e WhatsApp incluem a instrução legal de opt-out: <em>"responda STOP para excluir vosso contacto"</em>. Ao receber a resposta ou clicar em <strong>"Bloquear RGPD"</strong> no card do lead, o e-mail entra nesta lista e o sistema corta permanentemente novos envios.
          </div>
        </div>

        {/* Actions Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por e-mail, telefone ou empresa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bloquear Manualmente</span>
            </button>

            {contacts.length > 0 && (
              <>
                <button
                  onClick={handleExportCsv}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
                  title="Exportar comprovação legal em CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Exportar CSV</span>
                </button>

                <button
                  onClick={handleClearAll}
                  className="px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                  title="Limpar todos os bloqueios"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Form for Manual Addition */}
        {isAdding && (
          <form onSubmit={handleAddManual} className="p-4 bg-rose-50/50 border-b border-rose-200 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                Adicionar Contacto à Lista de Bloqueio RGPD (STOP)
              </span>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="email"
                placeholder="E-mail a bloquear *"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400 outline-none"
              />
              <input
                type="text"
                placeholder="Telefone / WhatsApp (opcional)"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400 outline-none"
              />
              <input
                type="text"
                placeholder="Nome da Empresa (opcional)"
                value={newCompany}
                onChange={e => setNewCompany(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Motivo / Observação legal (ex: Solicitou exclusão por resposta STOP em 23/09)"
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-400 outline-none"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0"
              >
                Salvar Bloqueio
              </button>
            </div>
          </form>
        )}

        {/* Contacts Table List */}
        <div className="flex-1 overflow-y-auto p-4">
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhum contacto bloqueado no momento</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Quando um cliente responder com a palavra "STOP" ou você clicar no botão de bloqueio de um lead, ele aparecerá aqui para garantir 100% de conformidade legal.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-xs">Nenhum registo encontrado com o termo "{searchTerm}".</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">E-mail / Contacto</th>
                    <th className="py-2.5 px-3">Empresa</th>
                    <th className="py-2.5 px-3">Motivo Legal</th>
                    <th className="py-2.5 px-3">Data Bloqueio</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map(contact => (
                    <tr key={contact.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <UserX className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="font-mono text-xs">{contact.email || 'Sem e-mail'}</span>
                        </div>
                        {contact.phone && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            Tel: {contact.phone}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-600">
                        {contact.companyName || <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          {contact.reason === 'USER_REQUEST_STOP' ? 'Opt-Out (STOP)' : 'Bloqueio Manual'}
                        </span>
                        {contact.notes && (
                          <p className="text-[10px] text-slate-400 mt-0.5 max-w-xs truncate" title={contact.notes}>
                            {contact.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                        {new Date(contact.blockedAt).toLocaleDateString('pt-PT', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleUnblock(contact.id, contact.email)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-md transition-colors"
                          title="Desbloquear e permitir novos contactos"
                        >
                          Desbloquear
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Registos sob o <strong>RGPD Art. 17º (Direito ao Apagamento)</strong> e <strong>Art. 21º (Direito de Oposição)</strong>.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
