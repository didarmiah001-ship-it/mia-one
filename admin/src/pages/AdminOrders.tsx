import { useState, useEffect, useCallback } from 'react';
import {
  Search, X, Printer, Download, ChevronRight,
  Package, Clock, CheckCircle, Truck, PackageCheck, XCircle,
  Filter, RefreshCw, FileText, MapPin, Phone, User, Calendar,
  ArrowUpDown, Eye, CreditCard, Image as ImageIcon
} from 'lucide-react';
import { adminFetchAllOrders, adminUpdateOrderStatus, fetchOrderTimeline, fetchPayment } from '../lib/api';
import { useToast } from '../components/Toast';
import { appConfig } from '../lib/config';

// ── Constants ──────────────────────────────────────────────────────────────────

export const ALL_STATUSES = [
  { key: 'placed',          label: 'Placed',          color: '#FF8A00', icon: Package },
  { key: 'pending',         label: 'Pending',         color: '#94a3b8', icon: Clock },
  { key: 'received',        label: 'Received',       color: '#00D1FF', icon: PackageCheck },
  { key: 'confirmed',       label: 'Confirmed',       color: '#00D1FF', icon: CheckCircle },
  { key: 'processing',      label: 'Processing',      color: '#FF8A00', icon: RefreshCw },
  { key: 'packed',          label: 'Packed',          color: '#7B2CFF', icon: PackageCheck },
  { key: 'ready_for_delivery',label: 'Ready for Delivery',color: '#FF8A00', icon: PackageCheck },
  { key: 'shipped',         label: 'Shipped',         color: '#FF2EC9', icon: Truck },
  { key: 'out_for_delivery',label: 'Out for Delivery',color: '#FF2EC9', icon: Truck },
  { key: 'delivered',       label: 'Delivered',       color: '#22c55e', icon: CheckCircle },
  { key: 'cancelled',       label: 'Cancelled',       color: '#ef4444', icon: XCircle },
  { key: 'refunded',        label: 'Refunded',        color: '#ef4444', icon: XCircle },
];

// Action buttons available for each status
const STATUS_ACTIONS: Record<string, { label: string; nextStatus: string; color: string }[]> = {
  placed: [
    { label: 'Receive', nextStatus: 'received', color: '#00D1FF' },
    { label: 'Confirm', nextStatus: 'confirmed', color: '#22c55e' },
    { label: 'Cancel', nextStatus: 'cancelled', color: '#ef4444' },
  ],
  pending: [
    { label: 'Receive', nextStatus: 'received', color: '#00D1FF' },
    { label: 'Confirm', nextStatus: 'confirmed', color: '#22c55e' },
    { label: 'Cancel', nextStatus: 'cancelled', color: '#ef4444' },
  ],
  received: [
    { label: 'Processing', nextStatus: 'processing', color: '#FF8A00' },
    { label: 'Cancel', nextStatus: 'cancelled', color: '#ef4444' },
  ],
  confirmed: [
    { label: 'Processing', nextStatus: 'processing', color: '#FF8A00' },
    { label: 'Cancel', nextStatus: 'cancelled', color: '#ef4444' },
  ],
  processing: [
    { label: 'Packed', nextStatus: 'packed', color: '#7B2CFF' },
    { label: 'Cancel', nextStatus: 'cancelled', color: '#ef4444' },
  ],
  packed: [
    { label: 'Ready', nextStatus: 'ready_for_delivery', color: '#FF8A00' },
    { label: 'Shipped', nextStatus: 'shipped', color: '#FF2EC9' },
  ],
  ready_for_delivery: [
    { label: 'Out for Delivery', nextStatus: 'out_for_delivery', color: '#FF2EC9' },
    { label: 'Shipped', nextStatus: 'shipped', color: '#FF2EC9' },
  ],
  shipped: [
    { label: 'Out for Delivery', nextStatus: 'out_for_delivery', color: '#FF2EC9' },
  ],
  out_for_delivery: [
    { label: 'Delivered', nextStatus: 'delivered', color: '#22c55e' },
  ],
};

function statusMeta(key: string) {
  return ALL_STATUSES.find(s => s.key === key) ?? { label: key, color: '#94a3b8', icon: Package };
}

// ── Invoice Printer ────────────────────────────────────────────────────────────

function buildInvoiceHTML(order: any, payment?: any) {
  const addr = order.address || {};
  const items = order.items || [];
  const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const paymentMethod = (order.payment_method || payment?.method || '').replace(/_/g, ' ');
  const transactionId = payment?.transaction_id || order.transaction_id || '';
  const paymentStatus = payment?.status || order.payment_status || 'pending';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>Invoice ${order.order_number || order.id}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:32px;max-width:800px;margin:0 auto}
    h1{font-size:24px;font-weight:800;color:#FF8A00;margin-bottom:4px}
    .logo-sub{color:#666;font-size:11px;margin-bottom:16px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #FF8A00;padding-bottom:16px}
    .badge{display:inline-block;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:600}
    .badge-success{background:#dcfce7;color:#16a34a;border:1px solid #86efac}
    .badge-warning{background:#fef3c7;color:#d97706;border:1px solid #fcd34d}
    .badge-default{background:#f3f4f6;color:#6b7280;border:1px solid #d1d5db}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f8f9fa;padding:10px 12px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#666;border-bottom:2px solid #e5e7eb}
    td{padding:10px 12px;border-bottom:1px solid #f3f4f6}
    .total-row td{font-weight:700;border-top:2px solid #111}
    .section{margin-bottom:20px}
    .section-title{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#888;margin-bottom:8px;font-weight:600}
    .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:24px}
    .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#666;text-align:center}
    @media print{body{padding:20px}.no-print{display:none}}
  </style></head><body>
  <div class="header">
    <div>
      <h1>MIA ONE</h1>
      <p class="logo-sub">E-Commerce Platform</p>
      <p style="color:#888;font-size:11px;margin-top:8px">Tax Invoice / Receipt</p>
    </div>
    <div style="text-align:right">
      <p style="font-weight:700;font-size:16px;color:#111">${order.order_number || '#' + String(order.id).slice(-8).toUpperCase()}</p>
      <p style="color:#666;margin-top:4px">${date}</p>
      <p style="margin-top:8px"><span class="badge ${order.status === 'delivered' ? 'badge-success' : order.status === 'cancelled' ? 'badge-default' : 'badge-warning'}">${statusMeta(order.status).label}</span></p>
    </div>
  </div>
  <div class="section grid-2">
    <div>
      <p class="section-title">Bill To</p>
      <p style="font-weight:600;font-size:14px">${addr.full_name || 'Customer'}</p>
      <p style="color:#555;margin-top:4px">${addr.phone || 'N/A'}</p>
      <p style="color:#555;margin-top:6px">${addr.address || ''}</p>
      <p style="color:#555">${[addr.area, addr.city].filter(Boolean).join(', ') || ''}</p>
    </div>
    <div>
      <p class="section-title">Payment Details</p>
      <p style="font-weight:600;text-transform:capitalize">${paymentMethod || 'N/A'}</p>
      ${transactionId ? `<p style="color:#555;margin-top:4px"><span style="color:#888">Transaction ID:</span> ${transactionId}</p>` : ''}
      <p style="margin-top:4px"><span style="color:#888">Status:</span> <span style="text-transform:capitalize;color:${paymentStatus === 'submitted' || paymentStatus === 'confirmed' ? '#16a34a' : '#d97706'}">${paymentStatus}</span></p>
    </div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>
      ${items.length > 0 ? items.map((item: any, i: number) => `
        <tr><td>${i + 1}</td><td>${item.name || 'Product'}</td><td style="text-align:center">${item.quantity || 1}</td>
        <td style="text-align:right">৳${Number(item.price || 0).toLocaleString()}</td>
        <td style="text-align:right;font-weight:500">৳${((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString()}</td></tr>
      `).join('') : '<tr><td colspan="5" style="text-align:center;color:#888">No items</td></tr>'}
    </tbody>
    <tfoot>
      <tr><td colspan="4" style="text-align:right;padding-top:12px">Subtotal</td><td style="text-align:right;padding-top:12px">৳${Number(order.subtotal || 0).toLocaleString()}</td></tr>
      ${Number(order.discount || 0) > 0 ? `<tr><td colspan="4" style="text-align:right;color:#16a34a">Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}</td><td style="text-align:right;color:#16a34a">-৳${Number(order.discount).toLocaleString()}</td></tr>` : ''}
      <tr><td colspan="4" style="text-align:right">Delivery Charge</td><td style="text-align:right">${Number(order.delivery_charge || 0) === 0 ? '<span style="color:#16a34a">Free</span>' : '৳' + Number(order.delivery_charge).toLocaleString()}</td></tr>
      <tr class="total-row"><td colspan="4" style="text-align:right;font-size:14px">Grand Total</td><td style="text-align:right;font-size:16px;color:#FF8A00">৳${Number(order.total || 0).toLocaleString()}</td></tr>
    </tfoot>
  </table>
  ${addr.notes ? `<div class="section"><p class="section-title">Customer Note</p><p style="color:#555;font-style:italic">${addr.notes}</p></div>` : ''}
  <div class="footer">
    <p style="font-weight:600;margin-bottom:4px">Thank you for shopping with MIA ONE!</p>
    <p>For support: support@mia-one.com</p>
  </div>
  </body></html>`;
}

function printInvoice(order: any, payment?: any) {
  const invoiceHtml = buildInvoiceHTML(order, payment);
  const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');

  if (!printWindow || printWindow.closed) {
    alert('Popup blocked. Please allow popups to print the invoice, or try downloading.');
    return;
  }

  try {
    printWindow.document.open();
    printWindow.document.write(invoiceHtml);
    printWindow.document.close();
    printWindow.focus();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };

    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
      }
    }, 500);
  } catch (e) {
    console.error('Print error:', e);
    alert('Unable to print. Please try again.');
  }
}

// ── CSV Export ─────────────────────────────────────────────────────────────────

function exportCSV(orders: any[]) {
  const headers = ['Order Number', 'Date', 'Customer', 'Phone', 'Address', 'Area', 'City', 'Items', 'Payment', 'Subtotal', 'Delivery', 'Discount', 'Total', 'Status'];
  const rows = orders.map(o => {
    const addr = o.address || {};
    return [
      o.order_number || o.id.slice(-8).toUpperCase(),
      new Date(o.created_at).toLocaleDateString(),
      addr.full_name || '',
      addr.phone || '',
      addr.address || '',
      addr.area || '',
      addr.city || o.city || '',
      (o.items || []).length,
      (o.payment_method || '').replace(/_/g, ' '),
      o.subtotal || 0,
      o.delivery_charge || 0,
      o.discount || 0,
      o.total || 0,
      o.status,
    ];
  });

  const csv = [headers, ...rows]
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mia-one-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── PDF Export (print-based) ───────────────────────────────────────────────────

function exportPDF(orders: any[]) {
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const rows = orders.map(o => {
    const addr = o.address || {};
    const sm = statusMeta(o.status);
    return `<tr>
      <td>${o.order_number || o.id.slice(-8).toUpperCase()}</td>
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
      <td>${addr.full_name || ''}</td>
      <td>${addr.phone || ''}</td>
      <td>${(o.items || []).length} items</td>
      <td>${(o.payment_method || '').replace(/_/g, ' ')}</td>
      <td>৳${Number(o.total).toFixed(2)}</td>
      <td style="color:${sm.color};font-weight:600">${sm.label}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Orders Report</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;padding:24px}
  h1{font-size:18px;font-weight:800;color:#FF8A00;margin-bottom:4px}
  table{width:100%;border-collapse:collapse;margin-top:16px}
  th{background:#f8f9fa;padding:7px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.03em;color:#555}
  td{padding:7px 8px;border-bottom:1px solid #eee}
  tr:nth-child(even) td{background:#fafafa}
  </style></head><body>
  <h1>${appConfig.name} — Orders Report</h1>
  <p style="color:#888;font-size:11px">Generated ${date} · ${orders.length} orders</p>
  <table><thead><tr><th>Order #</th><th>Date</th><th>Customer</th><th>Phone</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody></table></body></html>`;

  const w = window.open('', '_blank', 'width=1100,height=700');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

// ── Order Detail Drawer ────────────────────────────────────────────────────────

function OrderDrawer({ order, onClose, onStatusChange }: { order: any; onClose: () => void; onStatusChange: (id: string, status: string) => void }) {
  const toast = useToast();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [payment, setPayment] = useState<any>(null);
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);

  useEffect(() => {
    fetchOrderTimeline(order.id).then(setTimeline);
    if (order.payment_id || order.id) {
      fetchPayment(order.payment_id || order.id).then(p => {
        if (p) setPayment(p);
      });
    }
  }, [order.id, order.payment_id]);

  const sm = statusMeta(order.status);
  const addr = order.address || {};
  const items = order.items || [];
  const actions = STATUS_ACTIONS[order.status] || [];

  const handleUpdate = async () => {
    if (newStatus === order.status) return;
    setUpdating(true);
    const { error } = await adminUpdateOrderStatus(order.id, newStatus, statusNote);
    if (error) { toast.error(error); }
    else {
      toast.success('Status updated');
      onStatusChange(order.id, newStatus);
      const tl = await fetchOrderTimeline(order.id);
      setTimeline(tl);
      setStatusNote('');
    }
    setUpdating(false);
  };

  const handleQuickStatus = async (nextStatus: string, label: string) => {
    setUpdating(true);
    const { error } = await adminUpdateOrderStatus(order.id, nextStatus);
    if (error) { toast.error(error); }
    else {
      toast.success(`Marked as ${label}`);
      onStatusChange(order.id, nextStatus);
      const tl = await fetchOrderTimeline(order.id);
      setTimeline(tl);
    }
    setUpdating(false);
  };

  const paymentScreenshotUrl = payment?.screenshot_url || payment?.payment_screenshot_url || order.payment_screenshot_url;
  const customerPaymentNote = payment?.customer_note || order.customer_payment_note;

  return (
    <div className="fixed inset-0 z-[9990] flex">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md h-full overflow-y-auto flex flex-col"
        style={{ background: 'linear-gradient(180deg, #141820, #0D1117)', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between"
          style={{ background: 'rgba(13,17,23,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(12px)' }}>
          <div>
            <p className="text-xs text-white/40 font-mono">{order.order_number || '#' + order.id.slice(-8).toUpperCase()}</p>
            <h3 className="text-sm font-bold text-white mt-0.5">Order Details</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => printInvoice(order, payment)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors" title="Print Invoice">
              <Printer size={13} className="text-white/50" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <X size={14} className="text-white/60" />
            </button>
          </div>
        </div>

        <div className="flex-1 px-5 py-4 space-y-5">
          {/* Status Badge + Meta */}
          <div className="flex items-center justify-between">
            <span className="text-xs px-3 py-1 rounded-lg font-semibold capitalize" style={{ color: sm.color, background: `${sm.color}12`, border: `1px solid ${sm.color}30` }}>
              {sm.label}
            </span>
            <div className="text-right">
              <p className="text-xl font-bold text-mia-orange">৳{Number(order.total).toLocaleString()}</p>
              <p className="text-[10px] text-white/30 mt-0.5">{new Date(order.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>

          {/* Quick Actions */}
          {actions.length > 0 && (
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Quick Actions</p>
              <div className="flex flex-wrap gap-2">
                {actions.map(action => (
                  <button key={action.nextStatus} onClick={() => handleQuickStatus(action.nextStatus, action.label)} disabled={updating}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: `${action.color}15`, color: action.color, border: `1px solid ${action.color}30` }}>
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Update Status */}
          <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Set Status Manually</p>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_STATUSES.map(s => (
                <button key={s.key} onClick={() => setNewStatus(s.key)}
                  className="px-3 py-2 rounded-xl text-xs font-medium transition-all text-left"
                  style={newStatus === s.key
                    ? { background: `${s.color}15`, border: `1px solid ${s.color}40`, color: s.color }
                    : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }
                  }>
                  {s.label}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Optional note (e.g. tracking number, reason)"
              value={statusNote}
              onChange={e => setStatusNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-xl text-xs text-white placeholder:text-white/25 resize-none focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            />
            <button onClick={handleUpdate} disabled={updating || newStatus === order.status}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: newStatus !== order.status ? `linear-gradient(135deg, ${statusMeta(newStatus).color}, ${statusMeta(newStatus).color}99)` : 'rgba(255,255,255,0.05)' }}>
              {updating ? 'Updating...' : `Set to "${statusMeta(newStatus).label}"`}
            </button>
          </div>

          {/* Customer & Delivery */}
          <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Customer</p>
            <div className="flex items-center gap-2">
              <User size={12} className="text-white/30 shrink-0" />
              <span className="text-sm text-white">{addr.full_name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={12} className="text-white/30 shrink-0" />
              <span className="text-sm text-white/70">{addr.phone || '—'}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={12} className="text-white/30 shrink-0 mt-0.5" />
              <span className="text-xs text-white/60 leading-relaxed">{addr.address}{addr.area ? `, ${addr.area}` : ''}{addr.city ? `, ${addr.city}` : ''}</span>
            </div>
            {addr.notes && (
              <div className="flex items-start gap-2">
                <FileText size={12} className="text-white/30 shrink-0 mt-0.5" />
                <span className="text-xs text-white/40">{addr.notes}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Items ({items.length})</p>
            {items.length === 0 ? (
              <div className="p-4 rounded-xl text-center text-white/30 text-xs" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                No items found
              </div>
            ) : (
              items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{item.name}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">x{item.quantity} · ৳{item.price}</p>
                  </div>
                  <span className="text-xs font-semibold text-white/70">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
                </div>
              ))
            )}
            {/* Totals */}
            <div className="pt-2 space-y-1.5 border-t border-white/5">
              <div className="flex justify-between text-xs"><span className="text-white/40">Subtotal</span><span className="text-white/70">৳{Number(order.subtotal || 0).toLocaleString()}</span></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-xs"><span className="text-green-400">Coupon {order.coupon_code && `(${order.coupon_code})`}</span><span className="text-green-400">-৳{Number(order.discount).toLocaleString()}</span></div>}
              <div className="flex justify-between text-xs"><span className="text-white/40">Delivery</span><span className={Number(order.delivery_charge) === 0 ? 'text-green-400' : 'text-white/70'}>{Number(order.delivery_charge) === 0 ? 'Free' : `৳${Number(order.delivery_charge).toLocaleString()}`}</span></div>
              <div className="flex justify-between text-sm font-bold pt-1"><span className="text-white">Total</span><span className="text-mia-orange">৳{Number(order.total).toLocaleString()}</span></div>
            </div>
          </div>

          {/* Payment Details */}
          {(payment || order.payment_method) && (
            <div className="space-y-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <CreditCard size={12} className="text-white/30" />
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Payment Details</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-white/35">Method</span>
                  <span className="text-white/70 capitalize">{(order.payment_method || payment?.method || '').replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/35">Status</span>
                  <span className={`capitalize ${payment?.status === 'verified' ? 'text-green-400' : payment?.status === 'failed' ? 'text-red-400' : 'text-white/70'}`}>
                    {payment?.status || order.payment_status || 'Pending'}
                  </span>
                </div>
                {payment?.transaction_id && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/35">Transaction ID</span>
                    <span className="text-white/70 font-mono">{payment.transaction_id}</span>
                  </div>
                )}
                {payment?.sender_number && (
                  <div className="flex justify-between text-xs">
                    <span className="text-white/35">Sender Number</span>
                    <span className="text-white/70">{payment.sender_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Screenshot */}
          {paymentScreenshotUrl && (
            <div className="space-y-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <ImageIcon size={12} className="text-white/30" />
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Payment Proof / Screenshot</p>
              </div>
              <a href={paymentScreenshotUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img src={paymentScreenshotUrl} alt="Payment proof" className="w-full rounded-xl object-cover border border-white/10 hover:border-mia-orange/40 transition-colors" style={{ maxHeight: '250px' }} />
              </a>
              <p className="text-[10px] text-white/30 text-center">Click to open full size</p>
            </div>
          )}

          {/* Customer Payment Note */}
          {customerPaymentNote && (
            <div className="space-y-3 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-white/30" />
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Customer Note</p>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{customerPaymentNote}</p>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Timeline</p>
              <div className="space-y-2">
                {timeline.map((t, i) => {
                  const tsm = statusMeta(t.status);
                  const Icon = tsm.icon;
                  return (
                    <div key={t.id || i} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${tsm.color}15`, border: `1px solid ${tsm.color}30` }}>
                        <Icon size={10} style={{ color: tsm.color }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold" style={{ color: tsm.color }}>{tsm.label}</span>
                          <span className="text-[10px] text-white/25">{new Date(t.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {t.note && <p className="text-[10px] text-white/40 mt-0.5">{t.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await adminFetchAllOrders({ status: statusFilter, search, dateFrom, dateTo });
    setOrders(data);
    setLoading(false);
  }, [statusFilter, search, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...orders].sort((a, b) => {
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return sortAsc ? diff : -diff;
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === orderId) setSelectedOrder((o: any) => o ? { ...o, status: newStatus } : o);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string, label: string) => {
    const { error } = await adminUpdateOrderStatus(orderId, newStatus);
    if (error) toast.error(error);
    else { toast.success(`Marked as ${label}`); handleStatusChange(orderId, newStatus); }
  };

  // Status counts for pipeline
  const statusCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s.key] = orders.filter(o => o.status === s.key).length;
    return acc;
  }, {} as Record<string, number>);
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Orders <span className="text-white/30 text-sm font-normal">({orders.length})</span></h2>
          <p className="text-xs text-white/30 mt-0.5">Total Revenue: <span className="text-mia-orange font-semibold">৳{totalRevenue.toLocaleString()}</span></p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => exportCSV(sorted)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Download size={12} /> CSV
          </button>
          <button onClick={() => exportPDF(sorted)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <FileText size={12} /> PDF
          </button>
          <button onClick={load} className="w-8 h-8 rounded-xl bg-white/4 flex items-center justify-center hover:bg-white/8 transition-colors border border-white/6">
            <RefreshCw size={13} className="text-white/50" />
          </button>
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {[
          { key: 'all', label: 'All', color: '#94a3b8' },
          { key: 'placed', label: 'Placed', color: '#FF8A00' },
          { key: 'pending', label: 'Pending', color: '#94a3b8' },
          { key: 'received', label: 'Received', color: '#00D1FF' },
          { key: 'confirmed', label: 'Confirmed', color: '#00D1FF' },
          { key: 'processing', label: 'Processing', color: '#FF8A00' },
          { key: 'packed', label: 'Packed', color: '#7B2CFF' },
          { key: 'out_for_delivery', label: 'Out', color: '#FF2EC9' },
          { key: 'delivered', label: 'Delivered', color: '#22c55e' },
          { key: 'cancelled', label: 'Cancelled', color: '#ef4444' },
        ].map(s => {
          const count = s.key === 'all' ? orders.length : (statusCounts[s.key] || 0);
          return (
            <button key={s.key} onClick={() => setStatusFilter(s.key)}
              className="flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-xl text-center transition-all"
              style={statusFilter === s.key
                ? { background: `${s.color}15`, border: `1px solid ${s.color}35` }
                : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }
              }>
              <span className="text-base font-bold leading-none" style={{ color: statusFilter === s.key ? s.color : 'rgba(255,255,255,0.7)' }}>{count}</span>
              <span className="text-[9px] font-medium leading-tight mt-0.5 text-center" style={{ color: statusFilter === s.key ? s.color : 'rgba(255,255,255,0.3)' }}>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search order #, customer, phone…"
            className="w-full pl-9 pr-3 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40"
          />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={12} className="text-white/30" /></button>}
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors"
          style={showFilters ? { color: '#FF8A00', background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' } : { color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Filter size={12} /> Filters {(dateFrom || dateTo) && <span className="w-1.5 h-1.5 rounded-full bg-mia-orange" />}
        </button>
        <button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ArrowUpDown size={12} /> {sortAsc ? 'Oldest' : 'Newest'}
        </button>
      </div>

      {/* Date Filters */}
      {showFilters && (
        <div className="flex items-center gap-3 flex-wrap p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-white/40 shrink-0" />
            <span className="text-xs text-white/40">Date range:</span>
          </div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="admin-input py-1.5 text-xs w-auto" />
          <span className="text-white/30 text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="admin-input py-1.5 text-xs w-auto" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="text-xs text-red-400/60 hover:text-red-400">
              Clear
            </button>
          )}
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="glow-card h-24 shimmer" />)}</div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12 text-white/25 text-sm">No orders found</div>
      ) : (
        <div className="space-y-2">
          {sorted.map(order => {
            const sm = statusMeta(order.status);
            const Icon = sm.icon;
            const addr = order.address || {};
            const items = order.items || [];
            const actions = STATUS_ACTIONS[order.status] || [];
            return (
              <div key={order.id} className="glow-card overflow-hidden transition-all hover:border-white/10">
                <div className="flex items-stretch">
                  {/* Status bar */}
                  <div className="w-1 shrink-0" style={{ background: sm.color }} />

                  <div className="flex-1 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Top row */}
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono font-bold text-white">{order.order_number || '#' + order.id.slice(-8).toUpperCase()}</span>
                          <span className="text-xs px-2 py-0.5 rounded-lg font-medium capitalize flex items-center gap-1"
                            style={{ color: sm.color, background: `${sm.color}10`, border: `1px solid ${sm.color}25` }}>
                            <Icon size={9} /> {sm.label}
                          </span>
                          {order.coupon_code && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded text-green-400 bg-green-500/8">
                              {order.coupon_code}
                            </span>
                          )}
                        </div>

                        {/* Customer */}
                        <p className="text-sm font-semibold text-white truncate">{addr.full_name || 'Customer'}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-white/40 flex items-center gap-1"><Phone size={9} />{addr.phone || '—'}</span>
                          <span className="text-[11px] text-white/40 flex items-center gap-1"><MapPin size={9} />{addr.area || addr.city || '—'}</span>
                          <span className="text-[11px] text-white/30">{items.length} item{items.length !== 1 ? 's' : ''} · {(order.payment_method || '').replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-[10px] text-white/20 mt-1">{new Date(order.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      {/* Right: amount + actions */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-base font-bold text-mia-orange">৳{Number(order.total).toLocaleString()}</span>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {actions.map(action => (
                            <button key={action.nextStatus} onClick={() => handleStatusUpdate(order.id, action.nextStatus, action.label)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:scale-105"
                              style={{ background: `${action.color}15`, color: action.color, border: `1px solid ${action.color}30` }}>
                              {action.label}
                            </button>
                          ))}
                          <button onClick={() => printInvoice(order)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors" title="Print">
                            <Printer size={11} className="text-white/40" />
                          </button>
                          <button onClick={() => setSelectedOrder(order)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }} title="View">
                            <Eye size={11} className="text-mia-orange" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item image strip */}
                    {items.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-3">
                        {items.slice(0, 4).map((item: any, i: number) => (
                          item.image ? <img key={i} src={item.image} alt="" className="w-8 h-8 rounded-md object-cover border border-white/8" /> : null
                        ))}
                        {items.length > 4 && <span className="text-[10px] text-white/30">+{items.length - 4}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <OrderDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
