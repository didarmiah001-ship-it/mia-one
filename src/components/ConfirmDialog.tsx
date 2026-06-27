import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const confirm = confirmLabel || t('confirmDialog.confirm');
  const cancel = cancelLabel || t('confirmDialog.cancel');
  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div
        className="relative w-full max-w-sm rounded-3xl p-6"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-normal)',
          boxShadow: 'var(--card-shadow)',
          animation: 'slide-up 0.25s ease-out',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,138,0,0.1)' }}>
            <AlertTriangle size={20} style={{ color: danger ? '#ef4444' : '#FF8A00' }} />
          </div>
          <h3 className="text-base font-bold text-white">{title}</h3>
        </div>
        <p className="text-sm text-white/60 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-normal)', background: 'var(--bg-input)' }}
          >
            {cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02]"
            style={{
              background: danger
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'linear-gradient(135deg, #FF8A00, #FF2EC9)',
              boxShadow: danger ? '0 4px 12px rgba(239,68,68,0.3)' : '0 4px 12px rgba(255,138,0,0.3)',
            }}
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
