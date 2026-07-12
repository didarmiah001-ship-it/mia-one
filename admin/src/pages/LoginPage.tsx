import { useState } from 'react';
import { useAuth } from '../lib/auth';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    setError(null);

    const { error: signInError } = await signIn(email.trim(), password);

    if (signInError) {
      setSubmitting(false);
      setError(signInError);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-3"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 0 24px rgba(255,138,0,0.35)' }}
          >
            M
          </div>
          <h1 className="text-xl font-bold text-white">MIA Admin Panel</h1>
          <p className="text-sm text-white/30 mt-1">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 rounded-xl text-xs text-red-300"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={submitting}
              placeholder="admin@example.com"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-mia-orange/40 transition-colors disabled:opacity-50"
              style={{ borderColor: 'rgba(255,255,255,0.08)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={submitting}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-12 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-mia-orange/40 transition-colors disabled:opacity-50"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 text-xs"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 4px 12px rgba(255,138,0,0.3)' }}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
