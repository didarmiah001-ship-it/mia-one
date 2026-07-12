import { useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { RouterProvider, Routes, Route, useNavigate, useLocation } from './lib/router';
import { ToastProvider } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { AdminLayout } from './pages/AdminLayout';

function LoadingScreen({ error }: { error?: string | null }) {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 0 24px rgba(255,138,0,0.35)' }}
          >
            M
          </div>
          <div
            className="absolute inset-0 rounded-2xl animate-ping"
            style={{ background: 'rgba(255,138,0,0.12)', animationDuration: '2s' }}
          />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-white font-bold text-base tracking-tight">MIA Admin</span>
          <span className="text-white/25 text-sm">{error ? 'Access denied' : 'Verifying access…'}</span>
        </div>
        {error && (
          <div className="max-w-md px-4 py-3 rounded-xl text-xs text-red-300 text-center"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}
        <div className="w-32 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full animate-loading-bar"
            style={{ background: 'linear-gradient(90deg, #FF8A00, #FF2EC9)' }}
          />
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  const { user, profile, loading, isAdmin, authError } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (loading) return;
    if (user && !profile) return;

    if (!user) {
      if (pathname !== '/login') navigate('/login');
      return;
    }

    if (!isAdmin) {
      if (pathname !== '/unauthorized') navigate('/unauthorized');
      return;
    }

    if (pathname === '/login') navigate('/');
  }, [user, profile, loading, isAdmin, pathname, navigate]);

  if (loading) return <LoadingScreen error={null} />;

  if (!user) return <LoginPage />;

  if (user && !profile) return <LoadingScreen error={authError} />;

  if (!isAdmin) return <UnauthorizedPage />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/" element={<AdminLayout />} />
      <Route path="/:section" element={<AdminLayout />} />
      <Route path="*" element={<AdminLayout />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <ToastProvider>
          <AppShell />
        </ToastProvider>
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
