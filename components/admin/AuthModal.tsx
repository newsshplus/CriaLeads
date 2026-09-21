import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, User, Building2, Key, Check, 
  ArrowRight, Sparkles, UserPlus, LogIn, X, Briefcase, 
  AlertCircle, CheckCircle2 
} from 'lucide-react';
import { UserAccount, Company, UserRole } from '../../types/authAndQuotaTypes';
import { 
  getStoredUsers, 
  getStoredCompanies, 
  setCurrentUser, 
  saveUsers, 
  saveCompanies,
  loginWithEmailAndPassword,
  registerNewUserAndCompany 
} from '../../services/authAndQuotaService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUserChanged: (user: UserAccount) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'quick' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados de Cadastro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('COMPANY_ADMIN');
  const [regQuotaPeriod, setRegQuotaPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [regSearchesLimit, setRegSearchesLimit] = useState(10);
  const [regResultsLimit, setRegResultsLimit] = useState(10);
  const [regModule, setRegModule] = useState<'b2b' | 'real_estate' | 'both'>('both');

  if (!isOpen) return null;

  const users = getStoredUsers();
  const companies = getStoredCompanies();

  const handleSelectUser = (user: UserAccount) => {
    const updated = { ...user, lastLoginAt: new Date().toISOString() };
    setCurrentUser(updated);
    onUserChanged(updated);
    setSuccessMsg(`Conectado com sucesso como: ${user.name}`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 400);
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = loginWithEmailAndPassword(email, password);
    if (!result.success || !result.user) {
      setErrorMsg(result.error || 'Credenciais inválidas.');
      return;
    }

    onUserChanged(result.user);
    setSuccessMsg(`Conectado como ${result.user.name}!`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 400);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!regName.trim() || !regEmail.trim() || !regCompanyName.trim() || !regPassword.trim()) {
      setErrorMsg('Por favor preencha todos os campos obrigatórios.');
      return;
    }

    const result = registerNewUserAndCompany({
      name: regName,
      email: regEmail,
      password: regPassword,
      companyName: regCompanyName,
      role: regRole,
      searchesLimit: regSearchesLimit,
      resultsLimit: regResultsLimit,
      quotaPeriod: regQuotaPeriod,
      module: regModule
    });

    if (!result.success || !result.user) {
      setErrorMsg(result.error || 'Erro ao registrar.');
      return;
    }

    onUserChanged(result.user);
    setSuccessMsg(`Usuário ${result.user.name} cadastrado com sucesso!`);
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Painel de Acesso & Perfis
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Multi-Tenant
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Controle de Cotas por Usuário, Empresa & Auditoria de Pesquisas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('quick')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'quick' ? 'text-indigo-400 border-indigo-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            <Sparkles className="w-4 h-4" />
            Perfis de Demonstração & Troca Rápida
          </button>
          <button
            onClick={() => setActiveTab('login')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'login' ? 'text-indigo-400 border-indigo-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            <LogIn className="w-4 h-4" />
            Login Manual
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'register' ? 'text-indigo-400 border-indigo-500' : 'text-slate-400 border-transparent hover:text-slate-200'}`}
          >
            <UserPlus className="w-4 h-4" />
            Criar Empresa / Usuário
          </button>
        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Conteúdo das Abas */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'quick' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-400 font-medium mb-1">
                Selecione uma conta para alternar imediatamente e testar os limites e permissões:
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {users.map(u => {
                  const isCurrent = u.id === currentUser.id;
                  const roleBadge = 
                    u.role === 'SUPER_ADMIN' ? { label: '👑 Super Admin', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' } :
                    u.role === 'COMPANY_ADMIN' ? { label: '🏢 Gestor / Admin Empresa', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' } :
                    { label: '👤 Colaborador / SDR', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };

                  const limitInfo = u.role === 'SUPER_ADMIN' 
                    ? 'Buscas Ilimitadas • Acesso Total a Tudo' 
                    : `${u.customSearchesLimit || 10} buscas/${u.customQuotaPeriod === 'daily' ? 'dia' : u.customQuotaPeriod === 'weekly' ? 'semana' : 'mês'} • Max ${u.customResultsPerSearchLimit || 10} resultados`;

                  const moduleInfo = u.customAllowedModules === 'b2b' ? 'Módulo B2B' : u.customAllowedModules === 'real_estate' ? 'Módulo Imóveis FSBO' : 'B2B + Imóveis';

                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${isCurrent ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/50' : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'}`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-11 h-11 rounded-full object-cover border border-slate-600" />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-bold">
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {isCurrent && (
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                              {u.name}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleBadge.bg}`}>
                              {roleBadge.label}
                            </span>
                          </div>

                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>{u.companyName}</span>
                            <span>•</span>
                            <span className="text-slate-300">{u.email}</span>
                          </div>

                          <div className="text-[11px] text-amber-300/90 mt-1 flex items-center gap-2">
                            <span>⚡ {limitInfo}</span>
                            <span>•</span>
                            <span className="text-indigo-300">📦 {moduleInfo}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="px-3 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-lg">
                            Ativo Agora
                          </span>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-700/60 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center text-slate-400 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'login' && (
            <form onSubmit={handleManualLogin} className="space-y-4 max-w-md mx-auto py-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Cadastrado
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: joao@silvaimoveis.pt"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Senha / PIN de Acesso
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha (ex: 123)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 mt-4"
              >
                <LogIn className="w-4 h-4" />
                Entrar no Sistema
              </button>
            </form>
          )}

          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="ex: Roberto Mendes"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Corporativo *
                  </label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="ex: roberto@empresa.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome da Empresa / Organização *
                  </label>
                  <input
                    type="text"
                    value={regCompanyName}
                    onChange={(e) => setRegCompanyName(e.target.value)}
                    placeholder="ex: Nova Imobiliária Prime"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tipo de Perfil / Função
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="COMPANY_ADMIN">🏢 Gestor / Admin da Empresa</option>
                    <option value="USER">👤 Colaborador / Usuário Comum</option>
                  </select>
                </div>
              </div>

              {/* Configurações de Cota Inicial */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Configuração Inicial de Cota & Módulos
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Período de Limite</label>
                    <select
                      value={regQuotaPeriod}
                      onChange={(e) => setRegQuotaPeriod(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="daily">Diário (Reseta todo dia)</option>
                      <option value="weekly">Semanal (Reseta toda semana)</option>
                      <option value="monthly">Mensal (Reseta todo mês)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Max Buscas p/ Período</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={regSearchesLimit}
                      onChange={(e) => setRegSearchesLimit(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Max Resultados p/ Busca</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={regResultsLimit}
                      onChange={(e) => setRegResultsLimit(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Módulos Liberados</label>
                  <select
                    value={regModule}
                    onChange={(e) => setRegModule(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="both">Ambos (B2B Empresas + Imóveis FSBO)</option>
                    <option value="b2b">Apenas Módulo 1: Buscar Empresas & Decisores B2B</option>
                    <option value="real_estate">Apenas Módulo 2: Buscar Imóveis de Particulares (FSBO)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Empresa e Iniciar Sessão
              </button>
            </form>
          )}
        </div>

        {/* Rodapé informativo */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-400">
          Você pode alternar entre perfis de teste a qualquer momento pelo menu superior.
        </div>
      </div>
    </div>
  );
};
export default AuthModal;
