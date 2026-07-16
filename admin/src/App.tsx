import { Navigate, BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
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
          <div className="h-full rounded-full animate-loading-bar" style={{ background: 'linear-gradient(90deg, #FF8A00, #FF2EC9)' }} />
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/admin/unauthorized" replace />;

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <LoadingScreen />;
  if (user && isAdmin) return <Navigate to="/admin/dashboard" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/admin/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/admin/unauthorized" element={<UnauthorizedPage />} />

      {/* Protected admin routes — all /admin/:section paths go through ProtectedRoute + AdminLayout */}
      <Route path="/admin/:section" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Catch-all: redirect any unknown path to dashboard (auth guard handles redirect) */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
