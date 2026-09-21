import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Lock, Mail, Eye, EyeOff, LogIn, 
  Sparkles, UserPlus, Building2, CheckCircle2, AlertCircle, 
  ArrowRight, Key, Users, Globe2, HelpCircle, Check, RefreshCw, Clock
} from 'lucide-react';
import { UserAccount, UserRole, Company } from '../../types/authAndQuotaTypes';
import { 
  loginWithEmailAndPassword, 
  registerNewUserAndCompany, 
  getRememberedEmail, 
  saveRememberedEmail, 
  getStoredUsers,
  getStoredCompanies,
  updateUserPassword
} from '../../services/authAndQuotaService';

interface LoginPageProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Quick Credentials Accordion
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  // Registration Form States
  const [regAccountType, setRegAccountType] = useState<'new_company' | 'existing_member'>('new_company');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCompanyName, setRegCompanyName] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [regQuotaPeriod, setRegQuotaPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [regSearchesLimit, setRegSearchesLimit] = useState(20);
  const [regModule, setRegModule] = useState<'b2b' | 'real_estate' | 'both'>('both');

  // List of registered companies for collaborator selection
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);

  useEffect(() => {
    const comps = getStoredCompanies();
    setAvailableCompanies(comps);
    if (comps.length > 0) {
      setSelectedCompanyId(comps[0].id);
    }
  }, []);

  // Load remembered email on mount
  useEffect(() => {
    const remembered = getRememberedEmail();
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    } else {
      // Default to Super Admin email for easy access
      setEmail('dpjcam@gmail.com');
      setPassword('admin');
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPendingApprovalMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Por favor, informe seu email de acesso.');
      return;
    }

    if (!password) {
      setErrorMsg('Por favor, digite sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = loginWithEmailAndPassword(email, password);
      setIsLoading(false);

      if (!result.success || !result.user) {
        if (result.status === 'pending_approval') {
          setPendingApprovalMsg(result.error || 'Seu cadastro está aguardando validação do Super Administrador.');
        } else {
          setErrorMsg(result.error || 'Credenciais inválidas.');
        }
        return;
      }

      if (rememberMe) {
        saveRememberedEmail(email);
      }

      setSuccessMsg(`Bem-vindo de volta, ${result.user.name}!`);
      setTimeout(() => {
        onLoginSuccess(result.user!);
      }, 300);
    }, 250);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPendingApprovalMsg(null);
    setSuccessMsg(null);

    const compName = regAccountType === 'existing_member'
      ? (availableCompanies.find(c => c.id === selectedCompanyId)?.name || regCompanyName)
      : regCompanyName;

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim() || !compName.trim()) {
      setErrorMsg('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const result = registerNewUserAndCompany({
        name: regName,
        email: regEmail,
        password: regPassword,
        companyName: compName,
        existingCompanyId: regAccountType === 'existing_member' ? selectedCompanyId : undefined,
        role: regAccountType === 'existing_member' ? 'USER' : 'COMPANY_ADMIN',
        searchesLimit: regSearchesLimit,
        resultsLimit: 10,
        quotaPeriod: regQuotaPeriod,
        module: regModule,
        autoApprove: false // Todo auto-cadastro público exige aprovação do Super Admin
      });
      setIsLoading(false);

      if (!result.success || !result.user) {
        setErrorMsg(result.error || 'Erro ao registrar.');
        return;
      }

      // Preenche o formulário de login e alterna com aviso claro de aprovação
      setEmail(regEmail);
      setPassword('');
      setActiveTab('login');
      setPendingApprovalMsg(
        `🎉 Solicitação registrada com sucesso para ${regName}! Seu cadastro foi enviado para validação e aprovação do Super Administrador (dpjcam@gmail.com). O acesso ao painel será liberado em breve.`
      );
    }, 300);
  };

  const fillQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg(null);
    setPendingApprovalMsg(null);
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);

    const users = getStoredUsers();
    const user = users.find(u => u.email.toLowerCase() === resetEmail.trim().toLowerCase());

    if (!user) {
      setResetMessage({ type: 'error', text: 'Email não encontrado no sistema.' });
      return;
    }

    if (!newResetPassword || newResetPassword.length < 3) {
      setResetMessage({ type: 'error', text: 'A nova senha deve ter no mínimo 3 caracteres.' });
      return;
    }

    const updated = updateUserPassword(user.id, newResetPassword);
    if (updated) {
      setResetMessage({ type: 'success', text: `Senha do usuário ${user.name} atualizada com sucesso!` });
      setEmail(user.email);
      setPassword(newResetPassword);
      setTimeout(() => {
        setShowResetModal(false);
        setResetMessage(null);
      }, 1200);
    } else {
      setResetMessage({ type: 'error', text: 'Erro ao atualizar senha.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between selection:bg-indigo-500 selection:text-white font-sans text-slate-100 relative overflow-hidden">
      
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[40%] right-[25%] w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white font-mono">
                CriaLeads
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO v4.8
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Plataforma de Mineração B2B & Imóveis FSBO com IA
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Acesso Protegido • Validação Central por Super Admin</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Form Tabs: Login vs Registro */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('login');
                setErrorMsg(null);
                setPendingApprovalMsg(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Acessar Conta</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('register');
                setErrorMsg(null);
                setPendingApprovalMsg(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Cadastro</span>
            </button>
          </div>

          {/* Banner explicativo de validação por Super Admin */}
          {activeTab === 'register' && (
            <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-start gap-2.5 text-xs text-indigo-200">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Validação Obrigatória do Super Admin:</strong>
                <span className="text-[11px] text-slate-300">
                  Todo novo cadastro é submetido para validação do Super Admin (<span className="text-indigo-300 font-mono">dpjcam@gmail.com</span>). O Super Admin poderá ajustar sua empresa, cotas e liberar seu acesso diretamente no painel.
                </span>
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-950/70 border border-rose-800/80 text-rose-200 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          {pendingApprovalMsg && (
            <div className="p-3.5 bg-amber-950/70 border border-amber-500/60 text-amber-200 text-xs rounded-2xl flex items-start gap-2.5 animate-in fade-in duration-200">
              <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{pendingApprovalMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-xs rounded-2xl flex items-center gap-2.5 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="flex-1 font-bold">{successMsg}</div>
            </div>
          )}

          {/* 1. LOGIN TAB FORM */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Email de Acesso
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    id="login-email-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu.email@empresa.com"
                    required
                    autoFocus
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowResetModal(true);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/90 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-200 transition-colors"
                    title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me Checkbox */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Lembrar meu email neste navegador</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>

              {/* Demo Accounts Quick-Picker Helper */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="w-full text-center text-xs text-slate-400 hover:text-indigo-300 font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showDemoAccounts ? 'Ocultar contas de demonstração' : 'Ver contas de demonstração para teste rápido'}</span>
                </button>

                {showDemoAccounts && (
                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl space-y-2 animate-in slide-in-from-top-2 duration-150 text-xs">
                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                      Clique para auto-preencher:
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                      {/* Super Admin */}
                      <button
                        type="button"
                        onClick={() => fillQuickLogin('dpjcam@gmail.com', 'admin')}
                        className="w-full p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-indigo-900/60 flex items-center justify-between text-left transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-purple-900 text-purple-200 rounded text-[9px] font-extrabold uppercase">
                            Super Admin
                          </span>
                          <span className="font-bold text-white">dpjcam@gmail.com</span>
                          <span className="text-[10px] text-indigo-300 font-medium">(Nivaldo Freitas)</span>
                        </div>
                        <span className="text-[10px] text-indigo-300 font-mono">senha: admin</span>
                      </button>

                      {/* Gestor Imóveis */}
                      <button
                        type="button"
                        onClick={() => fillQuickLogin('gestor@silvaimoveis.pt', '123')}
                        className="w-full p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-amber-900 text-amber-200 rounded text-[9px] font-extrabold uppercase">
                            Gestor Imobiliário
                          </span>
                          <span className="font-medium text-slate-200">gestor@silvaimoveis.pt</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">senha: 123</span>
                      </button>

                      {/* SDR B2B */}
                      <button
                        type="button"
                        onClick={() => fillQuickLogin('lucas@b2bgrowth.com.br', '123')}
                        className="w-full p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-emerald-900 text-emerald-200 rounded text-[9px] font-extrabold uppercase">
                            SDR B2B
                          </span>
                          <span className="font-medium text-slate-200">lucas@b2bgrowth.com.br</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">senha: 123</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </form>
          ) : (
            /* 2. REGISTER TAB FORM */
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* Tipo de Cadastro: Nova Empresa ou Colaborador de Empresa Existente */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Tipo de Cadastro *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegAccountType('new_company')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                      regAccountType === 'new_company'
                        ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Nova Empresa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegAccountType('existing_member')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 ${
                      regAccountType === 'existing_member'
                        ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Colaborador</span>
                  </button>
                </div>
              </div>

              {/* Nome do Usuário */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  placeholder="Ex: Mariana Castro"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Email Corporativo *
                </label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="mariana@suaempresa.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Senha */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Senha de Acesso *
                </label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="Defina uma senha"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Seleção ou Nome da Empresa */}
              {regAccountType === 'existing_member' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Selecione sua Empresa *
                  </label>
                  <select
                    value={selectedCompanyId}
                    onChange={e => setSelectedCompanyId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {availableCompanies.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.planName})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Nome da Nova Empresa *
                  </label>
                  <input
                    type="text"
                    value={regCompanyName}
                    onChange={e => setRegCompanyName(e.target.value)}
                    placeholder="Ex: Growth B2B Solutions"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}

              {/* Módulos de Interesse */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase text-slate-400">
                  Módulos de Interesse
                </label>
                <select
                  value={regModule}
                  onChange={e => setRegModule(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="both">B2B + Imóveis (Tudo)</option>
                  <option value="b2b">Apenas B2B Empresas</option>
                  <option value="real_estate">Apenas Imóveis FSBO</option>
                </select>
              </div>

              {/* Submit Registration */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Enviando solicitação...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Solicitar Cadastro para Aprovação</span>
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500 border-t border-slate-900/60">
        CriaLeads Platform © {new Date().getFullYear()} • Sistema Seguro com Validação por Super Admin & Gestão Multi-Tenant
      </footer>

      {/* Password Reset Modal Helper */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>Redefinição de Senha</span>
              </div>
              <button 
                onClick={() => setShowResetModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Digite seu email cadastrado e a nova senha que deseja definir para sua conta.
            </p>

            {resetMessage && (
              <div className={`p-3 rounded-xl text-xs ${resetMessage.type === 'success' ? 'bg-emerald-950/80 text-emerald-200 border border-emerald-800' : 'bg-rose-950/80 text-rose-200 border border-rose-800'}`}>
                {resetMessage.text}
              </div>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="seu.email@empresa.com"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={newResetPassword}
                  onChange={e => setNewResetPassword(e.target.value)}
                  placeholder="Digite sua nova senha"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md"
                >
                  Atualizar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
