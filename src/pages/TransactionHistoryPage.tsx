import { useEffect, useState } from 'react';
import {
  ArrowLeft, CreditCard, Smartphone, Landmark, Truck,
  CheckCircle2, Clock, XCircle, RotateCcw, AlertCircle,
  ChevronDown, ChevronUp, Copy, Check, RefreshCw,
} from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/auth';
import { fetchUserPayments } from '../lib/api';

const METHOD_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  cod:           { label: 'Cash on Delivery', icon: Truck,      color: '#8B8B9A' },
  bkash:         { label: 'bKash',            icon: Smartphone, color: '#E2136E' },
  nagad:         { label: 'Nagad',            icon: Smartphone, color: '#F6871F' },
  stripe:        { label: 'Stripe / Card',    icon: CreditCard, color: '#6772E5' },
  sslcommerz:    { label: 'SSLCommerz',       icon: CreditCard, color: '#00AEEF' },
  bank_transfer: { label: 'Bank Transfer',    icon: Landmark,   color: '#6B9FFF' },
};

const STATUS_META: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  pending:             { label: 'Pending',           icon: Clock,         color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  submitted:           { label: 'Submitted',         icon: AlertCircle,   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)'  },
  verified:            { label: 'Verified',          icon: CheckCircle2,  color: '#34D399', bg: 'rgba(52,211,153,0.12)'  },
  failed:              { label: 'Failed',            icon: XCircle,       color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
  refunded:            { label: 'Refunded',          icon: RotateCcw,     color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  partially_refunded:  { label: 'Part. Refunded',    icon: RotateCcw,     color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="ml-1.5 text-mia-gray hover:text-white transition-colors">
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
    </button>
  );
}

function TransactionCard({ payment }: { payment: any }) {
  const [expanded, setExpanded] = useState(false);
  const method  = METHOD_LABELS[payment.method] || { label: payment.method, icon: CreditCard, color: '#8B8B9A' };
  const status  = STATUS_META[payment.status]   || { label: payment.status,  icon: Clock,      color: '#8B8B9A', bg: 'rgba(139,139,154,0.1)' };
  const MethodIcon = method.icon;
  const StatusIcon = status.icon;
  const order = payment.orders;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 p-4 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${method.color}20` }}
        >
          <MethodIcon size={18} style={{ color: method.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{method.label}</span>
            {order?.order_number && (
              <span className="text-xs text-mia-gray">#{order.order_number}</span>
            )}
          </div>
          <span className="text-xs text-mia-gray">{fmt(payment.created_at)}</span>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <span className="text-white font-bold text-sm">৳{Number(payment.amount).toFixed(2)}</span>
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: status.bg, color: status.color }}
          >
            <StatusIcon size={10} />
            {status.label}
          </div>
        </div>

        <div className="ml-2 text-mia-gray">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div
          className="px-4 pb-4 space-y-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="pt-3 grid grid-cols-2 gap-3 text-xs">
            {/* Payment ID */}
            <div>
              <p className="text-mia-gray mb-0.5">Payment ID</p>
              <div className="flex items-center text-white font-mono truncate">
                <span className="truncate">{payment.id.slice(0, 12)}…</span>
                <CopyButton text={payment.id} />
              </div>
            </div>

            {/* Amount */}
            <div>
              <p className="text-mia-gray mb-0.5">Amount</p>
              <p className="text-white">৳{Number(payment.amount).toFixed(2)} {payment.currency?.toUpperCase() || 'BDT'}</p>
            </div>

            {/* Transaction ID for manual methods */}
            {payment.transaction_id && (
              <div>
                <p className="text-mia-gray mb-0.5">Transaction ID</p>
                <div className="flex items-center text-white font-mono">
                  <span>{payment.transaction_id}</span>
                  <CopyButton text={payment.transaction_id} />
                </div>
              </div>
            )}

            {/* Sender number for bKash/Nagad */}
            {payment.sender_number && (
              <div>
                <p className="text-mia-gray mb-0.5">Sender Number</p>
                <p className="text-white">{payment.sender_number}</p>
              </div>
            )}

            {/* Gateway ref for Stripe/SSLCommerz */}
            {payment.gateway_ref && (
              <div>
                <p className="text-mia-gray mb-0.5">Gateway Ref</p>
                <div className="flex items-center text-white font-mono">
                  <span className="truncate">{payment.gateway_ref.slice(0, 16)}…</span>
                  <CopyButton text={payment.gateway_ref} />
                </div>
              </div>
            )}

            {/* Submitted at */}
            {payment.submitted_at && (
              <div>
                <p className="text-mia-gray mb-0.5">Submitted</p>
                <p className="text-white">{fmt(payment.submitted_at)}</p>
              </div>
            )}

            {/* Verified at */}
            {payment.verified_at && (
              <div>
                <p className="text-mia-gray mb-0.5">Verified</p>
                <p className="text-green-400">{fmt(payment.verified_at)}</p>
              </div>
            )}

            {/* Refund info */}
            {payment.refund_amount != null && payment.refund_amount > 0 && (
              <div>
                <p className="text-mia-gray mb-0.5">Refunded</p>
                <p className="text-purple-400">৳{Number(payment.refund_amount).toFixed(2)}</p>
              </div>
            )}

            {payment.refunded_at && (
              <div>
                <p className="text-mia-gray mb-0.5">Refund Date</p>
                <p className="text-purple-400">{fmt(payment.refunded_at)}</p>
              </div>
            )}
          </div>

          {/* Order info */}
          {order && (
            <div
              className="rounded-xl p-3 text-xs"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <p className="text-mia-gray mb-1.5 font-medium uppercase tracking-wider text-[10px]">Order Details</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-mia-gray">Order #</p>
                  <p className="text-white">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-mia-gray">Order Total</p>
                  <p className="text-white">৳{Number(order.total).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-mia-gray">Order Status</p>
                  <p className="text-white capitalize">{order.status?.replace(/_/g, ' ') || '—'}</p>
                </div>
                <div>
                  <p className="text-mia-gray">Ordered</p>
                  <p className="text-white">{fmt(order.created_at)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Admin notes */}
          {payment.notes && (
            <div
              className="rounded-xl p-3 text-xs"
              style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)' }}
            >
              <p className="text-yellow-400 font-medium mb-1">Note from MIA ONE</p>
              <p className="text-white">{payment.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const ALL_FILTERS = ['all', 'pending', 'submitted', 'verified', 'failed', 'refunded'] as const;
type FilterKey = (typeof ALL_FILTERS)[number];

const FILTER_LABELS: Record<FilterKey, string> = {
  all:       'All',
  pending:   'Pending',
  submitted: 'Submitted',
  verified:  'Verified',
  failed:    'Failed',
  refunded:  'Refunded',
};

export function TransactionHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showSpinner = false) => {
    if (!user) return;
    if (showSpinner) setRefreshing(true);
    const data = await fetchUserPayments(user.id);
    setPayments(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter);

  const totals = {
    verified: payments.filter(p => p.status === 'verified').reduce((s, p) => s + Number(p.amount), 0),
    pending:  payments.filter(p => ['pending','submitted'].includes(p.status)).length,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-mia-black flex flex-col items-center justify-center gap-4 p-6">
        <CreditCard size={48} className="text-mia-gray" />
        <p className="text-white font-semibold text-lg">Sign in to view transactions</p>
        <button className="glow-btn px-6 py-3 rounded-2xl font-semibold" onClick={() => navigate('/login')}>
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mia-black pb-24">
      {/* Header */}
      <div
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-4"
        style={{ background: 'rgba(10,10,14,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/8 transition-colors"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1">
          <h1 className="text-white font-bold text-lg leading-none">Transaction History</h1>
          <p className="text-mia-gray text-xs mt-0.5">{payments.length} transaction{payments.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => load(true)}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/8 transition-colors"
          disabled={refreshing}
        >
          <RefreshCw size={18} className={`text-mia-gray ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary cards */}
        {payments.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
              <p className="text-green-400 text-xs font-medium mb-1">Total Paid</p>
              <p className="text-white font-bold text-xl">৳{totals.verified.toFixed(2)}</p>
              <p className="text-green-400/60 text-xs mt-0.5">verified payments</p>
            </div>
            <div className="rounded-2xl p-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-yellow-400 text-xs font-medium mb-1">Awaiting</p>
              <p className="text-white font-bold text-xl">{totals.pending}</p>
              <p className="text-yellow-400/60 text-xs mt-0.5">pending / submitted</p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {ALL_FILTERS.map(f => {
            const count = f === 'all' ? payments.length : payments.filter(p => p.status === f).length;
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all"
                style={active
                  ? { background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
                  : { background: 'transparent', color: '#8B8B9A', border: '1px solid rgba(255,255,255,0.07)' }
                }
              >
                {FILTER_LABELS[f]}
                {count > 0 && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[10px]"
                    style={active ? { background: 'rgba(255,255,255,0.15)' } : { background: 'rgba(139,139,154,0.15)' }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl h-20 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <CreditCard size={36} className="text-mia-gray" />
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-lg">
                {filter === 'all' ? 'No transactions yet' : `No ${FILTER_LABELS[filter].toLowerCase()} payments`}
              </p>
              <p className="text-mia-gray text-sm mt-1">
                {filter === 'all' ? 'Your payment history will appear here' : 'Try a different filter'}
              </p>
            </div>
            {filter === 'all' && (
              <button
                className="glow-btn px-6 py-3 rounded-2xl font-semibold"
                onClick={() => navigate('/')}
              >
                Start Shopping
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(p => (
              <TransactionCard key={p.id} payment={p} />
            ))}
          </div>
        )}

        {/* Footer note for pending */}
        {payments.some(p => ['pending','submitted'].includes(p.status)) && (
          <div
            className="rounded-2xl p-4 text-center"
            style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.15)' }}
          >
            <p className="text-blue-400 text-xs leading-relaxed">
              Manual payments (bKash, Nagad, Bank) are verified within 1–2 business hours during 10 AM – 8 PM.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
