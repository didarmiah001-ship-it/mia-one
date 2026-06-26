import { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await resetPassword(email);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-mia-black flex flex-col items-center justify-center px-4 page-transition">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'rgba(0,209,255,0.1)', border: '1px solid rgba(0,209,255,0.2)' }}>
            <CheckCircle2 size={28} className="text-mia-blue" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t('auth.emailSent')}</h2>
          <p className="text-sm text-white/50 mb-6">{t('auth.emailSentDesc')}</p>
          <button onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
            {t('auth.backToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mia-black flex flex-col items-center justify-center px-4 page-transition">
      <div className="relative w-full max-w-sm">
        <button onClick={() => navigate('/login')}
          className="mb-6 flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors">
          <ArrowLeft size={16} /> {t('auth.backToLogin')}
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-extrabold neon-text">{t('auth.forgotPassword')}</h1>
          <p className="text-sm text-white/40 mt-2">{t('auth.forgotPasswordDesc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-sm text-red-300 border border-red-500/20"
              style={{ background: 'rgba(239,68,68,0.05)' }}>
              {error}
            </div>
          )}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
          >
            {loading ? t('auth.sending') : t('auth.sendResetLink')}
          </button>
        </form>
      </div>
    </div>
  );
}
