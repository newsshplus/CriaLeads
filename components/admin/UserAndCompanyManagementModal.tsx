import React, { useState, useMemo } from 'react';
import { 
  Shield, Building2, Users, FileText, Settings2, Download, 
  Plus, Edit2, Trash2, CheckCircle2, XCircle, AlertTriangle, 
  Search, Filter, Clock, Sparkles, Key, Lock, UserCheck, 
  RotateCcw, ExternalLink, ChevronRight, Layers, ArrowUpRight,
  TrendingUp, BarChart3, Database, UserPlus, Cpu, RefreshCw, X,
  Check, ArrowRightLeft, UserX
} from 'lucide-react';
import { 
  UserAccount, 
  Company, 
  UserRole, 
  QuotaPeriod, 
  AllowedModulesType, 
  ApiKeyMode, 
  SearchAuditLog, 
  UserQuotaUsage 
} from '../../types/authAndQuotaTypes';
import { 
  getStoredUsers, 
  saveUsers, 
  getStoredCompanies, 
  saveCompanies, 
  getSearchAuditLogs, 
  saveSearchAuditLogs, 
  getUserEffectiveLimits, 
  calculateUserQuotaUsage, 
  resetUserQuota, 
  approveUser,
  rejectUser,
  assignUserToCompany,
  exportAuditLogsToCsv, 
  exportAuditLogsToJson,
  AVAILABLE_AI_PROVIDERS,
  AVAILABLE_PORTALS_AND_APIS
} from '../../services/authAndQuotaService';

interface UserAndCompanyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUserUpdated?: (user: UserAccount) => void;
}

export const UserAndCompanyManagementModal: React.FC<UserAndCompanyManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdated
}) => {
  // Abas disponíveis de acordo com a Role
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isCompanyAdmin = currentUser.role === 'COMPANY_ADMIN' || isSuperAdmin;

  // Abas Consolidadas Principais e Sub-Abas
  const [activeTab, setActiveTab] = useState<'reports_audit' | 'team_companies' | 'ai_policies'>('reports_audit');
  const [reportsSubTab, setReportsSubTab] = useState<'my_report' | 'audit_logs'>('my_report');
  const [teamSubTab, setTeamSubTab] = useState<'company_users' | 'pending_approvals' | 'global_companies'>(
    isSuperAdmin ? 'pending_approvals' : 'company_users'
  );

  // Dados carregados do storage
  const [users, setUsers] = useState<UserAccount[]>(() => getStoredUsers());
  const [companies, setCompanies] = useState<Company[]>(() => getStoredCompanies());
  const [auditLogs, setAuditLogs] = useState<SearchAuditLog[]>(() => getSearchAuditLogs());

  // Filtros de Auditoria
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState<'ALL' | 'b2b' | 'real_estate'>('ALL');
  const [auditCompanyFilter, setAuditCompanyFilter] = useState<string>('ALL');
  const [auditUserFilter, setAuditUserFilter] = useState<string>('ALL');

  // Filtro de Aprovações Pendentes
  const [approvalsFilter, setApprovalsFilter] = useState<'pending' | 'rejected' | 'all'>('pending');

  // Estado de criação/edição de Colaborador
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Estado de criação/edição de Empresa (Super Admin)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

  // Estado de empresa selecionada para aprovação inline por usuário
  const [selectedApprovalCompanies, setSelectedApprovalCompanies] = useState<Record<string, string>>({});

  // Notificação de feedback rápido
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const refreshAllData = () => {
    setUsers(getStoredUsers());
    setCompanies(getStoredCompanies());
    setAuditLogs(getSearchAuditLogs());
  };

  // Empresa do usuário atual
  const currentCompany = useMemo(() => {
    return companies.find(c => c.id === currentUser.companyId) || companies[0];
  }, [companies, currentUser.companyId]);

  // Usuários da empresa do usuário atual
  const companyUsers = useMemo(() => {
    if (isSuperAdmin && activeTab === 'reports_audit' && auditCompanyFilter !== 'ALL') {
      return users.filter(u => u.companyId === auditCompanyFilter);
    }
    return users.filter(u => u.companyId === currentUser.companyId);
  }, [users, currentUser.companyId, isSuperAdmin, activeTab, auditCompanyFilter]);

  // Usuários pendentes de validação
  const pendingUsers = useMemo(() => {
    return users.filter(u => u.status === 'pending_approval');
  }, [users]);

  // Usuários rejeitados
  const rejectedUsers = useMemo(() => {
    return users.filter(u => u.status === 'rejected');
  }, [users]);

  // Cota do usuário logado
  const myQuotaUsage = useMemo(() => {
    return calculateUserQuotaUsage(currentUser, auditLogs);
  }, [currentUser, auditLogs]);

  const myLimits = useMemo(() => {
    return getUserEffectiveLimits(currentUser, currentCompany);
  }, [currentUser, currentCompany]);

  // Logs filtrados
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // Se não for Super Admin nem Company Admin, vê apenas os seus próprios logs
      if (!isCompanyAdmin && log.userId !== currentUser.id) {
        return false;
      }
      // Se for Company Admin (e não Super Admin), vê apenas os logs da sua empresa
      if (!isSuperAdmin && log.companyId !== currentUser.companyId) {
        return false;
      }
      // Filtros de busca Super Admin
      if (auditCompanyFilter !== 'ALL' && log.companyId !== auditCompanyFilter) {
        return false;
      }
      if (auditUserFilter !== 'ALL' && log.userId !== auditUserFilter) {
        return false;
      }
      if (auditModuleFilter !== 'ALL' && log.module !== auditModuleFilter) {
        return false;
      }
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase();
        const match = 
          log.query.toLowerCase().includes(q) ||
          log.userName.toLowerCase().includes(q) ||
          log.location.city.toLowerCase().includes(q) ||
          log.companyName.toLowerCase().includes(q) ||
          log.searchType.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [auditLogs, currentUser, isCompanyAdmin, isSuperAdmin, auditCompanyFilter, auditUserFilter, auditModuleFilter, auditSearchQuery]);

  // Métricas agregadas da auditoria filtrada
  const auditMetrics = useMemo(() => {
    const totalSearches = filteredAuditLogs.length;
    const totalResults = filteredAuditLogs.reduce((sum, l) => sum + (l.resultsCount || 0), 0);
    const successfulSearches = filteredAuditLogs.filter(l => l.status === 'SUCCESS').length;
    const avgLatency = totalSearches > 0 
      ? Math.round(filteredAuditLogs.reduce((sum, l) => sum + (l.executionTimeMs || 0), 0) / totalSearches)
      : 0;
    const successRate = totalSearches > 0 ? Math.round((successfulSearches / totalSearches) * 100) : 100;

    return { totalSearches, totalResults, avgLatency, successRate };
  }, [filteredAuditLogs]);

  if (!isOpen) return null;

  // Handler de Aprovação de Usuário pelo Super Admin
  const handleApproveUserAction = (user: UserAccount, targetCompanyId?: string) => {
    const chosenCompanyId = targetCompanyId || selectedApprovalCompanies[user.id] || user.companyId;
    
    // Se a empresa foi reatribuída, move primeiro
    if (chosenCompanyId && chosenCompanyId !== user.companyId) {
      assignUserToCompany(user.id, chosenCompanyId);
    }
    
    const success = approveUser(user.id);
    if (success) {
      refreshAllData();
      const comp = companies.find(c => c.id === chosenCompanyId);
      showToast(`Acesso de ${user.name} APROVADO com sucesso para ${comp ? comp.name : user.companyName}!`, 'success');
    } else {
      showToast('Erro ao aprovar usuário.', 'error');
    }
  };

  // Handler de Rejeição de Usuário
  const handleRejectUserAction = (user: UserAccount) => {
    if (confirm(`Deseja realmente rejeitar o cadastro de ${user.name} (${user.email})?`)) {
      const success = rejectUser(user.id);
      if (success) {
        refreshAllData();
        showToast(`Cadastro de ${user.name} rejeitado.`, 'info');
      } else {
        showToast('Erro ao rejeitar usuário.', 'error');
      }
    }
  };

  // Handler de Reatribuição de Empresa para Usuário
  const handleReassignUserCompany = (userId: string, targetCompanyId: string) => {
    const success = assignUserToCompany(userId, targetCompanyId);
    if (success) {
      refreshAllData();
      const comp = companies.find(c => c.id === targetCompanyId);
      showToast(`Usuário transferido com sucesso para a empresa ${comp?.name}!`, 'success');
    }
  };

  // Handler de Reset Manual de Cota de um Colaborador
  const handleResetUserQuota = (userId: string, userName: string) => {
    if (confirm(`Deseja realmente zerar o consumo atual de buscas de ${userName}? O colaborador poderá buscar novamente de imediato.`)) {
      resetUserQuota(userId);
      refreshAllData();
      showToast(`Cota de ${userName} renovada com sucesso!`, 'success');
    }
  };

  // Handler de Alternar Status de Usuário (Ativo/Suspenso)
  const handleToggleUserStatus = (user: UserAccount) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const updated = users.map(u => u.id === user.id ? { ...u, status: newStatus as any } : u);
    setUsers(updated);
    saveUsers(updated);
    showToast(`Usuário ${user.name} agora está ${newStatus === 'active' ? 'Ativo' : 'Suspenso'}.`, 'info');
  };

  // Salvar Colaborador (Novo ou Editado)
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    let updatedUsers: UserAccount[];
    const isNew = !users.some(u => u.id === editingUser.id);

    // Ajusta o nome da empresa correspondente se o ID foi alterado
    const matchedComp = companies.find(c => c.id === editingUser.companyId);
    const userToSave: UserAccount = {
      ...editingUser,
      companyName: matchedComp ? matchedComp.name : editingUser.companyName
    };

    if (isNew) {
      updatedUsers = [...users, { ...userToSave, createdAt: new Date().toISOString() }];
      showToast(`Colaborador ${userToSave.name} cadastrado com sucesso!`, 'success');
    } else {
      updatedUsers = users.map(u => u.id === userToSave.id ? userToSave : u);
      showToast(`Colaborador ${userToSave.name} atualizado!`, 'success');
      if (userToSave.id === currentUser.id && onUserUpdated) {
        onUserUpdated(userToSave);
      }
    }

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  // Salvar Empresa (Super Admin)
  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompany) return;

    let updatedCompanies: Company[];
    const isNew = !companies.some(c => c.id === editingCompany.id);

    if (isNew) {
      updatedCompanies = [...companies, { ...editingCompany, createdAt: new Date().toISOString() }];
      showToast(`Empresa "${editingCompany.name}" criada com sucesso!`, 'success');
    } else {
      updatedCompanies = companies.map(c => c.id === editingCompany.id ? editingCompany : c);
      showToast(`Empresa "${editingCompany.name}" atualizada!`, 'success');
    }

    setCompanies(updatedCompanies);
    saveCompanies(updatedCompanies);
    setIsCompanyModalOpen(false);
    setEditingCompany(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white">
                  Painel de Controle & Gestão Multi-Tenant
                </h2>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentUser.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : currentUser.role === 'COMPANY_ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'}`}>
                  {currentUser.role === 'SUPER_ADMIN' ? '👑 Super Admin' : currentUser.role === 'COMPANY_ADMIN' ? '🏢 Gestor / Admin Empresa' : '👤 Colaborador'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>{currentUser.name}</span>
                <span>•</span>
                <span className="text-slate-300 font-medium">{currentUser.companyName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas Superiores Consolidadas */}
        <div className="border-b border-slate-800 bg-slate-950/70 px-4 sm:px-6 pt-3 pb-3">
          <div className="flex items-center gap-1.5 sm:gap-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab('reports_audit')}
              className={`flex-1 min-w-[120px] py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                activeTab === 'reports_audit'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Relatórios & Cotas</span>
            </button>

            {isCompanyAdmin && (
              <button
                onClick={() => setActiveTab('team_companies')}
                className={`flex-1 min-w-[140px] py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all relative ${
                  activeTab === 'team_companies'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Colaboradores & Empresas</span>
                {isSuperAdmin && pendingUsers.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                    {pendingUsers.length}
                  </span>
                )}
              </button>
            )}

            {isCompanyAdmin && (
              <button
                onClick={() => setActiveTab('ai_policies')}
                className={`flex-1 min-w-[100px] py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'ai_policies'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Cpu className="w-4 h-4 shrink-0" />
                <span>Políticas de IA</span>
              </button>
            )}
          </div>
        </div>

        {/* Super Admin Status Banner */}
        {isSuperAdmin && (
          <div className="mx-4 sm:mx-6 mt-3 p-2.5 bg-gradient-to-r from-purple-950/60 via-indigo-950/50 to-purple-950/60 border border-purple-500/40 rounded-xl flex items-center justify-between text-xs text-purple-200">
            <div className="flex items-center gap-2">
              <span className="text-base">👑</span>
              <div>
                <strong className="text-white font-bold">Super Admin Master Ativo:</strong> {currentUser.email} • Cotas Ilimitadas (∞), Validação Central de Cadastros e Gestão Multi-Empresas
              </div>
            </div>
            {pendingUsers.length > 0 && (
              <button
                onClick={() => {
                  setActiveTab('team_companies');
                  setTeamSubTab('pending_approvals');
                }}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{pendingUsers.length} {pendingUsers.length === 1 ? 'cadastro pendente' : 'cadastros pendentes'}</span>
              </button>
            )}
          </div>
        )}

        {/* Toast Notification */}
        {toastMsg && (
          <div className={`mx-4 sm:mx-6 mt-3 p-3 rounded-xl flex items-center justify-between text-xs transition-all ${toastMsg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300' : toastMsg.type === 'error' ? 'bg-red-950/80 border border-red-500/40 text-red-300' : 'bg-indigo-950/80 border border-indigo-500/40 text-indigo-300'}`}>
            <span>{toastMsg.text}</span>
            <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white ml-2">×</button>
          </div>
        )}

        {/* Conteúdo Principal com Rolagem */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* ================= ABA 1: RELATÓRIOS & AUDITORIA ================= */}
          {activeTab === 'reports_audit' && (
            <div className="space-y-5">
              {/* Sub-Navegação de Relatórios */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <button
                  onClick={() => setReportsSubTab('my_report')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    reportsSubTab === 'my_report'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Meu Saldo & Resumo de Cota</span>
                </button>

                <button
                  onClick={() => setReportsSubTab('audit_logs')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    reportsSubTab === 'audit_logs'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Auditoria Completa de Pesquisas ({filteredAuditLogs.length})</span>
                </button>
              </div>

              {/* Sub-Aba 1.1: Meu Relatório Pessoal */}
              {reportsSubTab === 'my_report' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span>Buscas no Período ({myLimits.quotaPeriod === 'daily' ? 'Hoje' : myLimits.quotaPeriod === 'weekly' ? 'Esta Semana' : 'Este Mês'})</span>
                        <Search className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-white">
                        {myQuotaUsage.searchesPerformed} <span className="text-sm font-normal text-slate-400">/ {myLimits.searchesLimit >= 99999 ? '∞' : myLimits.searchesLimit}</span>
                      </div>
                      <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full ${myQuotaUsage.isLimitReached ? 'bg-red-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${Math.min(100, (myQuotaUsage.searchesPerformed / Math.max(1, myLimits.searchesLimit >= 99999 ? 100 : myLimits.searchesLimit)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span>Resultados Coletados</span>
                        <Database className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-2xl font-extrabold text-emerald-400">
                        {myQuotaUsage.resultsGathered}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Leads corporativos e imóveis garimpados
                      </p>
                    </div>

                    <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
                        <span>Módulos Liberados</span>
                        <Layers className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="text-sm font-bold text-white mt-1">
                        {myLimits.allowedModules === 'both' ? 'B2B Empresas + Imóveis FSBO' : myLimits.allowedModules === 'b2b' ? 'Apenas B2B Empresas' : 'Apenas Imóveis FSBO'}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Max {myLimits.resultsPerSearchLimit} registros por pesquisa
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Aba 1.2: Auditoria Master de Todas as Buscas */}
              {reportsSubTab === 'audit_logs' && (
                <div className="space-y-6">
                  {/* Cards de Métricas da Auditoria */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                      <div className="text-xs text-slate-400">Total de Pesquisas</div>
                      <div className="text-2xl font-extrabold text-white mt-1">{auditMetrics.totalSearches}</div>
                    </div>

                    <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                      <div className="text-xs text-slate-400">Leads / Imóveis Coletados</div>
                      <div className="text-2xl font-extrabold text-emerald-400 mt-1">{auditMetrics.totalResults}</div>
                    </div>

                    <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                      <div className="text-xs text-slate-400">Taxa de Sucesso</div>
                      <div className="text-2xl font-extrabold text-indigo-300 mt-1">{auditMetrics.successRate}%</div>
                    </div>

                    <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                      <div className="text-xs text-slate-400">Tempo Médio de Resposta</div>
                      <div className="text-2xl font-extrabold text-amber-400 mt-1">{auditMetrics.avgLatency} ms</div>
                    </div>
                  </div>

                  {/* Barra de Filtros & Exportações */}
                  <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 flex-1">
                      {/* Busca textual */}
                      <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={auditSearchQuery}
                          onChange={(e) => setAuditSearchQuery(e.target.value)}
                          placeholder="Filtrar por nicho, termo, cidade, usuário..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Filtro de Módulo */}
                      <select
                        value={auditModuleFilter}
                        onChange={(e) => setAuditModuleFilter(e.target.value as any)}
                        className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                      >
                        <option value="ALL">Todos os Módulos</option>
                        <option value="b2b">🏢 B2B Empresas</option>
                        <option value="real_estate">🏠 Imóveis FSBO</option>
                      </select>

                      {/* Filtro de Empresa (apenas Super Admin) */}
                      {isSuperAdmin && (
                        <select
                          value={auditCompanyFilter}
                          onChange={(e) => {
                            setAuditCompanyFilter(e.target.value);
                            setAuditUserFilter('ALL');
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                        >
                          <option value="ALL">Todas as Empresas</option>
                          {companies.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      )}

                      {/* Filtro de Usuário */}
                      {isCompanyAdmin && (
                        <select
                          value={auditUserFilter}
                          onChange={(e) => setAuditUserFilter(e.target.value)}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
                        >
                          <option value="ALL">Todos os Usuários</option>
                          {companyUsers.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => exportAuditLogsToCsv(filteredAuditLogs, 'relatorio_auditoria_completo.csv')}
                        className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Exportar CSV Completo
                      </button>
                      <button
                        onClick={() => exportAuditLogsToJson(filteredAuditLogs, 'relatorio_auditoria_completo.json')}
                        className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Database className="w-3.5 h-3.5" />
                        JSON
                      </button>
                    </div>
                  </div>

                  {/* Tabela de Auditoria Completa */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 overflow-hidden">
                    <div className="overflow-x-auto max-h-[420px]">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-700 sticky top-0 z-10">
                          <tr>
                            <th className="py-3 px-3">Data / Hora</th>
                            <th className="py-3 px-3">Usuário / Empresa</th>
                            <th className="py-3 px-3">Módulo</th>
                            <th className="py-3 px-3">Palavra-Chave / Nicho</th>
                            <th className="py-3 px-3">Localização</th>
                            <th className="py-3 px-3">Fontes / Portais</th>
                            <th className="py-3 px-3">IA / API Key</th>
                            <th className="py-3 px-3 text-center">Resultados</th>
                            <th className="py-3 px-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {filteredAuditLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-800/60 transition-colors">
                              <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{log.formattedDate}</td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-white">{log.userName}</div>
                                <div className="text-[10px] text-slate-400">{log.companyName}</div>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${log.module === 'b2b' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                                  {log.module === 'b2b' ? '🏢 B2B' : '🏠 Imóveis'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-semibold text-white">{log.query}</td>
                              <td className="py-3 px-3 text-slate-300">{log.location.city} ({log.location.country})</td>
                              <td className="py-3 px-3 text-slate-400">{(log.targetPortalsOrSources || []).join(', ')}</td>
                              <td className="py-3 px-3">
                                <div className="text-slate-200">{log.aiProviderUsed || 'IA Padrão'}</div>
                                <div className="text-[10px] text-slate-400">
                                  {log.apiKeyModeUsed === 'corporate' ? '🔑 Corp' : '🔑 BYOK'}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center font-bold text-emerald-400">
                                {log.resultsCount}
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${log.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                  {log.status === 'SUCCESS' ? 'Sucesso' : log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= ABA 2: COLABORADORES & EMPRESAS ================= */}
          {activeTab === 'team_companies' && isCompanyAdmin && (
            <div className="space-y-5">
              {/* Sub-Navegação para Super Admin / Company Admin */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                {isSuperAdmin && (
                  <button
                    onClick={() => setTeamSubTab('pending_approvals')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 relative ${
                      teamSubTab === 'pending_approvals'
                        ? 'bg-amber-600/30 text-amber-200 border border-amber-500/60'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Aprovações de Cadastros</span>
                    {pendingUsers.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black animate-pulse">
                        {pendingUsers.length}
                      </span>
                    )}
                  </button>
                )}

                <button
                  onClick={() => setTeamSubTab('company_users')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                    teamSubTab === 'company_users'
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isSuperAdmin ? 'Todos os Usuários Ativos' : 'Colaboradores da Empresa'} ({companyUsers.length})</span>
                </button>

                {isSuperAdmin && (
                  <button
                    onClick={() => setTeamSubTab('global_companies')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      teamSubTab === 'global_companies'
                        ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Empresas & Multi-Tenant ({companies.length})</span>
                  </button>
                )}
              </div>

              {/* Sub-Aba 2.0: Fila de Validação e Aprovação do Super Admin */}
              {isSuperAdmin && teamSubTab === 'pending_approvals' && (
                <div className="space-y-6">
                  <div className="p-5 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                        🛡️ Controle de Acesso Obrigatório
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-1.5">
                        Validação de Novos Cadastros & Vinculação de Empresas
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
                        Nenhum usuário obtém acesso direto sem a validação do Super Admin. Se o usuário digitou uma empresa incorreta no cadastro, você pode transferi-lo para a empresa correta e aprovar seu acesso ao plano correspondente.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
                      <button
                        onClick={() => setApprovalsFilter('pending')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          approvalsFilter === 'pending'
                            ? 'bg-amber-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Pendentes ({pendingUsers.length})
                      </button>
                      <button
                        onClick={() => setApprovalsFilter('rejected')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          approvalsFilter === 'rejected'
                            ? 'bg-red-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Rejeitados ({rejectedUsers.length})
                      </button>
                      <button
                        onClick={() => setApprovalsFilter('all')}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          approvalsFilter === 'all'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Todos ({users.length})
                      </button>
                    </div>
                  </div>

                  {/* Listagem de Usuários para Aprovação */}
                  {(() => {
                    const listToDisplay = approvalsFilter === 'pending'
                      ? pendingUsers
                      : approvalsFilter === 'rejected'
                      ? rejectedUsers
                      : users;

                    if (listToDisplay.length === 0) {
                      return (
                        <div className="p-12 text-center bg-slate-800/30 border border-slate-800 rounded-2xl space-y-3">
                          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                          <h4 className="text-base font-bold text-white">Nenhum cadastro com este filtro</h4>
                          <p className="text-xs text-slate-400 max-w-md mx-auto">
                            Todos os novos cadastros foram validados. Quando novos clientes ou colaboradores solicitarem acesso, eles aparecerão aqui instantaneamente.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 gap-3.5">
                        {listToDisplay.map(user => {
                          const currentChosenCompanyId = selectedApprovalCompanies[user.id] || user.companyId;
                          const currentTargetComp = companies.find(c => c.id === currentChosenCompanyId);
                          const isPending = user.status === 'pending_approval';
                          const isRejected = user.status === 'rejected';

                          return (
                            <div 
                              key={user.id} 
                              className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                isPending 
                                  ? 'bg-slate-800/70 border-amber-500/50 shadow-lg shadow-amber-950/20' 
                                  : isRejected 
                                  ? 'bg-slate-900/60 border-red-900/50 opacity-80' 
                                  : 'bg-slate-900/60 border-slate-800'
                              }`}
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                {/* Informações do Usuário */}
                                <div className="space-y-1.5 flex-1">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                                      {user.name}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                      user.status === 'pending_approval' 
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                                        : user.status === 'rejected'
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    }`}>
                                      {user.status === 'pending_approval' ? '⏳ Aguardando Aprovação' : user.status === 'rejected' ? '❌ Rejeitado' : '✅ Ativo'}
                                    </span>
                                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[10px] font-semibold">
                                      {user.role === 'COMPANY_ADMIN' ? 'Gestor de Empresa' : 'Colaborador SDR'}
                                    </span>
                                  </div>

                                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1">
                                    <span><strong>Email:</strong> {user.email}</span>
                                    <span><strong>Módulos:</strong> {user.customAllowedModules === 'both' ? 'B2B + Imóveis' : user.customAllowedModules === 'b2b' ? 'B2B' : 'Imóveis'}</span>
                                    <span className="text-slate-400"><strong>Data:</strong> {new Date(user.createdAt).toLocaleDateString('pt-BR')} {new Date(user.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                </div>

                                {/* Reatribuição de Empresa & Ações */}
                                <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                                  <div className="space-y-1">
                                    <label className="block text-[10px] font-bold uppercase text-slate-400">
                                      Vincular à Empresa / Plano:
                                    </label>
                                    <select
                                      value={currentChosenCompanyId}
                                      onChange={(e) => {
                                        const newCompId = e.target.value;
                                        setSelectedApprovalCompanies(prev => ({ ...prev, [user.id]: newCompId }));
                                        // Se o usuário já estava ativo, aplica a reatribuição imediata
                                        if (user.status === 'active') {
                                          handleReassignUserCompany(user.id, newCompId);
                                        }
                                      }}
                                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:ring-1 focus:ring-indigo-500 outline-none max-w-[220px]"
                                    >
                                      {companies.map(c => (
                                        <option key={c.id} value={c.id}>
                                          {c.name} ({c.planName})
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div className="flex items-center gap-2 pt-3 sm:pt-0">
                                    <button
                                      onClick={() => handleApproveUserAction(user, currentChosenCompanyId)}
                                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                                      title="Aprovar cadastro e liberar acesso imediato com o plano selecionado"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>{user.status === 'active' ? 'Salvar Empresa' : 'Aprovar Acesso'}</span>
                                    </button>

                                    {user.status !== 'rejected' && user.id !== currentUser.id && (
                                      <button
                                        onClick={() => handleRejectUserAction(user)}
                                        className="px-3 py-2 bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 font-semibold text-xs rounded-xl transition-all flex items-center gap-1"
                                        title="Rejeitar solicitação"
                                      >
                                        <UserX className="w-3.5 h-3.5" />
                                        <span>Rejeitar</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => {
                                        setEditingUser({ ...user });
                                        setIsUserModalOpen(true);
                                      }}
                                      className="p-2 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl transition-colors"
                                      title="Editar todos os limites e cotas detalhadamente"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Sub-Aba 2.1: Colaboradores da Empresa */}
              {teamSubTab === 'company_users' && (
                <div className="space-y-6">
                  {/* Visão Geral da Empresa */}
                  <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full">
                        Plano Ativo da Empresa
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-1.5">{currentCompany.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {currentCompany.planName} • Limite Global: {currentCompany.maxSearchesPerPeriod} buscas/{currentCompany.quotaPeriod === 'daily' ? 'dia' : currentCompany.quotaPeriod === 'weekly' ? 'semana' : 'mês'} • Max {currentCompany.maxResultsPerSearch} resultados/busca
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          const newUser: UserAccount = {
                            id: `user-${Date.now()}`,
                            name: '',
                            email: '',
                            password: '123',
                            role: 'USER',
                            companyId: currentCompany.id,
                            companyName: currentCompany.name,
                            status: 'active',
                            customLimitsEnabled: true,
                            customSearchesLimit: 10,
                            customResultsPerSearchLimit: 10,
                            customTotalResultsLimit: 100,
                            customQuotaPeriod: currentCompany.quotaPeriod,
                            customAllowedModules: currentCompany.allowedModules,
                            customAllowedAiProviders: currentCompany.allowedAiProviders,
                            customAllowedApis: currentCompany.allowedApis,
                            customApiKeyMode: currentCompany.apiKeyMode,
                            createdAt: new Date().toISOString()
                          };
                          setEditingUser(newUser);
                          setIsUserModalOpen(true);
                        }}
                        className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Cadastrar Diretamente pelo Admin
                      </button>
                    </div>
                  </div>

                  {/* Tabela de Colaboradores */}
                  <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-400" />
                        Colaboradores ({companyUsers.length} / {currentCompany.maxUsers} Usuários Contratados)
                      </h3>
                      <span className="text-xs text-slate-400">
                        Clique em "Editar" para alterar limites individuais ou reatribuir empresa.
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700">
                          <tr>
                            <th className="py-3 px-3">Colaborador</th>
                            <th className="py-3 px-3">Função / Role</th>
                            <th className="py-3 px-3">Módulos Liberados</th>
                            <th className="py-3 px-3">Consumo / Cota</th>
                            <th className="py-3 px-3">Status</th>
                            <th className="py-3 px-3 text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {companyUsers.map(u => {
                            const usage = calculateUserQuotaUsage(u, auditLogs);
                            const limits = getUserEffectiveLimits(u, currentCompany);

                            return (
                              <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                                <td className="py-3 px-3">
                                  <div className="font-semibold text-white">{u.name}</div>
                                  <div className="text-[11px] text-slate-400">{u.email}</div>
                                  {isSuperAdmin && (
                                    <div className="text-[10px] text-indigo-300 font-mono mt-0.5">{u.companyName}</div>
                                  )}
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${u.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : u.role === 'COMPANY_ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                                    {u.role === 'SUPER_ADMIN' ? '👑 Super Admin' : u.role === 'COMPANY_ADMIN' ? '🏢 Gestor / Admin' : '👤 Colaborador SDR'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className="text-slate-300 font-medium">
                                    {limits.allowedModules === 'both' ? 'B2B + Imóveis' : limits.allowedModules === 'b2b' ? 'Apenas B2B' : 'Apenas Imóveis'}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold ${usage.isLimitReached ? 'text-red-400' : 'text-emerald-400'}`}>
                                      {usage.searchesPerformed} / {limits.searchesLimit >= 99999 ? '∞' : limits.searchesLimit}
                                    </span>
                                    <span className="text-[11px] text-slate-400">
                                      ({limits.quotaPeriod === 'daily' ? 'dia' : limits.quotaPeriod === 'weekly' ? 'semana' : 'mês'})
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    Max {limits.resultsPerSearchLimit} res/busca • {usage.resultsGathered} res coletados
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : u.status === 'pending_approval' ? 'bg-amber-500/20 text-amber-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {u.status === 'active' ? 'Ativo' : u.status === 'pending_approval' ? 'Pendente' : 'Suspenso'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {u.status === 'pending_approval' && isSuperAdmin && (
                                      <button
                                        onClick={() => handleApproveUserAction(u)}
                                        title="Aprovar Acesso Imediatamente"
                                        className="p-1.5 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 transition-colors"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleResetUserQuota(u.id, u.name)}
                                      title="Renovar / Zerar Cota Agora"
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingUser({ ...u });
                                        setIsUserModalOpen(true);
                                      }}
                                      title="Editar Usuário, Empresa e Limites"
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    {u.id !== currentUser.id && u.role !== 'SUPER_ADMIN' && (
                                      <button
                                        onClick={() => handleToggleUserStatus(u)}
                                        title={u.status === 'active' ? 'Suspender Usuário' : 'Ativar Usuário'}
                                        className={`p-1.5 rounded-lg transition-colors ${u.status === 'active' ? 'bg-slate-800 hover:bg-red-900/50 text-red-400' : 'bg-slate-800 hover:bg-emerald-900/50 text-emerald-400'}`}
                                      >
                                        {u.status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Aba 2.2: Empresas Globais (Super Admin) */}
              {isSuperAdmin && teamSubTab === 'global_companies' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-400" />
                        Empresas & Contratos Corporativos Cadastrados
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Controle mestre de planos, cotas máximas da empresa, limites por usuário e módulos contratados.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const newComp: Company = {
                          id: `company-${Date.now()}`,
                          name: '',
                          documentNumber: '',
                          planName: 'Plano Customizado (Mensal)',
                          status: 'active',
                          maxUsers: 10,
                          maxSearchesPerPeriod: 100,
                          maxResultsPerSearch: 10,
                          maxTotalResultsPerPeriod: 100,
                          quotaPeriod: 'daily',
                          allowedModules: 'both',
                          allowedAiProviders: ['gemini', 'groq', 'openai'],
                          allowedApis: ['gmaps', 'apollo', 'idealista', 'olx'],
                          apiKeyMode: 'corporate',
                          createdAt: new Date().toISOString()
                        };
                        setEditingCompany(newComp);
                        setIsCompanyModalOpen(true);
                      }}
                      className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Cadastrar Nova Empresa
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {companies.map(c => {
                      const companyUserList = users.filter(u => u.companyId === c.id);
                      const companyLogs = auditLogs.filter(l => l.companyId === c.id);
                      const totalCompanySearches = companyLogs.length;

                      return (
                        <div key={c.id} className="p-5 bg-slate-800/50 border border-slate-700/60 rounded-2xl space-y-4 hover:border-slate-600 transition-all">
                          <div className="flex items-start justify-between">
                            <div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.status === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                {c.status === 'active' ? 'Plano Ativo' : 'Suspenso'}
                              </span>
                              <h4 className="text-base font-bold text-white mt-1.5">{c.name}</h4>
                              <div className="text-[11px] text-slate-400">{c.planName}</div>
                            </div>

                            <button
                              onClick={() => {
                                setEditingCompany({ ...c });
                                setIsCompanyModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 bg-slate-900/60 rounded-xl">
                              <div className="text-slate-400 text-[10px]">Colaboradores</div>
                              <div className="text-sm font-bold text-white mt-0.5">
                                {companyUserList.length} / {c.maxUsers}
                              </div>
                            </div>

                            <div className="p-2.5 bg-slate-900/60 rounded-xl">
                              <div className="text-slate-400 text-[10px]">Buscas Realizadas</div>
                              <div className="text-sm font-bold text-indigo-300 mt-0.5">
                                {totalCompanySearches} total
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1 text-[11px] text-slate-300 border-t border-slate-700/60 pt-3">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Cota da Empresa:</span>
                              <span className="font-semibold">{c.maxSearchesPerPeriod} buscas/{c.quotaPeriod === 'daily' ? 'dia' : c.quotaPeriod === 'weekly' ? 'sem' : 'mês'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Módulos:</span>
                              <span className="font-semibold text-emerald-300">
                                {c.allowedModules === 'both' ? 'B2B + Imóveis' : c.allowedModules === 'b2b' ? 'Apenas B2B' : 'Apenas Imóveis'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Modo de Chave API:</span>
                              <span className="font-semibold text-amber-300">
                                {c.apiKeyMode === 'corporate' ? 'Chave Corporativa' : 'BYOK (Chave Própria)'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= ABA 3: POLÍTICAS DE IA & API KEYS ================= */}
          {activeTab === 'ai_policies' && isCompanyAdmin && (
            <div className="space-y-6">
              <div className="p-5 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    Controle de Modelos de IA & Diretiva de API Keys
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Defina quais provedores de Inteligência Artificial sua equipe pode usar e se cada colaborador deve cadastrar sua própria chave (BYOK) ou utilizar a chave corporativa da empresa.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      Modo de API Key da Empresa
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Selecione se os colaboradores usarão a cota corporativa fornecida pela empresa ou se cada um precisará inserir suas próprias chaves de API.
                    </p>

                    <div className="space-y-2 pt-1">
                      <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 cursor-pointer">
                        <input
                          type="radio"
                          name="apiKeyMode"
                          checked={currentCompany.apiKeyMode === 'corporate'}
                          onChange={() => {
                            const updated = companies.map(c => c.id === currentCompany.id ? { ...c, apiKeyMode: 'corporate' as any } : c);
                            setCompanies(updated);
                            saveCompanies(updated);
                            showToast('Modo de Chave Corporativa ativado para toda a empresa.', 'success');
                          }}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">Chave Corporativa Compartilhada</div>
                          <div className="text-[10px] text-slate-400">A empresa centraliza as chaves e os colaboradores não precisam configurar nada.</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2.5 p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 cursor-pointer">
                        <input
                          type="radio"
                          name="apiKeyMode"
                          checked={currentCompany.apiKeyMode === 'byok'}
                          onChange={() => {
                            const updated = companies.map(c => c.id === currentCompany.id ? { ...c, apiKeyMode: 'byok' as any } : c);
                            setCompanies(updated);
                            saveCompanies(updated);
                            showToast('Modo BYOK (Bring Your Own Key) ativado.', 'info');
                          }}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="text-xs font-semibold text-white">BYOK (Bring Your Own Key)</div>
                          <div className="text-[10px] text-slate-400">Cada usuário ou departamento deve inserir suas próprias chaves de API nas configurações.</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/60 border border-slate-700 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Provedores de IA Habilitados
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Marque quais empresas de Inteligência Artificial estão liberadas para a prospecção da sua empresa:
                    </p>

                    <div className="space-y-2">
                      {AVAILABLE_AI_PROVIDERS.map(ai => {
                        const isEnabled = (currentCompany.allowedAiProviders || []).includes(ai.id);

                        return (
                          <label key={ai.id} className="flex items-center justify-between p-2.5 bg-slate-800/50 border border-slate-700/60 rounded-lg cursor-pointer hover:bg-slate-800">
                            <div>
                              <div className="text-xs font-semibold text-white">{ai.name}</div>
                              <div className="text-[10px] text-slate-400">{ai.company}</div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => {
                                const list = currentCompany.allowedAiProviders || [];
                                const updatedList = e.target.checked 
                                  ? [...list, ai.id]
                                  : list.filter(id => id !== ai.id);
                                const updatedCompanies = companies.map(c => c.id === currentCompany.id ? { ...c, allowedAiProviders: updatedList } : c);
                                setCompanies(updatedCompanies);
                                saveCompanies(updatedCompanies);
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal Principal */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Autenticado como: <strong className="text-slate-200">{currentUser.name}</strong> ({currentUser.email})
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Fechar Painel
          </button>
        </div>
      </div>

      {/* ================= MODAL DE EDITAR/ADICIONAR COLABORADOR ================= */}
      {isUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {users.some(u => u.id === editingUser.id) ? 'Editar Usuário, Empresa & Limites' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Empresa Vinculada (Super Admin pode transferir para qualquer empresa) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-xs font-bold text-indigo-300 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Empresa Vinculada / Plano Aplicado *</span>
                  </label>
                  <select
                    value={editingUser.companyId}
                    onChange={(e) => {
                      const selectedComp = companies.find(c => c.id === e.target.value);
                      if (selectedComp) {
                        setEditingUser({
                          ...editingUser,
                          companyId: selectedComp.id,
                          companyName: selectedComp.name
                        });
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.planName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Senha de Acesso *</label>
                  <input
                    type="text"
                    value={editingUser.password || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    placeholder="Defina a senha do colaborador"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Função / Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="USER">👤 Colaborador / SDR</option>
                    <option value="COMPANY_ADMIN">🏢 Gestor / Admin da Empresa</option>
                    {isSuperAdmin && <option value="SUPER_ADMIN">👑 Super Admin Master</option>}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Status de Acesso</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="active">✅ Ativo (Acesso Liberado)</option>
                    <option value="pending_approval">⏳ Pendente de Validação do Super Admin</option>
                    <option value="suspended">🚫 Suspenso</option>
                    <option value="rejected">❌ Rejeitado</option>
                  </select>
                </div>
              </div>

              {/* Configurações de Limites e Cotas */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">Configuração de Limites & Módulos</span>
                  <label className="flex items-center gap-2 text-xs text-slate-400">
                    <input
                      type="checkbox"
                      checked={editingUser.customLimitsEnabled !== false}
                      onChange={(e) => setEditingUser({ ...editingUser, customLimitsEnabled: e.target.checked })}
                      className="rounded"
                    />
                    Limites Personalizados
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Período</label>
                    <select
                      value={editingUser.customQuotaPeriod || 'daily'}
                      onChange={(e) => setEditingUser({ ...editingUser, customQuotaPeriod: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                    >
                      <option value="daily">Diário (Dia)</option>
                      <option value="weekly">Semanal (Semana)</option>
                      <option value="monthly">Mensal (Mês)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Max Buscas</label>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={editingUser.customSearchesLimit || 10}
                      onChange={(e) => setEditingUser({ ...editingUser, customSearchesLimit: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Max Resultados/Busca</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editingUser.customResultsPerSearchLimit || 10}
                      onChange={(e) => setEditingUser({ ...editingUser, customResultsPerSearchLimit: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Módulos Autorizados</label>
                  <select
                    value={editingUser.customAllowedModules || 'both'}
                    onChange={(e) => setEditingUser({ ...editingUser, customAllowedModules: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  >
                    <option value="both">Ambos (B2B Empresas + Imóveis FSBO)</option>
                    <option value="b2b">Apenas Módulo 1: Buscar Empresas & Decisores B2B</option>
                    <option value="real_estate">Apenas Módulo 2: Buscar Imóveis de Particulares (FSBO)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DE EDITAR/ADICIONAR EMPRESA (SUPER ADMIN) ================= */}
      {isCompanyModalOpen && editingCompany && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {companies.some(c => c.id === editingCompany.id) ? 'Editar Empresa & Plano' : 'Nova Empresa Corporativa'}
              </h3>
              <button onClick={() => setIsCompanyModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nome da Empresa *</label>
                <input
                  type="text"
                  value={editingCompany.name}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Plano</label>
                  <input
                    type="text"
                    value={editingCompany.planName}
                    onChange={(e) => setEditingCompany({ ...editingCompany, planName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Max Colaboradores</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={editingCompany.maxUsers}
                    onChange={(e) => setEditingCompany({ ...editingCompany, maxUsers: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Período de Cota</label>
                  <select
                    value={editingCompany.quotaPeriod}
                    onChange={(e) => setEditingCompany({ ...editingCompany, quotaPeriod: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  >
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Max Buscas Período</label>
                  <input
                    type="number"
                    value={editingCompany.maxSearchesPerPeriod}
                    onChange={(e) => setEditingCompany({ ...editingCompany, maxSearchesPerPeriod: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Max Res/Busca</label>
                  <input
                    type="number"
                    value={editingCompany.maxResultsPerSearch}
                    onChange={(e) => setEditingCompany({ ...editingCompany, maxResultsPerSearch: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Módulos Autorizados</label>
                <select
                  value={editingCompany.allowedModules}
                  onChange={(e) => setEditingCompany({ ...editingCompany, allowedModules: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                >
                  <option value="both">Ambos (B2B Empresas + Imóveis FSBO)</option>
                  <option value="b2b">Apenas Módulo 1: B2B Empresas</option>
                  <option value="real_estate">Apenas Módulo 2: Imóveis FSBO</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg transition-all"
                >
                  Salvar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserAndCompanyManagementModal;
