import { useState, useEffect } from 'react';
import { useNavigate } from '../lib/router';
import {
  Package, CheckCircle, Truck, PackageCheck, ShieldCheck,
  XCircle, ChevronRight, Loader2, X, ArrowLeft, MapPin, Phone,
  CreditCard, Copy, Tag, RefreshCw, AlertTriangle
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../lib/auth';
import { fetchOrders, fetchOrderTimeline, cancelOrder } from '../lib/api';
import { appConfig } from '../lib/config';
import { useTranslation } from 'react-i18next';

// ── Status Config ──────────────────────────────────────────────────────────────

const STATUS_STEPS = [
  { key: 'pending',    labelKey: 'orders.orderPlaced', icon: Package,      shortKey: 'orders.placed'    },
  { key: 'confirmed',  labelKey: 'orders.confirmed',   icon: ShieldCheck,  shortKey: 'orders.confirmed' },
  { key: 'processing', labelKey: 'orders.processing',  icon: RefreshCw,    shortKey: 'orders.processing'},
  { key: 'packed',     labelKey: 'orders.packed',      icon: PackageCheck, shortKey: 'orders.packed'    },
  { key: 'shipped',    labelKey: 'orders.shipped',     icon: Truck,        shortKey: 'orders.shipped'   },
  { key: 'delivered',  labelKey: 'orders.delivered',   icon: CheckCircle,  shortKey: 'orders.delivered' },
];

// Legacy keys mapped to nearest step index
const STATUS_INDEX: Record<string, number> = {
  placed: 0, pending: 0, received: 0, confirmed: 1, processing: 2,
  packed: 3, ready_for_delivery: 3, shipped: 4, out_for_delivery: 4, delivered: 5,
  cancelled: -1,
};

const PAYMENT_LABEL_KEYS: Record<string, string> = {
  cash_on_delivery: 'orders.cod',
  bkash: 'orders.bkash',
  nagad: 'orders.nagad',
  bank_transfer: 'orders.bankTransfer',
  cod: 'orders.cod',
};

const CANCELLABLE = new Set(['placed', 'pending', 'received', 'confirmed']);

// ── Order Detail Modal ─────────────────────────────────────────────────────────

function OrderDetailModal({
  order,
  onClose,
  onCancelled,
}: {
  order: any;
  onClose: () => void;
  onCancelled: (id: string) => void;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [copied, setCopied] = useState(false);

  const items = order.items || [];
  const addr = order.address || {};
  const stepIdx = STATUS_INDEX[order.status] ?? 0;
  const isCancelled = order.status === 'cancelled';
  const canCancel = CANCELLABLE.has(order.status);

  useEffect(() => {
    if (user) {
      fetchOrderTimeline(order.id).then(setTimeline);
    }
  }, [order.id, user]);

  const handleCancel = async () => {
    if (!user) return;
    setCancelling(true);
    setCancelError('');
    const { error } = await cancelOrder(order.id, user.id);
    if (error) {
      setCancelError(error);
      setCancelling(false);
    } else {
      onCancelled(order.id);
      onClose();
    }
  };

  const copyOrderNumber = () => {
    const num = order.order_number || order.id.slice(-8).toUpperCase();
    navigator.clipboard.writeText(num).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center page-transition">
      <div className="absolute inset-0 backdrop-blur-sm modal-overlay" style={{ background: "rgba(17,24,39,0.5)" }} onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{ background: 'var(--card-bg)', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-5 pb-4"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white font-mono">{order.order_number || '#' + order.id.slice(-8).toUpperCase()}</p>
              <button onClick={copyOrderNumber} className="w-6 h-6 rounded flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors">
                {copied ? <CheckCircle size={10} className="text-green-400" /> : <Copy size={10} className="text-white/40" />}
              </button>
            </div>
            <p className="text-[10px] text-white/30 mt-0.5">
              {new Date(order.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
            <X size={14} className="text-white/60" />
          </button>
        </div>

        <div className="px-5 pb-6 space-y-5 mt-4">
          {/* Status + Total */}
          <div className="flex items-center justify-between">
            {isCancelled ? (
              <span className="text-sm px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <XCircle size={13} /> {t('orders.cancelled')}
              </span>
            ) : (
              <span className="text-sm px-3 py-1.5 rounded-xl font-semibold capitalize text-mia-orange" style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
                {order.status.replace(/_/g, ' ')}
              </span>
            )}
            <div className="text-right">
              <p className="text-xl font-bold text-mia-orange">৳{Number(order.total).toLocaleString()}</p>
              <p className="text-[10px] text-white/30">{t('orders.inclDelivery')}</p>
            </div>
          </div>

          {/* Progress Stepper */}
          {!isCancelled && (
            <div className="rounded-2xl p-4" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs text-white/40 font-medium mb-4">{t('orders.orderProgress')}</p>
              {/* Horizontal steps */}
              <div className="flex items-center">
                {STATUS_STEPS.map((step, idx) => {
                  const isCompleted = idx <= stepIdx;
                  const isCurrent = idx === stepIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                          style={isCurrent
                            ? { background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 0 16px rgba(255,138,0,0.4)' }
                            : isCompleted
                              ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }
                              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }
                          }>
                          <Icon size={12} className={isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-white/20'} />
                        </div>
                        <span className="text-[8px] mt-1 font-medium text-center leading-tight max-w-[40px]"
                          style={{ color: isCurrent ? '#FF8A00' : isCompleted ? '#22c55e' : 'rgba(255,255,255,0.2)' }}>
                          {t(step.shortKey)}
                        </span>
                      </div>
                      {idx < STATUS_STEPS.length - 1 && (
                        <div className="flex-1 h-0.5 mb-5 mx-0.5 rounded-full"
                          style={{ background: idx < stepIdx ? 'linear-gradient(90deg, #22c55e, #22c55e80)' : 'rgba(255,255,255,0.08)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Current step label */}
              <p className="text-xs text-center mt-3 font-medium" style={{ color: '#FF8A00' }}>
                {STATUS_STEPS[stepIdx] ? t(STATUS_STEPS[stepIdx].labelKey) : order.status}
              </p>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{t('orders.history')}</p>
              {[...timeline].reverse().map((t, i) => {
                const idx = STATUS_INDEX[t.status] ?? 0;
                const step = STATUS_STEPS[idx] ?? STATUS_STEPS[0];
                const Icon = t.status === 'cancelled' ? XCircle : step.icon;
                const color = t.status === 'cancelled' ? '#ef4444' : '#22c55e';
                return (
                  <div key={t.id || i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                      <Icon size={10} style={{ color }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold capitalize" style={{ color }}>
                          {t.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-white/25">
                          {new Date(t.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {t.note && <p className="text-[10px] text-white/40 mt-0.5">{t.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Delivery Address */}
          <div className="rounded-2xl p-4 space-y-2" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider mb-2">{t('orders.delivery')}</p>
            <div className="flex items-center gap-2 text-sm text-white"><Phone size={12} className="text-white/30" /> {addr.phone || '—'}</div>
            <div className="flex items-start gap-2 text-xs text-white/60"><MapPin size={12} className="text-white/30 shrink-0 mt-0.5" /> {addr.address}{addr.area ? `, ${addr.area}` : ''}</div>
            <div className="flex items-center gap-2 text-xs text-white/50">
              <CreditCard size={12} className="text-white/30" />
              {PAYMENT_LABEL_KEYS[order.payment_method] ? t(PAYMENT_LABEL_KEYS[order.payment_method]) : order.payment_method}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{t('orders.items')} ({items.length})</p>
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.04)' }}>
                {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{item.name}</p>
                  <p className="text-xs text-white/35 mt-0.5">x{item.quantity} · ৳{item.price}</p>
                </div>
                <span className="text-sm font-semibold text-white/70">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
              </div>
            ))}

            {/* Price breakdown */}
            <div className="pt-2 space-y-1.5 border-t border-white/5">
              <div className="flex justify-between text-xs"><span className="text-white/40">{t('orders.subtotal')}</span><span className="text-white/60">৳{Number(order.subtotal || 0).toLocaleString()}</span></div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-green-400 flex items-center gap-1"><Tag size={9} />{t('orders.coupon')} {order.coupon_code && `(${order.coupon_code})`}</span>
                  <span className="text-green-400">-৳{Number(order.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs"><span className="text-white/40">{t('orders.delivery')}</span><span className={Number(order.delivery_charge) === 0 ? 'text-green-400' : 'text-white/60'}>{Number(order.delivery_charge) === 0 ? t('orders.free') : `৳${Number(order.delivery_charge).toLocaleString()}`}</span></div>
              <div className="flex justify-between text-sm font-bold pt-1 border-t border-white/5"><span className="text-white">{t('orders.total')}</span><span className="text-mia-orange">৳{Number(order.total).toLocaleString()}</span></div>
            </div>
          </div>

          {/* Cancel */}
          {canCancel && user && (
            <div>
              {cancelConfirm ? (
                <div className="rounded-2xl p-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-white">{t('orders.cancelConfirmTitle')}</p>
                      <p className="text-xs text-white/50 mt-0.5">{t('orders.cancelConfirmDesc')}</p>
                    </div>
                  </div>
                  {cancelError && <p className="text-xs text-red-400 mb-2">{cancelError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setCancelConfirm(false)} className="flex-1 py-2 rounded-xl text-xs font-medium text-white/60 bg-white/5 border border-white/8 hover:bg-white/10 transition-colors">
                      {t('orders.keepOrder')}
                    </button>
                    <button onClick={handleCancel} disabled={cancelling}
                      className="flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50 transition-all"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
                      {cancelling ? t('orders.cancelling') : t('orders.yesCancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setCancelConfirm(true)}
                  className="w-full py-3 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 transition-colors"
                  style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  {t('orders.cancelOrder')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function OrdersPage() {
  const { t } = useTranslation();
  const { state, dispatch } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dbOrders, setDbOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    async function load() {
      if (user) {
        const orders = await fetchOrders(user.id);
        setDbOrders(orders);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const rawOrders: any[] = user
    ? dbOrders
    : state.orders.map(o => ({
        id: o.id,
        order_number: o.id,
        items: o.items.map(i => ({ name: i.product.name, image: i.product.image, quantity: i.quantity, price: i.product.discount_price || i.product.price })),
        subtotal: o.total - o.delivery_charge,
        delivery_charge: o.delivery_charge,
        discount: 0,
        total: o.total,
        status: o.status,
        payment_method: o.payment_method,
        address: { ...o.address, phone: o.address.mobile },
        created_at: o.created_at,
      }));

  const FILTER_TABS = [
    { key: 'all', label: t('orders.all') },
    { key: 'active', label: t('orders.active') },
    { key: 'delivered', label: t('orders.delivered') },
    { key: 'cancelled', label: t('orders.cancelled') },
  ];

  const allOrders = rawOrders.filter(o => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'delivered') return o.status === 'delivered';
    if (filterStatus === 'cancelled') return o.status === 'cancelled';
    if (filterStatus === 'active') return !['delivered', 'cancelled'].includes(o.status);
    return true;
  });

  const handleCancelled = (orderId: string) => {
    setDbOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
    dispatch({ type: 'ADD_ORDER', order: { ...state.orders.find(o => o.id === orderId)!, status: 'cancelled' as any } });
  };

  if (loading) {
    return (
      <div className="page-transition min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="text-mia-orange animate-spin" />
      </div>
    );
  }

  if (rawOrders.length === 0) {
    return (
      <div className="page-transition pb-24 flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="relative w-28 h-28 mb-6 float-premium">
          <img src={appConfig.logo} alt="MIA ONE" className="w-full h-full object-contain opacity-60" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{t('orders.empty')}</h2>
        <p className="text-sm text-white/40 mb-6 text-center">{t('orders.emptyDesc')}</p>
        <button onClick={() => navigate('/')} className="px-6 py-3 rounded-xl text-sm font-semibold text-white glow-btn"
          style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
          {t('orders.startShopping')}
        </button>
      </div>
    );
  }

  return (
    <div className="page-transition pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors sm:hidden">
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{t('orders.title')}</h1>
            <p className="text-xs text-white/40">{rawOrders.length} {rawOrders.length !== 1 ? t('orders.orders') : t('orders.order')}</p>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map(tab => {
            const count = tab.key === 'all' ? rawOrders.length
              : tab.key === 'delivered' ? rawOrders.filter(o => o.status === 'delivered').length
              : tab.key === 'cancelled' ? rawOrders.filter(o => o.status === 'cancelled').length
              : rawOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
            return (
              <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0"
                style={filterStatus === tab.key
                  ? { background: 'linear-gradient(135deg, rgba(255,138,0,0.12), rgba(255,46,201,0.12))', border: '1px solid rgba(255,138,0,0.25)', color: '#FF8A00' }
                  : { background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.45)' }
                }>
                {tab.label}
                {count > 0 && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: filterStatus === tab.key ? 'rgba(255,138,0,0.15)' : 'rgba(255,255,255,0.06)', color: filterStatus === tab.key ? '#FF8A00' : 'rgba(255,255,255,0.3)' }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-3 space-y-3">
        {allOrders.length === 0 ? (
          <p className="text-center text-sm text-white/30 py-8">{t('orders.noOrdersInCategory')}</p>
        ) : allOrders.map(order => {
          const stepIdx = STATUS_INDEX[order.status] ?? 0;
          const isCancelled = order.status === 'cancelled';
          const items = order.items || [];

          return (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="w-full glow-card p-4 text-left transition-all hover:border-white/12 active:scale-[0.99]"
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-mono text-white/40">{order.order_number || '#' + order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-white/25 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-mia-orange">৳{Number(order.total).toLocaleString()}</span>
                  <ChevronRight size={14} className="text-white/20" />
                </div>
              </div>

              {/* Status Badge */}
              {isCancelled ? (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <XCircle size={10} /> {t('orders.cancelled')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium capitalize text-mia-orange" style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              )}

              {/* Progress bar (compact) */}
              {!isCancelled && (
                <div className="flex items-center gap-0.5 mt-3 mb-1">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= stepIdx;
                    const isCurrent = idx === stepIdx;
                    return (
                      <div key={step.key} className="flex items-center flex-1">
                        <div className="w-2 h-2 rounded-full transition-all shrink-0"
                          style={isCurrent
                            ? { background: '#FF8A00', boxShadow: '0 0 6px rgba(255,138,0,0.6)' }
                            : isCompleted
                              ? { background: '#22c55e' }
                              : { background: 'rgba(255,255,255,0.1)' }
                          } />
                        {idx < STATUS_STEPS.length - 1 && (
                          <div className="flex-1 h-px mx-0.5 rounded-full"
                            style={{ background: idx < stepIdx ? '#22c55e' : 'var(--border-normal)' }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Item images */}
              <div className="flex items-center gap-1.5 mt-3">
                {items.slice(0, 4).map((item: any, i: number) => (
                  item.image ? <img key={i} src={item.image} alt="" className="w-9 h-9 rounded-lg object-cover border border-white/8" /> : null
                ))}
                <span className="text-xs text-white/30 ml-1">
                  {items.length} {items.length !== 1 ? t('common.items') : t('common.item')}
                  {items.length > 4 && ` · +${items.length - 4} ${t('common.more')}`}
                </span>
                <span className="ml-auto text-[10px] text-white/25 capitalize">{PAYMENT_LABEL_KEYS[order.payment_method] ? t(PAYMENT_LABEL_KEYS[order.payment_method]) : order.payment_method}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancelled={handleCancelled}
        />
      )}
    </div>
  );
}
