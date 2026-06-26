import { useState, useEffect } from 'react';
import { RefreshCw, X, Sparkles } from 'lucide-react';

export function PWAUpdateBanner() {
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const { reg: registration } = (e as CustomEvent).detail;
      setReg(registration);
      setVisible(true);
    };
    window.addEventListener('pwa-update-available', handler);
    return () => window.removeEventListener('pwa-update-available', handler);
  }, []);

  function handleUpdate() {
    setUpdating(true);
    const waiting = reg?.waiting;
    if (waiting) {
      waiting.postMessage({ type: 'SKIP_WAITING' });
      // controllerchange in main.tsx will call window.location.reload()
    } else {
      window.location.reload();
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed top-4 left-4 right-4 z-[9998] max-w-lg mx-auto page-transition"
      style={{ maxWidth: '480px', left: '50%', transform: 'translateX(-50%)', right: 'auto', width: 'calc(100% - 32px)' }}
    >
      <div
        className="relative rounded-2xl px-4 py-3.5 flex items-center gap-3"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 24, 32, 0.97), rgba(13, 17, 23, 0.98))',
          border: '1px solid rgba(255, 138, 0, 0.25)',
          boxShadow: '0 8px 40px rgba(255, 138, 0, 0.15), 0 0 0 1px rgba(255,138,0,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Gradient accent top line */}
        <div
          className="absolute top-0 left-8 right-8 h-[1.5px] rounded-full"
          style={{ background: 'linear-gradient(90deg, transparent, #FF8A00, #FF2EC9, transparent)' }}
        />

        {/* Icon */}
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(255,138,0,0.15), rgba(255,46,201,0.08))', border: '1px solid rgba(255,138,0,0.2)' }}
        >
          <Sparkles size={16} className="text-mia-orange" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white leading-none mb-0.5">Update available</p>
          <p className="text-[11px] text-white/40 leading-none">New version ready to install</p>
        </div>

        {/* Update button */}
        <button
          onClick={handleUpdate}
          disabled={updating}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white glow-btn"
          style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', opacity: updating ? 0.7 : 1 }}
        >
          <RefreshCw size={12} className={updating ? 'animate-spin' : ''} />
          <span className="relative z-[1]">{updating ? 'Updating…' : 'Update'}</span>
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <X size={12} className="text-white/40" />
        </button>
      </div>
    </div>
  );
}
