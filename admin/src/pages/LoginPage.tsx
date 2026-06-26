import { useState } from 'react';
import { Eye, EyeOff, AlertTriangle, Lock, Mail } from 'lucide-react';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError(null);
    setSubmitting(true);

    const { error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setSubmitting(false);
      setError('Invalid credentials. Access denied.');
      return;
    }

    // Auth state change triggers a re-render of AppShell which shows the dashboard.
    // Keep submitting=true (shows spinner) while auth resolves.
  };

  return (
    <div className="min-h-screen bg-mia-black flex items-center justify-center px-4">
      {/* Background ambient glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #FF8A00 0%, transparent 70%)', filter: 'blur(80px)' }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-5"
          style={{ background: 'radial-gradient(circle, #FF2EC9 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <img
              src="/mia-admin-logo.png"
              alt="MIA Admin"
              className="w-20 h-20 object-contain"
              style={{ filter: 'drop-shadow(0 0 20px rgba(255,138,0,0.4)) drop-shadow(0 0 40px rgba(255,46,201,0.2))' }}
            />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">MIA Admin</h1>
            <p className="text-sm text-white/30 mt-1">MIA ONE — Private Access</p>
          </div>
        </div>

        {/* Login card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
        >
          {/* Security notice */}
          <div
            className="flex items-start gap-2.5 rounded-xl p-3 mb-6"
            style={{ background: 'rgba(255,138,0,0.06)', border: '1px solid rgba(255,138,0,0.12)' }}
          >
            <AlertTriangle size={14} className="text-mia-orange shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">
              Restricted to authorized administrators only. Unauthorized access is prohibited.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@miaone.shop"
                  required
                  autoComplete="email"
                  disabled={submitting}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none transition-all disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,138,0,0.4)'; e.currentTarget.style.background = 'rgba(255,138,0,0.03)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-white/40 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  disabled={submitting}
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder-white/15 outline-none transition-all disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,138,0,0.4)'; e.currentTarget.style.background = 'rgba(255,138,0,0.03)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                className="flex items-center gap-2 rounded-xl p-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                <AlertTriangle size={13} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || !email.trim() || !password}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #FF8A00, #FF6000)',
                boxShadow: submitting ? 'none' : '0 4px 20px rgba(255,138,0,0.3)',
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In to Admin'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/12 mt-6">
          MIA ONE Admin Panel &copy; {new Date().getFullYear()} — All access is logged.
        </p>
      </div>
    </div>
  );
}
