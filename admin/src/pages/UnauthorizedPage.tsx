import { useAuth } from '../lib/auth';
import { useNavigate } from '../lib/router';

export function UnauthorizedPage() {
  const { user, signOut, authError } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-sm text-white/40 mb-1">
          Your account does not have admin privileges.
        </p>
        {authError && (
          <p className="text-xs text-red-300/70 mb-6">{authError}</p>
        )}
        {user && (
          <p className="text-xs text-white/25 mb-6">Signed in as {user.email}</p>
        )}
        <button
          onClick={async () => { await signOut(); navigate('/login'); }}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-white/60 border border-white/8 hover:bg-white/5 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
