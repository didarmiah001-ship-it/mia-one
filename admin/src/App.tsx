import { useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { RouterProvider, Routes, Route, useNavigate, useLocation } from './lib/router';
import { ToastProvider } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { AdminLayout } from './pages/AdminLayout';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Logo */}
        <div className="relative">
          <img
            src="/mia-admin-logo.png"
            alt="MIA Admin"
            className="w-20 h-20 object-contain drop-shadow-2xl"
            style={{ filter: 'drop-shadow(0 0 24px rgba(255,138,0,0.35))' }}
          />
          {/* Pulse ring */}
          <div
            className="absolute inset-0 rounded-2xl animate-ping"
            style={{ background: 'rgba(255,138,0,0.12)', animationDuration: '2s' }}
          />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-white font-bold text-base tracking-tight">MIA Admin</span>
          <span className="text-white/25 text-sm">Verifying access…</span>
        </div>
        {/* Loading bar */}
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
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Redirect logic — only runs once auth state is fully resolved
  useEffect(() => {
    if (loading) return;
    if (user && !profile) return; // wait for profile to load

    if (!user) {
      if (pathname !== '/login') navigate('/login');
      return;
    }

    if (!isAdmin) {
      if (pathname !== '/unauthorized') navigate('/unauthorized');
      return;
    }

    // Signed-in admin on the login page → go to dashboard
    if (pathname === '/login') navigate('/');
  }, [user, profile, loading, isAdmin, pathname, navigate]);

  if (loading) return <LoadingScreen />;

  // Not authenticated
  if (!user) return <LoginPage />;

  // Profile still loading (user exists but profile not yet fetched)
  if (user && !profile) return <LoadingScreen />;

  // Authenticated but not admin
  if (!isAdmin) return <UnauthorizedPage />;

  // Authenticated admin
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
