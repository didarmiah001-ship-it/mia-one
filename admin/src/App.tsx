import { useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { RouterProvider, Routes, Route, useNavigate, useLocation } from './lib/router';
import { ToastProvider } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { AdminLayout } from './pages/AdminLayout';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (pathname !== '/login') navigate('/login');
      return;
    }

    if (profile && !isAdmin) {
      if (pathname !== '/unauthorized') navigate('/unauthorized');
      return;
    }

    if (user && isAdmin && pathname === '/login') {
      navigate('/');
    }
  }, [user, profile, loading, isAdmin, pathname, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl animate-breathe"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
          />
          <span className="text-white/30 text-sm">Verifying access…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppShell() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={<AdminLayout />} />
        <Route path="/:section" element={<AdminLayout />} />
        <Route path="*" element={<AdminLayout />} />
      </Routes>
    </AuthGuard>
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
