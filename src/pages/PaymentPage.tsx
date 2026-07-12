import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, CreditCard, Smartphone, Building2, CheckCircle2, XCircle,
  Loader2, Copy, AlertCircle, Lock, RefreshCw, Clock, Check, Upload, Image as ImageIcon, X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from '../lib/router';
import { submitManualPayment, initiateStripePayment, createPayment, fetchActivePaymentMethods, updatePaymentGatewayRef } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useTranslation } from 'react-i18next';

// ── Payment method metadata ───────────────────────────────────────────────────
const METHOD_META: Record<string, {
  label: string; color: string; icon: any;
}> = {
  bkash: { label: 'bKash', color: '#E2136E', icon: Smartphone },
  nagad: { label: 'Nagad', color: '#F6921E', icon: Smartphone },
  rocket: { label: 'Rocket', color: '#8B5CF6', icon: Smartphone },
  bank_transfer: { label: 'Bank Transfer', color: '#00D1FF', icon: Building2 },
  stripe: { label: 'Card Payment', color: '#6772E5', icon: CreditCard },
  sslcommerz: { label: 'SSLCommerz', color: '#00AEEF', icon: CreditCard },
  cash_on_delivery: { label: 'Cash on Delivery', color: '#22C55E', icon: Smartphone },
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
  const { t } = useTranslation();

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
            <span className="text-xs text-white/40">{t('payment.loadingForm')}</span>
          </div>
        )}
        <div ref={mountRef} className={stripeLoaded ? 'w-full' : 'hidden'} />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(103,114,229,0.04)', border: '1px solid rgba(103,114,229,0.1)' }}>
        <Lock size={11} className="text-[#6772E5] shrink-0" />
        <p className="text-[10px] text-white/35">{t('payment.securedByStripe')}</p>
      </div>

      <button type="submit" disabled={processing || !stripeLoaded}
        className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 glow-btn"
        style={{ background: 'linear-gradient(135deg, #6772E5, #9B59B6)' }}>
        {processing ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
        {processing ? t('payment.processing') : `${t('payment.pay')} ৳${amount}`}
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
  const [customerNote, setCustomerNote] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<'number' | 'order' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Fetch payment method details from database
  const [paymentMethodDetails, setPaymentMethodDetails] = useState<{
    account_number: string;
    account_name: string;
    payment_instructions: string;
    bank_name?: string;
    branch_name?: string;
    routing_number?: string;
  } | null>(null);

  useEffect(() => {
    const fetchPaymentDetails = async () => {
      const methods = await fetchActivePaymentMethods(method);
      const data = methods[0];
      if (data) {
        setPaymentMethodDetails({
          account_number: data.account_number || '',
          account_name: data.account_name || '',
          payment_instructions: data.payment_instructions || '',
          bank_name: data.bank_name || '',
          branch_name: data.branch_name || '',
          routing_number: data.routing_number || '',
        });
      }
    };
    fetchPaymentDetails();
  }, [method]);

  const copy = (text: string, key: 'number' | 'order') => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('payment.errInvalidFile') || 'Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('payment.errFileTooLarge') || 'File size must be less than 5MB');
      return;
    }

    setScreenshotFile(file);
    setScreenshotUrl(null);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setScreenshotPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setScreenshotUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadScreenshot = async (): Promise<string | null> => {
    if (!screenshotFile) return null;

    setUploadingScreenshot(true);
    try {
      const fileExt = screenshotFile.name.split('.').pop();
      const fileName = `payment-proof-${orderNumber}-${Date.now()}.${fileExt}`;

      const formData = new FormData();
      formData.append('file', screenshotFile);
      formData.append('fileName', fileName);
      formData.append('publicKey', 'public_i67rlxsde');

      const authRes = await fetch('https://ik.imagekit.io/i67rlxsde/auth');
      const { token, expire, signature } = await authRes.json();
      formData.append('signature', signature);
      formData.append('expire', String(expire));
      formData.append('token', token);

      const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) return null;
      const uploadData = await uploadRes.json();
      return uploadData.url || null;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txId.trim()) { setError(t('payment.errTxId')); return; }
    if ((method === 'bkash' || method === 'nagad' || method === 'rocket') && !senderNumber.trim()) {
      setError(t('payment.errSenderNumber')); return;
    }
    setError('');
    setSubmitting(true);

    // Upload screenshot if selected
    let uploadedUrl: string | null = null;
    if (screenshotFile) {
      uploadedUrl = await uploadScreenshot();
      if (!uploadedUrl) {
        setError(t('payment.errUploadFailed') || 'Failed to upload screenshot. Please try again.');
        setSubmitting(false);
        return;
      }
      setScreenshotUrl(uploadedUrl);
    }

    const { error: apiErr } = await submitManualPayment(
      paymentId,
      txId.trim(),
      senderNumber.trim(),
      customerNote.trim() || undefined,
      uploadedUrl || undefined
    );
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
          <p className="text-sm font-semibold text-white">{t('payment.sendPayment')}</p>
        </div>

        {(method === 'bkash' || method === 'nagad' || method === 'rocket') && paymentMethodDetails && (
          <>
            <div>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mb-1.5 font-medium">{t('payment.merchantNumber')}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-wider" style={{ color: meta?.color }}>
                  {paymentMethodDetails.account_number || 'N/A'}
                </span>
                <button onClick={() => copy(paymentMethodDetails?.account_number || '', 'number')}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
                  style={{ background: copied === 'number' ? 'rgba(34,197,94,0.1)' : `${meta?.color}10`, border: `1px solid ${meta?.color}25` }}>
                  {copied === 'number' ? <Check size={13} className="text-green-400" /> : <Copy size={13} style={{ color: meta?.color }} />}
                </button>
              </div>
              {paymentMethodDetails.account_name && (
                <p className="text-[10px] text-white/35 mt-1">{paymentMethodDetails.account_name}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] text-white/30 mb-1">{t('payment.amount')}</p>
                <p className="text-base font-bold text-white">৳{amount}</p>
              </div>
              <div className="px-3 py-2.5 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] text-white/30 mb-1">{t('payment.reference')}</p>
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

        {method === 'bank_transfer' && paymentMethodDetails && (
          <div className="p-4 rounded-2xl space-y-2"
            style={{ background: 'rgba(0,209,255,0.04)', border: '1px solid rgba(0,209,255,0.1)' }}>
            <div className="space-y-1.5">
              {paymentMethodDetails.bank_name && (
                <p className="text-xs text-white/60"><span className="text-white/40">Bank:</span> {paymentMethodDetails.bank_name}</p>
              )}
              {paymentMethodDetails.account_name && (
                <p className="text-xs text-white/60"><span className="text-white/40">Account Name:</span> {paymentMethodDetails.account_name}</p>
              )}
              {paymentMethodDetails.account_number && (
                <p className="text-xs text-white/60"><span className="text-white/40">Account No:</span> {paymentMethodDetails.account_number}</p>
              )}
              {paymentMethodDetails.routing_number && (
                <p className="text-xs text-white/60"><span className="text-white/40">Routing No:</span> {paymentMethodDetails.routing_number}</p>
              )}
              {paymentMethodDetails.branch_name && (
                <p className="text-xs text-white/60"><span className="text-white/40">Branch:</span> {paymentMethodDetails.branch_name}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] text-white/35">{t('payment.reference')}:</p>
              <span className="text-[10px] font-mono font-bold text-mia-orange">{orderNumber}</span>
              <button onClick={() => copy(orderNumber, 'order')}>
                {copied === 'order' ? <Check size={10} className="text-green-400" /> : <Copy size={10} className="text-white/30" />}
              </button>
            </div>
          </div>
        )}

        {paymentMethodDetails?.payment_instructions && (
          <div className="px-4 py-3 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] text-white/50 leading-relaxed whitespace-pre-line">
              {paymentMethodDetails.payment_instructions}
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Submit TxID */}
      <form onSubmit={handleSubmit} className="glow-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: meta?.color }}>2</div>
          <p className="text-sm font-semibold text-white">{t('payment.submitTxDetails')}</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl text-sm text-red-300"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <AlertCircle size={13} className="shrink-0" /> {error}
          </div>
        )}

        <div>
          <label className="text-[11px] text-white/40 mb-1.5 block font-medium uppercase tracking-wider">
            {t('payment.txIdLabel')}
          </label>
          <input type="text" value={txId}
            onChange={e => setTxId(e.target.value)}
            placeholder={method === 'bkash' ? t('payment.txIdPlaceholder') : method === 'nagad' ? t('payment.senderPlaceholder') : t('payment.transferRef')}
            className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all font-mono tracking-wide"
            style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.07)', focus: 'border-color: rgba(255,138,0,0.4)' }} />
        </div>

        {(method === 'bkash' || method === 'nagad' || method === 'rocket') && (
          <div>
            <label className="text-[11px] text-white/40 mb-1.5 block font-medium uppercase tracking-wider">
              {t('payment.senderNumberLabel')}
            </label>
            <input type="tel" value={senderNumber}
              onChange={e => setSenderNumber(e.target.value)}
              placeholder={t('payment.senderNumberPlaceholder')}
              className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
              style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.07)' }} />
          </div>
        )}

        {/* Payment Screenshot Upload */}
        <div>
          <label className="text-[11px] text-white/40 mb-1.5 block font-medium uppercase tracking-wider">
            {t('payment.screenshotLabel') || 'Payment Screenshot'} <span className="text-white/25">({t('common.optional')})</span>
          </label>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          {!screenshotPreview ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-4 rounded-2xl text-sm text-white/50 flex flex-col items-center justify-center gap-2 transition-all hover:border-mia-orange/30"
              style={{ background: 'var(--bg-input)', border: '1px dashed rgba(255,255,255,0.15)' }}
            >
              <Upload size={22} className="text-white/30" />
              <span>{t('payment.uploadScreenshot') || 'Upload payment screenshot'}</span>
              <span className="text-[10px] text-white/25">JPG, PNG (max 5MB)</span>
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              <img src={screenshotPreview} alt="Payment proof" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={removeScreenshot}
                className="absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center bg-black/60 hover:bg-red-500/80 transition-colors"
              >
                <X size={14} className="text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-[10px] text-white/60 truncate">{screenshotFile?.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Customer Note */}
        <div>
          <label className="text-[11px] text-white/40 mb-1.5 block font-medium uppercase tracking-wider">
            {t('payment.noteLabel') || 'Additional Note'} <span className="text-white/25">({t('common.optional')})</span>
          </label>
          <textarea
            value={customerNote}
            onChange={e => setCustomerNote(e.target.value)}
            placeholder={t('payment.notePlaceholder') || 'Any additional information about your payment...'}
            rows={2}
            className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all resize-none"
            style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.07)' }}
          />
        </div>

        <button type="submit" disabled={submitting || uploadingScreenshot}
          className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 glow-btn"
          style={{ background: `linear-gradient(135deg, ${meta?.color}, ${meta?.color}99)` }}>
          {submitting || uploadingScreenshot ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={15} />}
          {uploadingScreenshot ? (t('payment.uploading') || 'Uploading...') : submitting ? t('payment.submitting') : t('payment.submitForVerification')}
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
  const { t } = useTranslation();

  const orderId     = searchParams.get('order_id') || '';
  const orderNumber = searchParams.get('order_number') || orderId;
  const total       = Number(searchParams.get('total') || 0);
  const method      = searchParams.get('method') || 'bkash';
  const paymentId   = searchParams.get('payment_id') || '';

  if (!orderId) { navigate('/cart'); return null; }

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
          setStripeError(res.error || t('payment.initFailed'));
        } else {
          setStripeClientSecret(res.client_secret);
          // Update payment record with gateway ref
          if (paymentId && res.payment_intent_id) {
            updatePaymentGatewayRef(paymentId, res.payment_intent_id);
          }
        }
      });
    }
  }, [method, orderId, total]);

  const handleSuccess = () => {
    setPaymentStatus('success');
    setStatusMessage(t('payment.submittedDesc'));
    setTimeout(() => {
      navigate(`/order-success?id=${orderId}&number=${orderNumber}&total=${total}&method=${method}&via_pp=1`);
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
            style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-white">{meta?.label || t('payment.title')}</h1>
            <p className="text-[10px] text-white/30">{t('payment.order')} {orderNumber}</p>
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
              <p className="text-sm font-semibold text-green-400">{t('payment.submitted')}</p>
              <p className="text-xs text-white/50 mt-0.5">{statusMessage}</p>
            </div>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <XCircle size={20} className="text-red-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-400">{t('payment.failed')}</p>
              <p className="text-xs text-white/50 mt-0.5">{statusMessage}</p>
            </div>
            <button onClick={() => setPaymentStatus('idle')}
              className="text-xs text-white/40 hover:text-white/70 flex items-center gap-1">
              <RefreshCw size={12} /> {t('common.retry')}
            </button>
          </div>
        )}

        {/* Order summary strip */}
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
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
            <p className="text-[10px] text-white/25">{t('payment.totalAmount')}</p>
          </div>
        </div>

        {paymentStatus === 'idle' && (
          <>
            {method === 'stripe' && (
              <div className="glow-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-[#6772E5]">1</div>
                  <p className="text-sm font-semibold text-white">{t('payment.enterCardDetails')}</p>
                </div>
                {stripeLoading && (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 size={20} className="animate-spin text-[#6772E5]" />
                    <span className="text-sm text-white/40">{t('payment.initializing')}</span>
                  </div>
                )}
                {stripeError && (
                  <div className="p-4 rounded-2xl text-sm text-red-300 text-center"
                    style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <AlertCircle size={16} className="mx-auto mb-2" />
                    {stripeError}
                    <p className="text-xs text-white/30 mt-1">
                      {t('payment.stripeKeyMissing')}
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
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <Clock size={14} className="text-white/25 shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/35 leading-relaxed">
            {t('payment.verificationNote')}
            {t('payment.viewInTransactions')}
          </p>
        </div>
      </div>
    </div>
  );
}
