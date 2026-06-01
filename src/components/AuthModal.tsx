import { useState, FormEvent } from 'react';
import { Language, translations } from '../translations';
import { User as UserIcon, Mail, Lock, ShieldAlert, Phone, ToggleLeft, ToggleRight, Info } from 'lucide-react';
import { ibFetch } from '../apiMock';

interface AuthModalProps {
  currentLanguage: Language;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export default function AuthModal({ currentLanguage, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const t = translations[currentLanguage];

  // Quick select credentials for testing ease
  const handleQuickSelect = (role: 'admin' | 'client') => {
    if (role === 'admin') {
      setIsLogin(true);
      setIsAdminMode(true);
      setEmail('admin@immoburundi.bi');
      setPassword('ImmoBurundiAdmin2026!');
    } else {
      setIsLogin(true);
      setIsAdminMode(false);
      setEmail('client@immoburundi.bi');
      setPassword('client'); // any string works for demo client login
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin 
      ? { email, password }
      : { email, password, name, phone };

    try {
      const response = await ibFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t.errorOccurred);
      }

      onAuthSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-sm max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-[#0f172a] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white dark:hover:bg-slate-800 p-1.5 rounded-sm"
          >
            ✕
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-sm bg-blue-700 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-sans font-black tracking-wider uppercase">
              {isLogin ? t.loginTitle : t.registerTitle}
            </h2>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            {isLogin ? t.loginDesc : t.registerDesc}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Admin vs Client Toggle Selector for Log In */}
          {isLogin && (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 border-l-4 border-l-blue-700 rounded-sm mb-2 shadow-sm">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldAlert className={`w-4 h-4 ${isAdminMode ? 'text-blue-700' : 'text-slate-400'}`} />
                {isAdminMode ? 'Admins Portal Mode' : 'Users Client Mode'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsAdminMode(!isAdminMode);
                  setEmail('');
                  setPassword('');
                }}
                className="flex items-center gap-1 cursor-pointer"
                title="Toggle Administrative Access"
              >
                {isAdminMode ? (
                  <ToggleRight className="w-8 h-8 text-blue-700" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-sm text-xs font-semibold leading-tight">
              ⚠️ {error}
            </div>
          )}

          {/* Regular Client Signup Name Field */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[#64748b] font-mono text-[10px] uppercase font-bold tracking-wider block">
                {t.nameLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Nduwimana"
                  className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-3 pr-8 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-700 transition-colors font-medium"
                />
              </div>
            </div>
          )}

          {/* Regular Client Signup Phone Field */}
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[#64748b] font-mono text-[10px] uppercase font-bold tracking-wider block">
                {t.phoneLabel}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +257 79 99 88 77"
                  className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-3 pr-8 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-700 transition-colors font-medium"
                />
              </div>
            </div>
          )}

          {/* Register/Login Email */}
          <div className="space-y-1">
            <label className="text-[#64748b] font-mono text-[10px] uppercase font-bold tracking-wider block">
              {t.emailLabel}
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAdminMode ? "admin@immoburundi.bi" : "you@example.com"}
                className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-3 pr-8 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-700 transition-colors font-medium"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[#64748b] font-mono text-[10px] uppercase font-bold tracking-wider block">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-sm py-2 pl-3 pr-8 text-xs font-sans text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-700 transition-colors font-medium"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold py-3 rounded-sm text-xs leading-none transition-all uppercase tracking-wider cursor-pointer shadow-sm"
          >
            {isLoading ? 'Processing...' : isLogin ? t.confirmLogin : t.confirmRegister}
          </button>

          {/* Sandbox Trials details section */}
          {isLogin && (
            <div className="bg-slate-50 border border-slate-200 border-l-4 border-l-blue-700 p-3 rounded-sm space-y-1.5 mt-2">
              <div className="text-[10px] font-mono font-bold text-slate-550 uppercase tracking-wide flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-700" />
                {t.demoCreds} (Simulation Trial Details)
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] leading-tight font-sans text-slate-600">
                <button
                  type="button"
                  onClick={() => handleQuickSelect('client')}
                  className="bg-white hover:bg-slate-50 p-2 border border-slate-200 rounded-sm text-left flex flex-col justify-between cursor-pointer"
                  title="Load Client login details"
                >
                  <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wide">🙋‍♂️ Trial Client</span>
                  <span className="text-[10px] text-slate-500 font-mono my-0.5">client@immoburundi.bi</span>
                  <span className="text-[10px] text-slate-400">Password: <code className="bg-slate-100 px-0.5 font-mono">client</code></span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSelect('admin')}
                  className="bg-blue-50/20 hover:bg-blue-50/50 border border-blue-150 p-2 rounded-sm text-left flex flex-col justify-between cursor-pointer"
                  title="Load Admin login details"
                >
                  <span className="font-bold text-blue-800 uppercase text-[10px] tracking-wide">💼 Trial Admin</span>
                  <span className="text-[10px] text-slate-500 font-mono my-0.5 font-bold">admin@immoburundi.bi</span>
                  <span className="text-[10px] text-slate-400">Password: <code className="bg-slate-100 px-0.5 font-mono text-[9px] font-bold">ImmoBurundiAdmin2026!</code></span>
                </button>
              </div>
            </div>
          )}

          {/* Toggle Login/Register footer */}
          <div className="pt-2 text-center text-xs">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setEmail('');
                setPassword('');
                setName('');
                setPhone('');
              }}
              className="text-blue-700 font-bold hover:underline uppercase tracking-wide text-[11px]"
            >
              {isLogin ? t.switchRegister : t.switchLogin}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
