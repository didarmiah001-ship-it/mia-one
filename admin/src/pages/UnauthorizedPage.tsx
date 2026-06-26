import { Shield, XCircle } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/auth';

export function UnauthorizedPage() {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-mia-black flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <XCircle size={36} className="text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-sm text-white/40 leading-relaxed">
            You do not have administrator privileges. This panel is restricted to authorized admin accounts only.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            Sign Out
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Back to Login
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/20">
          <Shield size={12} />
          <span>MIA ONE Admin Panel</span>
        </div>
      </div>
    </div>
  );
}
