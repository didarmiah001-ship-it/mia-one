import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertTriangle, Lock, Mail } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from '../lib/router';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError(null);
    setLoading(true);

    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);

    if (signInError) {
      setError('Invalid credentials. Access denied.');
      return;
    }

    // Auth state change will redirect via App.tsx
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-mia-black flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FF8A00 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative"
            style={{ background: 'linear-gradient(135deg, rgba(255,138,0,0.15), rgba(255,46,201,0.08))', border: '1px solid rgba(255,138,0,0.25)' }}>
            <Shield size={28} className="text-mia-orange" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">Admin Panel</h1>
            <p className="text-sm text-white/30 mt-1">MIA ONE — Private Access</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.07)' }}>
          {/* Security notice */}
          <div className="flex items-start gap-2.5 rounded-xl p-3 mb-6"
            style={{ background: 'rgba(255,138,0,0.06)', border: '1px solid rgba(255,138,0,0.12)' }}>
            <AlertTriangle size={14} className="text-mia-orange shrink-0 mt-0.5" />
            <p className="text-xs text-white/50 leading-relaxed">
              Restricted to authorized administrators only. Unauthorized access is prohibited.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,138,0,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm text-white placeholder-white/20 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = 'rgba(255,138,0,0.4)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl p-3"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <AlertTriangle size={13} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email.trim() || !password}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: loading ? 'rgba(255,138,0,0.5)' : 'linear-gradient(135deg, #FF8A00, #FF6000)' }}
            >
              {loading ? 'Verifying…' : 'Sign In to Admin'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/15 mt-6">
          MIA ONE Admin Panel &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
