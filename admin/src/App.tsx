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

function AppShell() {
  const { user, profile, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Redirect logic — only runs once auth state is fully resolved
  useEffect(() => {
    if (loading) return;

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
