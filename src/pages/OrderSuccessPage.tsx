import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '../lib/router';
import { CheckCircle2, Package, ArrowRight, Copy, Home, Banknote, Smartphone, Building2 } from 'lucide-react';
import { appConfig } from '../lib/config';
import { useTranslation } from 'react-i18next';

const PAYMENT_DETAILS: Record<string, { labelKey: string; instructionsKey: string; icon: any; color: string }> = {
  cash_on_delivery: {
    labelKey: 'orderSuccess.cod',
    instructionsKey: 'orderSuccess.codNote',
    icon: Banknote,
    color: '#FF8A00',
  },
  bkash: {
    labelKey: 'orderSuccess.bkash',
    instructionsKey: 'payment.bkashInstructions',
    icon: Smartphone,
    color: '#E2136E',
  },
  nagad: {
    labelKey: 'orderSuccess.nagad',
    instructionsKey: 'payment.nagadInstructions',
    icon: Smartphone,
    color: '#F6921E',
  },
  bank_transfer: {
    labelKey: 'orderSuccess.bankTransfer',
    instructionsKey: 'payment.bankInstructions',
    icon: Building2,
    color: '#00D1FF',
  },
};

export function OrderSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const orderNumber = searchParams.get('number') || searchParams.get('id') || 'N/A';
  const total = searchParams.get('total') || '0';
  const method = searchParams.get('method') || 'cash_on_delivery';
  const viaPP = searchParams.get('via_pp') === '1';

  if (orderNumber === 'N/A') { navigate('/'); return null; }

  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const paymentInfo = PAYMENT_DETAILS[method] || PAYMENT_DETAILS['cash_on_delivery'];
  const PayIcon = paymentInfo.icon;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-mia-black flex flex-col items-center justify-start px-4 py-8 page-transition pb-24">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
      </div>

      <div className={`relative w-full max-w-sm transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>

        {/* Success icon */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-5">
            <div className="absolute inset-[-12px] rounded-full opacity-20 blur-xl" style={{ background: 'radial-gradient(circle, #22c55e, transparent)', animation: 'breathe-neon 3s ease-in-out infinite' }} />
            <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
              <CheckCircle2 size={44} className="text-green-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1">{t('orderSuccess.orderConfirmed')}</h1>
          <p className="text-sm text-white/45 text-center">{t('orderSuccess.thankYou')} {appConfig.name}</p>
        </div>

        {/* Order number card */}
        <div className="glow-card p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package size={15} className="text-mia-orange" />
              <span className="text-sm font-semibold text-white">{t('orderSuccess.orderDetails')}</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg font-medium" style={{ color: '#22c55e', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              {t('orderSuccess.placed')}
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <p className="text-[11px] text-white/35 mb-1 font-medium">{t('orderSuccess.orderNumber')}</p>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-mia-orange font-mono tracking-wider">{orderNumber}</span>
                <button
                  onClick={copyOrderNumber}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: copied ? 'rgba(34,197,94,0.1)' : 'var(--border-subtle)', border: '1px solid var(--border-normal)' }}
                  title={t('orderSuccess.copyOrderNumber')}
                >
                  {copied
                    ? <CheckCircle2 size={12} className="text-green-400" />
                    : <Copy size={12} className="text-white/50" />
                  }
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">{t('orderSuccess.orderTotal')}</span>
              <span className="text-sm font-bold text-white">৳{total}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">{t('orderSuccess.payment')}</span>
              <span className="text-xs font-medium" style={{ color: paymentInfo.color }}>{t(paymentInfo.labelKey)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">{t('orderSuccess.estimatedDelivery')}</span>
              <span className="text-xs text-white/70">{appConfig.delivery.estimatedDays}</span>
            </div>
          </div>
        </div>

        {/* Payment instructions / status */}
        {method === 'cash_on_delivery' && (
          <div className="glow-card p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.2)' }}>
                <PayIcon size={15} style={{ color: paymentInfo.color }} />
              </div>
              <span className="text-sm font-semibold text-white">{t(paymentInfo.labelKey)}</span>
            </div>
            <p className="text-xs text-white/55 leading-relaxed">{t(paymentInfo.instructionsKey)}</p>
          </div>
        )}

        {(method === 'bkash' || method === 'nagad' || method === 'bank_transfer' || method === 'stripe') && (
          <div className="glow-card p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${paymentInfo.color}12`, border: `1px solid ${paymentInfo.color}25` }}>
                <PayIcon size={15} style={{ color: paymentInfo.color }} />
              </div>
              <span className="text-sm font-semibold text-white">{t('orderSuccess.paymentUnderVerification')}</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              {t('orderSuccess.paymentVerificationDesc')} <span className="text-mia-orange font-medium">{t('orderSuccess.oneTwoHours')}</span>. {t('orderSuccess.trackStatusIn')} <span className="text-mia-orange cursor-pointer" onClick={() => navigate('/transactions')}>{t('orderSuccess.transactionHistory')}</span>.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => navigate('/orders')}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
          >
            <Package size={16} /> {t('orderSuccess.trackMyOrder')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-2xl text-sm font-medium text-white/70 flex items-center justify-center gap-2 transition-colors hover:text-white"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <Home size={15} /> {t('orderSuccess.continueShopping')} <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
