import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  success: (msg: string) => void;
  error: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons = { success: CheckCircle2, error: XCircle, warning: AlertCircle, info: Info };
const colors = {
  success: { border: 'rgba(34,197,94,0.3)', bg: 'rgba(34,197,94,0.06)', icon: '#22c55e' },
  error: { border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.06)', icon: '#ef4444' },
  warning: { border: 'rgba(255,138,0,0.3)', bg: 'rgba(255,138,0,0.06)', icon: '#FF8A00' },
  info: { border: 'rgba(0,209,255,0.3)', bg: 'rgba(0,209,255,0.06)', icon: '#00D1FF' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const value = {
    success: (msg: string) => add(msg, 'success'),
    error: (msg: string) => add(msg, 'error'),
    warning: (msg: string) => add(msg, 'warning'),
    info: (msg: string) => add(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[9998] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '360px' }}>
        {toasts.map(toast => {
          const Icon = icons[toast.type];
          const c = colors[toast.type];
          return (
            <div
              key={toast.id}
              className="flex items-start gap-3 px-4 py-3 rounded-2xl pointer-events-auto backdrop-blur-xl"
              style={{
                background: `linear-gradient(135deg, ${c.bg}, var(--bg-card))`,
                border: `1px solid ${c.border}`,
                boxShadow: `0 4px 24px rgba(0,0,0,0.4), 0 0 20px ${c.border}`,
                animation: 'slide-up 0.3s ease-out',
              }}
            >
              <Icon size={16} style={{ color: c.icon, flexShrink: 0, marginTop: '1px' }} />
              <p className="text-sm text-white/90 flex-1">{toast.message}</p>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-white/30 hover:text-white/70 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
