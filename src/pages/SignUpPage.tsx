import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from '../lib/router';
import { appConfig } from '../lib/config';
import { useTranslation } from 'react-i18next';

export function SignUpPage() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email, password, fullName);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 page-transition" style={{ background: "var(--bg-base)" }}>
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.2)' }}>
            <Mail size={28} className="text-mia-orange" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t('auth.accountCreated')}</h2>
          <p className="text-sm text-white/50 mb-6">{t('auth.accountCreatedDesc')}</p>
          <button onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
            {t('auth.goToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 page-transition" style={{ background: "var(--bg-base)" }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #7B2CFF, transparent)' }} />
        <div className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF2EC9, transparent)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="relative inline-block w-16 h-16 mb-4">
            <img src={appConfig.logo} alt="MIA ONE" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold neon-text">{t('auth.createAccount')}</h1>
          <p className="text-sm text-white/40 mt-2">{t('auth.joinMia')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-sm text-red-300 border border-red-500/20"
              style={{ background: 'rgba(239,68,68,0.05)' }}>
              {error}
            </div>
          )}

          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder={t('auth.fullName')}
              required
              className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/8 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40 transition-all"
            />
          </div>

          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('auth.emailAddress')}
              required
              className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/8 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40 transition-all"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.passwordMin')}
              required
              className="w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/8 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
          >
            {loading ? t('auth.creatingAccount') : <>{t('auth.createAccount')} <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          {t('auth.haveAccount')}{' '}
          <button onClick={() => navigate('/login')} className="text-mia-orange font-medium hover:underline">
            {t('auth.signIn')}
          </button>
        </p>
      </div>
    </div>
  );
}
