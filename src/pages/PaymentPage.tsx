import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, CreditCard, Smartphone, Building2, CheckCircle2, XCircle,
  Loader2, Copy, AlertCircle, Lock, RefreshCw, Clock, Check,
} from 'lucide-react';
import { useNavigate, useSearchParams } from '../lib/router';
import { submitManualPayment, initiateStripePayment, createPayment } from '../lib/api';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

// ── Payment method metadata ───────────────────────────────────────────────────
const METHOD_META: Record<string, {
  label: string; color: string; icon: any;
  merchantNumber?: string; instructions?: string; bankDetails?: string;
}> = {
  bkash: {
    label: 'bKash',
    color: '#E2136E',
    icon: Smartphone,
    merchantNumber: '01XXXXXXXXX',
    instructions: 'Open your bKash app → Send Money → Enter merchant number → Enter the exact amount → Use your Order Number as reference.',
  },
  nagad: {
    label: 'Nagad',
    color: '#F6921E',
    icon: Smartphone,
    merchantNumber: '01XXXXXXXXX',
    instructions: 'Open your Nagad app → Send Money → Enter merchant number → Enter the exact amount → Use your Order Number as reference.',
  },
  bank_transfer: {
    label: 'Bank Transfer',
    color: '#00D1FF',
    icon: Building2,
    bankDetails: `Bank: Dutch-Bangla Bank\nAccount Name: MIA ONE Ltd.\nAccount No: 1234567890\nRouting No: 090261427\nBranch: Motijheel`,
    instructions: 'Transfer the exact amount using NPSB, RTGS, or BEFTN. Write your Order Number in the remarks/narration field.',
  },
  stripe: {
    label: 'Card Payment',
    color: '#6772E5',
    icon: CreditCard,
    instructions: 'Your payment is processed securely by Stripe. Card data never touches our servers.',
  },
};

// ── Stripe card form (pure HTML/CSS — no Stripe.js dependency) ─────────────────
function StripeCardForm({
  clientSecret,
  onSuccess,
  onError,
  amount,
}: {
  clientSecret: string;
  onSuccess: () => void;
  onError: (e: string) => void;
  amount: number;
}) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const stripeRef = useRef<any>(null);
  const elementsRef = useRef<any>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically load Stripe.js
    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.onload = () => {
      const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (pk && (window as any).Stripe) {
        stripeRef.current = (window as any).Stripe(pk);
        const elements = stripeRef.current.elements({ clientSecret });
        elementsRef.current = elements;
        const card = elements.create('payment');
        if (mountRef.current) {
          card.mount(mountRef.current);
          card.on('ready', () => setStripeLoaded(true));
        }
      } else {
        setStripeLoaded(true); // fallback to manual form
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [clientSecret]);

  const handleStripeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripeRef.current || !elementsRef.current) return;
    setProcessing(true);
    const { error } = await stripeRef.current.confirmPayment({
      elements: elementsRef.current,
      confirmParams: { return_url: `${window.location.origin}/order-success` },
      redirect: 'if_required',
    });
    setProcessing(false);
    if (error) onError(error.message);
    else onSuccess();
  };

  return (
    <form onSubmit={handleStripeSubmit} className="space-y-4">
      <div className="p-4 rounded-2xl min-h-[60px] flex items-center justify-center"
        style={{ background: 'rgba(103,114,229,0.04)', border: '1px solid rgba(103,114,229,0.15)' }}>
        {!stripeLoaded && (
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin text-[#6772E5]" />
            <span className="text-xs text-white/40">Loading secure payment form...</span>
          </div>
        )}
        <div ref={mountRef} className={stripeLoaded ? 'w-full' : 'hidden'} />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(103,114,229,0.04)', border: '1px solid rgba(103,114,229,0.1)' }}>
        <Lock size={11} className="text-[#6772E5] shrink-0" />
        <p className="text-[10px] text-white/35">Secured by Stripe · PCI DSS Level 1 certified</p>
      </div>

      <button type="submit" disabled={processing || !stripeLoaded}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 glow-btn"
        style={{ background: 'linear-gradient(135deg, #6772E5, #9B59B6)' }}>
        {processing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
        {processing ? 'Processing...' : `Pay ৳${amount}`}
      </button>
    </form>
  );
}

// ── Manual TxID form ──────────────────────────────────────────────────────────
function ManualPaymentForm({
  method,
  paymentId,
  orderNumber,
  amount,
  onSuccess,
}: {
  method: string;
  paymentId: string;
  orderNumber: string;
  amount: number;
  onSuccess: () => void;
}) {
  const meta = METHOD_META[method];
  const Icon = meta?.icon || Smartphone;
  const [txId, setTxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'number' | 'order' | null>(null);

  const copy = (text: string, key: 'number' | 'order') => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txId.trim()) { setError('Please enter the Transaction ID'); return; }
    if ((method === 'bkash' || method === 'nagad') && !senderNumber.trim()) {
      setError('Please enter your sender number'); return;
    }
    setError('');
    setSubmitting(true);
    const { error: apiErr } = await submitManualPayment(paymentId, txId.trim(), senderNumber.trim());
    setSubmitting(false);
    if (apiErr) setError(apiErr);
    else onSuccess();
  };

  return (
    <div className="space-y-4">
      {/* Step 1: Payment details */}
      <div className="glow-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: meta?.color }}>1</div>
          <p className="text-sm font-semibold text-white">Send Payment</p>
        </div>

        {(method === 'bkash' || method === 'nagad') && (
          <>
            <div>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 font-medium">Merchant Number</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-wider" style={{ color: meta?.color }}>
                  {meta?.merchantNumber}
                </span>
                <button onClick={() => copy(meta?.merchantNumber || '', 'number')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: copied === 'number' ? 'rgba(34,197,94,0.1)' : `${meta?.color}10`, border: `1px solid ${meta?.color}25` }}>
                  {copied === 'number' ? <Check size={13} className="text-green-400" /> : <Copy size={13} style={{ color: meta?.color }} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] text-white/30 mb-1">Amount</p>
                <p className="text-base font-bold text-white">৳{amount}</p>
              </div>
              <div className="px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] text-white/30 mb-1">Reference</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs font-mono font-bold text-mia-orange truncate">{orderNumber}</p>
                  <button onClick={() => copy(orderNumber, 'order')}>
                    {copied === 'order' ? <Check size={10} className="text-green-400" /> : <Copy size={10} className="text-white/30" />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {method === 'bank_transfer' && (
          <div className="p-4 rounded-2xl space-y-2"
            style={{ background: 'rgba(0,209,255,0.04)', border: '1px solid rgba(0,209,255,0.1)' }}>
            <pre className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap font-sans">
              {meta?.bankDetails}
            </pre>
            <div className="flex items-center gap-2 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] text-white/35">Reference:</p>
              <span className="text-[10px] font-mono font-bold text-mia-orange">{orderNumber}</span>
              <button onClick={() => copy(orderNumber, 'order')}>
                {copied === 'order' ? <Check size={10} className="text-green-400" /> : <Copy size={10} className="text-white/30" />}
              </button>
            </div>
          </div>
        )}

        {meta?.instructions && (
          <p className="text-xs text-white/45 leading-relaxed">{meta.instructions}</p>
        )}
      </div>

      {/* Step 2: Submit TxID */}
      <form onSubmit={handleSubmit} className="glow-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: meta?.color }}>2</div>
          <p className="text-sm font-semibold text-white">Submit Transaction Details</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-red-300"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertCircle size={13} className="shrink-0" /> {error}
          </div>
        )}

        <div>
          <label className="text-[11px] text-white/40 mb-1.5 block font-medium uppercase tracking-wider">
            Transaction ID *
          </label>
          <input type="text" value={txId}
            onChange={e => setTxId(e.target.value)}
            placeholder={method === 'bkash' ? 'e.g. 8N7A6B5C4D' : method === 'nagad' ? 'e.g. ABD1234567' : 'Transfer reference / UTR'}
            className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all font-mono tracking-wide"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', focus: 'border-color: rgba(255,138,0,0.4)' }} />
        </div>

        {(method === 'bkash' || method === 'nagad') && (
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block font-medium uppercase tracking-wider">
              Sender Number *
            </label>
            <input type="tel" value={senderNumber}
              onChange={e => setSenderNumber(e.target.value)}
              placeholder="Your bKash/Nagad number"
              className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }} />
          </div>
        )}

        <button type="submit" disabled={submitting}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 glow-btn"
          style={{ background: `linear-gradient(135deg, ${meta?.color}, ${meta?.color}99)` }}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {submitting ? 'Submitting...' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
}

// ── Main PaymentPage ──────────────────────────────────────────────────────────
export function PaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const orderId     = searchParams.get('order_id') || '';
  const orderNumber = searchParams.get('order_number') || orderId;
  const total       = Number(searchParams.get('total') || 0);
  const method      = searchParams.get('method') || 'bkash';
  const paymentId   = searchParams.get('payment_id') || '';

  const [stripeClientSecret, setStripeClientSecret] = useState('');
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const meta = METHOD_META[method];
  const Icon = meta?.icon || CreditCard;

  useEffect(() => {
    if (method === 'stripe') {
      setStripeLoading(true);
      initiateStripePayment(orderId, total).then(res => {
        setStripeLoading(false);
        if (res.error || !res.client_secret) {
          setStripeError(res.error || 'Failed to initialize payment');
        } else {
          setStripeClientSecret(res.client_secret);
          // Update payment record with gateway ref
          if (paymentId && res.payment_intent_id) {
            supabase.from('payments').update({ gateway_ref: res.payment_intent_id }).eq('id', paymentId);
          }
        }
      });
    }
  }, [method, orderId, total]);

  const handleSuccess = () => {
    setPaymentStatus('success');
    setStatusMessage('Payment submitted successfully! We\'ll verify and confirm your order shortly.');
    setTimeout(() => {
      navigate(`/order-success?id=${orderId}&number=${orderNumber}&total=${total}&method=${method}`);
    }, 2500);
  };

  const handleError = (msg: string) => {
    setPaymentStatus('failed');
    setStatusMessage(msg);
  };

  return (
    <div className="page-transition pb-24 min-h-screen">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1 as any)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-white">{meta?.label || 'Payment'}</h1>
            <p className="text-[10px] text-white/30">Order {orderNumber}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: `${meta?.color}0C`, border: `1px solid ${meta?.color}20` }}>
            <Icon size={13} style={{ color: meta?.color }} />
            <span className="text-[11px] font-semibold" style={{ color: meta?.color }}>৳{total}</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {/* Status banner */}
        {paymentStatus === 'success' && (
          <div className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <CheckCircle2 size={20} className="text-green-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-400">Payment Submitted!</p>
              <p className="text-xs text-white/50 mt-0.5">{statusMessage}</p>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <XCircle size={20} className="text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">Payment Failed</p>
              <p className="text-xs text-white/50 mt-0.5">{statusMessage}</p>
            </div>
            <button onClick={() => setPaymentStatus('idle')}
              className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1">
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        )}

        {/* Order summary strip */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: `${meta?.color}10` }}>
              <Icon size={15} style={{ color: meta?.color }} />
            </div>
            <div>
              <p className="text-xs font-medium text-white">{meta?.label}</p>
              <p className="text-[10px] text-white/30">{orderNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-mia-orange">৳{total}</p>
            <p className="text-[10px] text-white/25">Total Amount</p>
          </div>
        </div>

        {paymentStatus === 'idle' && (
          <>
            {method === 'stripe' && (
              <div className="glow-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-[#6772E5]">1</div>
                  <p className="text-sm font-semibold text-white">Enter Card Details</p>
                </div>
                {stripeLoading && (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 size={20} className="animate-spin text-[#6772E5]" />
                    <span className="text-sm text-white/40">Initializing secure payment...</span>
                  </div>
                )}
                {stripeError && (
                  <div className="p-4 rounded-2xl text-sm text-red-300 text-center"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <AlertCircle size={16} className="mx-auto mb-2" />
                    {stripeError}
                    <p className="text-xs text-white/30 mt-1">
                      Add VITE_STRIPE_PUBLISHABLE_KEY to your .env to enable card payments.
                    </p>
                  </div>
                )}
                {stripeClientSecret && !stripeLoading && (
                  <StripeCardForm
                    clientSecret={stripeClientSecret}
                    amount={total}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                )}
              </div>
            )}

            {(method === 'bkash' || method === 'nagad' || method === 'bank_transfer') && (
              <ManualPaymentForm
                method={method}
                paymentId={paymentId}
                orderNumber={orderNumber}
                amount={total}
                onSuccess={handleSuccess}
              />
            )}
          </>
        )}

        {/* Pending verification note */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Clock size={14} className="text-white/25 shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/35 leading-relaxed">
            Payments are verified within 1–2 business hours. You'll receive a confirmation once verified.
            You can track verification status in <span className="text-mia-orange">Orders → Transaction History</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
