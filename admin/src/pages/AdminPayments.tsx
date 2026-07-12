import { useState, useEffect } from 'react';
import { Search, RefreshCw, CheckCircle2, XCircle, Clock, CreditCard, Filter, ChevronDown, Eye, X, Image as ImageIcon, FileText, User, Phone, MapPin } from 'lucide-react';
import { adminFetchAllPayments, adminUpdatePaymentStatus, adminFetchOrderWithProfile } from '../lib/api';
import { useToast } from '../components/Toast';

const STATUS_OPTIONS = [
  { key: 'all',       label: 'All',       color: 'rgba(255,255,255,0.4)' },
  { key: 'pending',   label: 'Pending',   color: '#f59e0b'               },
  { key: 'submitted', label: 'Submitted', color: '#00D1FF'               },
  { key: 'verified',  label: 'Verified',  color: '#22c55e'               },
  { key: 'failed',    label: 'Failed',    color: '#ef4444'               },
  { key: 'refunded',  label: 'Refunded',  color: '#7B2CFF'               },
];

const METHOD_OPTIONS = [
  { key: 'all',              label: 'All Methods'    },
  { key: 'cash_on_delivery', label: 'Cash on Delivery' },
  { key: 'bkash',            label: 'bKash'          },
  { key: 'nagad',            label: 'Nagad'          },
  { key: 'stripe',           label: 'Stripe'         },
  { key: 'sslcommerz',       label: 'SSLCommerz'     },
  { key: 'bank_transfer',    label: 'Bank Transfer'  },
];

function statusColor(s: string) {
  return STATUS_OPTIONS.find(o => o.key === s)?.color || 'rgba(255,255,255,0.4)';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Payment Detail Drawer Component
function PaymentDetailDrawer({
  payment,
  onClose,
  onStatusUpdate,
  updatingId,
  setUpdatingId,
  toast,
}: {
  payment: any;
  onClose: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  updatingId: string | null;
  setUpdatingId: (id: string | null) => void;
  toast: { success: (msg: string) => void; error: (msg: string) => void };
}) {
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // Fetch full order details with customer info
    const fetchOrderDetails = async () => {
      if (payment.order_id) {
        const data = await adminFetchOrderWithProfile(payment.order_id);
        setOrderDetails(data);
      }
    };
    fetchOrderDetails();
  }, [payment.order_id]);

  const updateStatus = async (status: string) => {
    setUpdatingId(payment.id);
    const { error } = await adminUpdatePaymentStatus(payment.id, status);
    setUpdatingId(null);
    if (error) { toast.error(error); return; }
    toast.success(`Payment marked as ${status}`);
    onStatusUpdate(payment.id, status);
  };

  const screenshotUrl = payment.screenshot_url || payment.payment_screenshot_url;
  const customerNote = payment.customer_note;
  const address = orderDetails?.address || {};
  const items = orderDetails?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md flex flex-col h-full overflow-y-auto"
        style={{ background: '#0F0F17', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
          style={{ background: '#0F0F17', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            <CreditCard size={16} className="text-mia-orange" />
            <h2 className="text-sm font-bold text-white">Payment Detail</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/8 transition-colors">
            <X size={14} className="text-white/50" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status badge */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl text-sm font-semibold capitalize"
              style={{ background: `${statusColor(payment.status)}15`, color: statusColor(payment.status), border: `1px solid ${statusColor(payment.status)}30` }}>
              {payment.status}
            </span>
            <span className="text-sm font-bold text-white">৳{Number(payment.amount || 0).toLocaleString()}</span>
          </div>

          {/* Payment Details */}
          <div className="space-y-3 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Payment Info</p>
            {[
              ['Order', orderDetails?.order_number || payment.order_id?.slice(-8).toUpperCase()],
              ['Method', payment.method?.replace(/_/g, ' ')],
              ['Amount', `৳${Number(payment.amount || 0).toLocaleString()} ${payment.currency || 'BDT'}`],
              ['TX ID', payment.transaction_id || '—'],
              ['Sender Number', payment.sender_number || '—'],
              ['Gateway Ref', payment.gateway_ref || '—'],
              ['Created', fmtDate(payment.created_at)],
              payment.submitted_at ? ['Submitted', fmtDate(payment.submitted_at)] : null,
              payment.verified_at  ? ['Verified',  fmtDate(payment.verified_at)]  : null,
              payment.refunded_at  ? ['Refunded',  fmtDate(payment.refunded_at)]  : null,
            ].filter((x): x is [string, string] => x !== null).map(([k, v]) => (
              <div key={k as string} className="flex justify-between gap-4">
                <span className="text-xs text-white/35 capitalize">{k}</span>
                <span className="text-xs text-white/70 text-right font-medium capitalize">{v}</span>
              </div>
            ))}
          </div>

          {/* Customer Information */}
          {orderDetails && (
            <div className="space-y-3 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Customer Info</p>
              <div className="flex items-center gap-2">
                <User size={12} className="text-white/30 shrink-0" />
                <span className="text-sm text-white">{address.full_name || orderDetails.profiles?.full_name || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-white/30 shrink-0" />
                <span className="text-sm text-white/70">{address.phone || orderDetails.profiles?.phone || '—'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={12} className="text-white/30 shrink-0 mt-0.5" />
                <span className="text-xs text-white/60 leading-relaxed">
                  {address.address}{address.area ? `, ${address.area}` : ''}{address.city ? `, ${address.city}` : ''}
                </span>
              </div>
            </div>
          )}

          {/* Order Items */}
          {items.length > 0 && (
            <div className="space-y-3 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Items ({items.length})</p>
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{item.name}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">x{item.quantity} · ৳{item.price}</p>
                  </div>
                  <span className="text-xs font-semibold text-white/70">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {/* Payment Screenshot */}
          {screenshotUrl && (
            <div className="space-y-3 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <ImageIcon size={12} className="text-white/30" />
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Payment Proof / Screenshot</p>
              </div>
              <a href={screenshotUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img src={screenshotUrl} alt="Payment proof" className="w-full rounded-xl object-cover border border-white/10 hover:border-mia-orange/40 transition-colors" style={{ maxHeight: '300px' }} />
              </a>
              <p className="text-[10px] text-white/30 text-center">Click to open full size</p>
            </div>
          )}

          {/* Customer Note */}
          {customerNote && (
            <div className="space-y-3 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-white/30" />
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Customer Note</p>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{customerNote}</p>
            </div>
          )}

          {/* Action buttons */}
          {payment.status === 'submitted' && (
            <div className="space-y-2">
              <p className="text-xs text-white/30 font-medium uppercase tracking-wider">Update Status</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={updatingId === payment.id}
                  onClick={() => updateStatus('verified')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
                >
                  <CheckCircle2 size={14} /> Verify
                </button>
                <button
                  disabled={updatingId === payment.id}
                  onClick={() => updateStatus('failed')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <XCircle size={14} /> Reject
                </button>
              </div>
            </div>
          )}

          {payment.status === 'verified' && (
            <button
              disabled={updatingId === payment.id}
              onClick={() => updateStatus('refunded')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
              style={{ background: 'rgba(123,44,255,0.1)', color: '#7B2CFF', border: '1px solid rgba(123,44,255,0.2)' }}
            >
              <Clock size={14} /> Mark as Refunded
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminPayments() {
  const toast = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showMethodMenu, setShowMethodMenu] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await adminFetchAllPayments({
      status: statusFilter,
      method: methodFilter,
      search: search.trim() || undefined,
    });
    setPayments(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [statusFilter, methodFilter]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load(); };


  const filtered = search.trim()
    ? payments.filter(p =>
        (p.transaction_id || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.orders?.order_number || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.gateway_ref || '').toLowerCase().includes(search.toLowerCase())
      )
    : payments;

  const statusCounts = STATUS_OPTIONS.reduce((acc, o) => {
    acc[o.key] = o.key === 'all' ? payments.length : payments.filter(p => p.status === o.key).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {STATUS_OPTIONS.filter(o => o.key !== 'all').map(o => (
          <button
            key={o.key}
            onClick={() => setStatusFilter(o.key === statusFilter ? 'all' : o.key)}
            className="rounded-xl p-3 text-left transition-all"
            style={{
              background: statusFilter === o.key ? `${o.color}18` : '#13131A',
              border: statusFilter === o.key ? `1px solid ${o.color}40` : '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-lg font-bold" style={{ color: o.color }}>{statusCounts[o.key] || 0}</p>
            <p className="text-[11px] text-white/40 mt-0.5">{o.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by TX ID, order number…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/25 outline-none"
            style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.07)' }}
          />
        </form>

        <div className="flex gap-2">
          {/* Method filter */}
          <div className="relative">
            <button
              onClick={() => setShowMethodMenu(v => !v)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white/60 hover:text-white transition-colors"
              style={{ background: '#13131A', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Filter size={14} />
              <span className="hidden sm:inline">{METHOD_OPTIONS.find(m => m.key === methodFilter)?.label}</span>
              <ChevronDown size={12} />
            </button>
            {showMethodMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden min-w-44"
                style={{ background: '#1A1A24', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                {METHOD_OPTIONS.map(o => (
                  <button key={o.key}
                    onClick={() => { setMethodFilter(o.key); setShowMethodMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                    style={{ color: methodFilter === o.key ? '#FF8A00' : 'rgba(255,255,255,0.6)' }}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={load}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white/5 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <RefreshCw size={14} className={`text-white/40 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['Order', 'Method', 'Amount', 'TX ID', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)', width: `${60 + j * 10}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-white/30">No payments found</td>
                </tr>
              ) : filtered.map(p => (
                <tr
                  key={p.id}
                  className="hover:bg-white/2 transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  onClick={() => setSelected(p)}
                >
                  <td className="px-4 py-3 text-xs font-medium text-white/70">
                    {p.orders?.order_number || p.order_id?.slice(-8).toUpperCase()}
                  </td>
                  <td className="px-4 py-3 text-xs text-white/50 capitalize">{p.method?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-white">৳{Number(p.amount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-white/40 font-mono">{p.transaction_id || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg text-[11px] font-medium capitalize"
                      style={{ background: `${statusColor(p.status)}15`, color: statusColor(p.status) }}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-white/30">{fmtDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded-lg hover:bg-white/8 transition-colors" onClick={e => { e.stopPropagation(); setSelected(p); }}>
                      <Eye size={13} className="text-white/30" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2 animate-pulse">
                <div className="h-4 rounded w-2/3" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.04)' }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-white/30">No payments found</div>
          ) : filtered.map(p => (
            <div key={p.id} className="p-4 flex items-center justify-between gap-3 hover:bg-white/2 transition-colors cursor-pointer"
              onClick={() => setSelected(p)}>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/80 truncate">
                  {p.orders?.order_number || p.order_id?.slice(-8).toUpperCase()}
                </p>
                <p className="text-xs text-white/35 capitalize mt-0.5">{p.method?.replace(/_/g, ' ')} · {fmtDate(p.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-sm font-semibold text-white">৳{Number(p.amount || 0).toLocaleString()}</p>
                <span className="px-2 py-0.5 rounded-lg text-[11px] font-medium capitalize"
                  style={{ background: `${statusColor(p.status)}15`, color: statusColor(p.status) }}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <PaymentDetailDrawer
          payment={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={(id, status) => {
            if (selected?.id === id) setSelected((p: any) => ({ ...p, status }));
            load();
          }}
          updatingId={updatingId}
          setUpdatingId={setUpdatingId}
          toast={toast}
        />
      )}
    </div>
  );
}
