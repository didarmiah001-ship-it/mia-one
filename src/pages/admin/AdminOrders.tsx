import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, X, Printer, Download, ChevronRight,
  Package, Clock, CheckCircle, Truck, PackageCheck, XCircle,
  Filter, RefreshCw, FileText, MapPin, Phone, User, Calendar,
  ArrowUpDown, Eye, MessageCircle
} from 'lucide-react';
import { adminFetchAllOrders, adminUpdateOrderStatus, fetchOrderTimeline } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { appConfig } from '../../lib/config';

// ── Constants ──────────────────────────────────────────────────────────────────

export const ALL_STATUSES = [
  { key: 'pending',         label: 'Pending',         color: '#94a3b8', icon: Clock },
  { key: 'confirmed',       label: 'Confirmed',       color: '#00D1FF', icon: CheckCircle },
  { key: 'processing',      label: 'Processing',      color: '#FF8A00', icon: RefreshCw },
  { key: 'packed',          label: 'Packed',          color: '#7B2CFF', icon: PackageCheck },
  { key: 'shipped',         label: 'Shipped',         color: '#FF2EC9', icon: Truck },
  { key: 'delivered',       label: 'Delivered',       color: '#22c55e', icon: CheckCircle },
  { key: 'cancelled',       label: 'Cancelled',       color: '#ef4444', icon: XCircle },
  // legacy
  { key: 'placed',          label: 'Placed',          color: '#FF8A00', icon: Package },
  { key: 'out_for_delivery',label: 'Out for Delivery',color: '#FF2EC9', icon: Truck },
];

const NEXT_STATUS: Record<string, string> = {
  placed: 'confirmed', pending: 'confirmed', confirmed: 'processing',
  processing: 'packed', packed: 'shipped', shipped: 'delivered',
};

function statusMeta(key: string) {
  return ALL_STATUSES.find(s => s.key === key) ?? { label: key, color: '#94a3b8', icon: Package };
}

// ── Receipt Text for WhatsApp ─────────────────────────────────────────────────

function buildReceiptText(order: any): string {
  const addr = order.address || {};
  const items = order.items || [];
  const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const orderNum = order.order_number || ('#' + order.id.slice(-8).toUpperCase());

  const computedSubtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const subtotal = Number(order.subtotal) || computedSubtotal;

  const itemLines = items.map((item: any) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return `  • ${item.name} x${qty} = ৳${(price * qty).toLocaleString()}`;
  }).join('\n');

  const lines = [
    `🛍️ *${appConfig.name} — Order Receipt*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📦 Order: *${orderNum}*`,
    `📅 Date: ${date}`,
    ``,
    `👤 *Customer*`,
    `Name: ${addr.full_name || order.profiles?.full_name || 'N/A'}`,
    `Phone: ${addr.phone || '—'}`,
    `Address: ${[addr.address, addr.area, addr.city].filter(Boolean).join(', ')}`,
    ``,
    `🛒 *Items*`,
    itemLines,
    ``,
    `💰 *Summary*`,
    `Subtotal: ৳${subtotal.toLocaleString()}`,
  ];

  if (Number(order.discount) > 0) {
    lines.push(`Discount: -৳${Number(order.discount).toLocaleString()}${order.coupon_code ? ` (${order.coupon_code})` : ''}`);
  }

  lines.push(`Delivery: ${Number(order.delivery_charge) === 0 ? 'Free' : '৳' + Number(order.delivery_charge).toLocaleString()}`);
  lines.push(`*Total: ৳${Number(order.total).toLocaleString()}*`);
  lines.push(``);
  lines.push(`💳 *Payment*`);
  lines.push(`Method: ${(order.payment_method || '').replace(/_/g, ' ')}`);
  if (order.transaction_id) lines.push(`Txn ID: ${order.transaction_id}`);
  lines.push(`Status: ${order.payment_status || 'Pending'}`);
  lines.push(``);
  lines.push(`📋 Order Status: *${statusMeta(order.status).label}*`);
  lines.push(``);
  lines.push(`🙏 Thank you for shopping with ${appConfig.name}!`);
  lines.push(`📧 ${appConfig.support.email}`);

  return lines.join('\n');
}

function shareOnWhatsApp(order: any) {
  const addr = order.address || {};
  const rawPhone = (addr.phone || '').replace(/\D/g, '');
  if (!rawPhone) return;

  // Normalize: if starts with 0, replace with 880 (Bangladesh)
  const normalized = rawPhone.startsWith('0') ? '880' + rawPhone.slice(1) : rawPhone;
  const text = encodeURIComponent(buildReceiptText(order));
  window.open(`https://wa.me/${normalized}?text=${text}`, '_blank', 'noopener,noreferrer');
}

// ── Invoice HTML (for PDF download) ───────────────────────────────────────────

function buildInvoiceHTML(order: any, logoUrl: string) {
  const addr = order.address || {};
  const items = order.items || [];
  const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const orderNum = order.order_number || ('#' + order.id.slice(-8).toUpperCase());
  const sm = statusMeta(order.status);

  const computedSubtotal = items.reduce((sum: number, item: any) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const subtotal = Number(order.subtotal) || computedSubtotal;

  const itemRows = items.map((item: any, i: number) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const lineTotal = (price * qty).toFixed(2);
    const imgTag = item.image
      ? `<img src="${item.image}" style="width:36px;height:36px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:8px" />`
      : '';
    return `<tr>
      <td>${i + 1}</td>
      <td>${imgTag}<span style="vertical-align:middle">${item.name}</span></td>
      <td style="text-align:center">${qty}</td>
      <td style="text-align:right">৳${price.toFixed(2)}</td>
      <td style="text-align:right">৳${lineTotal}</td>
    </tr>`;
  }).join('');

  const discountRow = Number(order.discount) > 0
    ? `<tr><td colspan="4" style="text-align:right;color:#16a34a">Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}</td><td style="text-align:right;color:#16a34a">-৳${Number(order.discount).toFixed(2)}</td></tr>`
    : '';

  const deliveryText = Number(order.delivery_charge) === 0 ? 'Free' : `৳${Number(order.delivery_charge).toFixed(2)}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>Invoice ${orderNum}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#111;background:#fff}
  .page{max-width:794px;margin:0 auto;padding:40px 48px}
  .logo-section{display:flex;align-items:center;gap:14px;margin-bottom:6px}
  .logo-img{height:48px;width:auto}
  .brand-name{font-size:26px;font-weight:900;color:#FF8A00;letter-spacing:-0.5px}
  .brand-tagline{font-size:10px;color:#888;margin-top:2px}
  .header{display:flex;justify-content:space-between;align-items:flex-start;padding:20px 0 18px;border-bottom:2px solid #FF8A00;margin-bottom:24px}
  .invoice-meta{text-align:right}
  .invoice-meta .order-num{font-size:15px;font-weight:800;color:#111}
  .invoice-meta .date{font-size:11px;color:#888;margin-top:3px}
  .status-badge{display:inline-block;background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;padding:3px 10px;border-radius:4px;font-size:10px;font-weight:700;margin-top:6px}
  .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}
  .section-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#999;margin-bottom:8px}
  .info-name{font-size:13px;font-weight:700;color:#111;margin-bottom:4px}
  .info-row{font-size:11px;color:#555;margin-bottom:2px}
  table{width:100%;border-collapse:collapse;margin-bottom:8px}
  th{background:#f8f9fa;padding:9px 10px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#666;border-bottom:2px solid #eee}
  td{padding:9px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
  .totals td{border:none;padding:5px 10px;font-size:12px}
  .grand-total td{font-size:14px;font-weight:800;border-top:2px solid #eee;padding-top:10px}
  .grand-total .amount{color:#FF8A00}
  .payment-section{margin-top:20px;padding:14px;background:#fafafa;border:1px solid #eee;border-radius:6px}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #eee;text-align:center;font-size:11px;color:#aaa}
  .footer strong{color:#888}
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="logo-section" style="flex-direction:column;align-items:flex-start">
      <div style="display:flex;align-items:center;gap:12px">
        <img src="${logoUrl}" class="logo-img" alt="MIA ONE" onerror="this.style.display='none'" />
        <div>
          <div class="brand-name">${appConfig.name}</div>
          <div class="brand-tagline">${appConfig.slogan}</div>
        </div>
      </div>
      <div style="margin-top:8px;font-size:10px;color:#aaa">Tax Invoice / Receipt</div>
    </div>
    <div class="invoice-meta">
      <div class="order-num">${orderNum}</div>
      <div class="date">${date}</div>
      <div class="status-badge" style="background:${sm.color}15;color:${sm.color};border-color:${sm.color}40">${sm.label}</div>
    </div>
  </div>

  <div class="grid-2">
    <div>
      <div class="section-label">Bill To</div>
      <div class="info-name">${addr.full_name || order.profiles?.full_name || 'Customer'}</div>
      <div class="info-row">📞 ${addr.phone || '—'}</div>
      <div class="info-row">📍 ${addr.address || ''}${addr.area ? ', ' + addr.area : ''}${addr.city ? ', ' + addr.city : ''}</div>
      ${addr.notes ? `<div class="info-row" style="color:#aaa">Note: ${addr.notes}</div>` : ''}
    </div>
    <div>
      <div class="section-label">Payment Info</div>
      <div class="info-name" style="text-transform:capitalize">${(order.payment_method || '').replace(/_/g, ' ')}</div>
      ${order.transaction_id ? `<div class="info-row">Txn ID: <strong>${order.transaction_id}</strong></div>` : ''}
      <div class="info-row">Status: <strong style="color:${order.payment_status === 'paid' ? '#16a34a' : '#f59e0b'}">${order.payment_status || 'Pending'}</strong></div>
      <div class="info-row" style="margin-top:8px">Order Status: <strong style="color:${sm.color}">${sm.label}</strong></div>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>#</th><th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Subtotal</th></tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr class="totals"><td colspan="4" style="text-align:right;color:#555">Subtotal</td><td style="text-align:right">৳${subtotal.toFixed(2)}</td></tr>
      ${discountRow}
      <tr class="totals"><td colspan="4" style="text-align:right;color:#555">Delivery Charge</td><td style="text-align:right">${deliveryText}</td></tr>
      <tr class="grand-total"><td colspan="4" style="text-align:right">Grand Total</td><td class="amount" style="text-align:right">৳${Number(order.total).toFixed(2)}</td></tr>
    </tfoot>
  </table>

  <div class="footer">
    <p>🙏 <strong>Thank you for shopping with ${appConfig.name}!</strong></p>
    <p style="margin-top:4px">${appConfig.support.email} · ${appConfig.support.address.replace(/\n/g, ' · ')}</p>
  </div>
</div>
</body>
</html>`;
}

// ── Print (hidden iframe, no about:blank) ────────────────────────────────────

function printInvoice(order: any) {
  const logoUrl = window.location.origin + appConfig.logo;
  const html = buildInvoiceHTML(order, logoUrl);

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;border:0;visibility:hidden';
  document.body.appendChild(iframe);

  // srcdoc triggers onload reliably without about:blank
  iframe.srcdoc = html;

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (_) {}
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 3000);
  };
}

// ── PDF Download (opens print-to-PDF in new tab) ─────────────────────────────

function downloadPDF(order: any) {
  const logoUrl = window.location.origin + appConfig.logo;
  const html = buildInvoiceHTML(order, logoUrl);
  const orderNum = order.order_number || order.id.slice(-8).toUpperCase();

  // Write to a blob URL and open in new tab — user saves as PDF via Ctrl+P → Save as PDF
  // This is the only cross-browser way to get a true PDF without a server or library.
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  // Open in new tab (user presses Ctrl+P or uses browser menu to save as PDF)
  const tab = window.open(url, '_blank', 'noopener');
  if (!tab) {
    // Fallback: direct download as .html if popup blocked
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice-${orderNum}.html`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

// ── CSV Export ─────────────────────────────────────────────────────────────────

function exportCSV(orders: any[]) {
  const headers = ['Order Number', 'Date', 'Customer', 'Phone', 'Address', 'Area', 'City', 'Items', 'Payment', 'Subtotal', 'Delivery', 'Discount', 'Total', 'Status'];
  const rows = orders.map(o => {
    const addr = o.address || {};
    return [
      o.order_number || o.id.slice(-8).toUpperCase(),
      new Date(o.created_at).toLocaleDateString(),
      addr.full_name || o.profiles?.full_name || '',
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
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── PDF Report Export (no popup) ──────────────────────────────────────────────

function exportPDF(orders: any[]) {
  const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const rows = orders.map(o => {
    const addr = o.address || {};
    const sm = statusMeta(o.status);
    return `<tr>
      <td>${o.order_number || o.id.slice(-8).toUpperCase()}</td>
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
      <td>${addr.full_name || o.profiles?.full_name || ''}</td>
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
  @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <h1>${appConfig.name} — Orders Report</h1>
  <p style="color:#888;font-size:11px">Generated ${date} · ${orders.length} orders</p>
  <table><thead><tr><th>Order #</th><th>Date</th><th>Customer</th><th>Phone</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
  <tbody>${rows}</tbody></table></body></html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mia-one-orders-report-${new Date().toISOString().slice(0, 10)}.html`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// ── Receipt Modal ──────────────────────────────────────────────────────────────

function ReceiptModal({ order, onClose }: { order: any; onClose: () => void }) {
  const addr = order.address || {};
  const items: any[] = order.items || [];
  const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const orderNum = order.order_number || ('#' + order.id.slice(-8).toUpperCase());
  const sm = statusMeta(order.status);
  const printRef = useRef<HTMLDivElement>(null);
  const computedSubtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const subtotal = Number(order.subtotal) || computedSubtotal;

  const handlePrint = () => printInvoice(order);
  const handleDownload = () => downloadPDF(order);
  const handleWhatsApp = () => shareOnWhatsApp(order);

  const canWhatsApp = !!(addr.phone || '').replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#fff', boxShadow: '0 25px 80px rgba(0,0,0,0.6)' }}>

        {/* Receipt Content */}
        <div ref={printRef} className="p-6" style={{ color: '#111' }}>
          {/* Logo + Brand */}
          <div className="flex items-center gap-3 mb-5 pb-5 border-b-2 border-orange-400">
            <img src={appConfig.logo} alt="MIA ONE" className="h-10 w-auto" onError={e => (e.currentTarget.style.display = 'none')} />
            <div>
              <div className="text-xl font-black" style={{ color: '#FF8A00' }}>{appConfig.name}</div>
              <div className="text-[10px] text-gray-400">{appConfig.slogan}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-xs font-mono font-bold text-gray-700">{orderNum}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{date}</div>
              <span className="text-[9px] px-2 py-0.5 rounded font-semibold mt-1 inline-block"
                style={{ background: `${sm.color}15`, color: sm.color, border: `1px solid ${sm.color}30` }}>
                {sm.label}
              </span>
            </div>
          </div>

          {/* Customer + Payment grid */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Customer</p>
              <p className="text-sm font-bold text-gray-800">{addr.full_name || order.profiles?.full_name || 'N/A'}</p>
              <p className="text-xs text-gray-500 mt-1">📞 {addr.phone || '—'}</p>
              <p className="text-xs text-gray-500 mt-0.5">📍 {[addr.address, addr.area, addr.city].filter(Boolean).join(', ') || '—'}</p>
              {addr.notes && <p className="text-[10px] text-gray-400 mt-1">Note: {addr.notes}</p>}
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2">Payment</p>
              <p className="text-sm font-bold text-gray-800 capitalize">{(order.payment_method || '').replace(/_/g, ' ')}</p>
              {order.transaction_id && <p className="text-xs text-gray-500 mt-1">Txn: <span className="font-mono">{order.transaction_id}</span></p>}
              <p className="text-xs mt-1">
                <span className="font-medium" style={{ color: order.payment_status === 'paid' ? '#16a34a' : '#f59e0b' }}>
                  {order.payment_status || 'Pending'}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">Status: <strong style={{ color: sm.color }}>{sm.label}</strong></p>
            </div>
          </div>

          {/* Items table */}
          <table className="w-full mb-4" style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                <th style={{ padding: '7px 8px', textAlign: 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#888' }}>Product</th>
                <th style={{ padding: '7px 8px', textAlign: 'center', fontSize: '10px', textTransform: 'uppercase', color: '#888' }}>Qty</th>
                <th style={{ padding: '7px 8px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', color: '#888' }}>Unit</th>
                <th style={{ padding: '7px 8px', textAlign: 'right', fontSize: '10px', textTransform: 'uppercase', color: '#888' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: '12px 8px', textAlign: 'center', color: '#aaa' }}>No items</td></tr>
              ) : items.map((item: any, i: number) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '7px 8px', color: '#333' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {item.image && (
                          <img src={item.image} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: '#555' }}>{qty}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', color: '#555' }}>৳{price.toFixed(2)}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 600, color: '#333' }}>৳{(price * qty).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1.5 pt-3 border-t border-gray-100">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Subtotal</span><span>৳{subtotal.toFixed(2)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                <span>-৳{Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>Delivery Charge</span>
              <span>{Number(order.delivery_charge) === 0 ? 'Free' : `৳${Number(order.delivery_charge).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-sm font-black pt-2 border-t border-gray-200">
              <span className="text-gray-800">Grand Total</span>
              <span style={{ color: '#FF8A00', fontSize: '16px' }}>৳{Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          {/* Thank you */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs font-semibold text-gray-500">Thank you for shopping with {appConfig.name}!</p>
            <p className="text-[10px] text-gray-400 mt-1">{appConfig.support.email}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 px-6 py-4 border-t border-gray-100 flex items-center gap-2"
          style={{ background: '#fff' }}>
          <button onClick={handleWhatsApp} disabled={!canWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: '#25D366', color: '#fff' }}
            title={canWhatsApp ? 'Share on WhatsApp' : 'No phone number'}>
            <MessageCircle size={15} /> WhatsApp
          </button>
          <button onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,138,0,0.12)', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.25)' }}>
            <Download size={15} /> Download
          </button>
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#555', border: '1px solid #e5e7eb' }}>
            <Printer size={15} /> Print
          </button>
          <button onClick={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: '#f3f4f6', color: '#888' }}>
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Order Detail Drawer ────────────────────────────────────────────────────────

function OrderDrawer({ order, onClose, onStatusChange }: { order: any; onClose: () => void; onStatusChange: (id: string, status: string) => void }) {
  const toast = useToast();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchOrderTimeline(order.id).then(setTimeline);
  }, [order.id]);

  const sm = statusMeta(order.status);
  const addr = order.address || {};
  const items = order.items || [];

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

  return (
    <>
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
              <button onClick={() => setShowReceipt(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: 'rgba(255,138,0,0.1)', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.2)' }}
                title="View / Print / Share Receipt">
                <FileText size={12} /> Receipt
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

            {/* Update Status */}
            <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Update Status</p>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_STATUSES.filter(s => !['placed', 'out_for_delivery'].includes(s.key)).map(s => (
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
                <span className="text-sm text-white">{addr.full_name || order.profiles?.full_name || 'N/A'}</span>
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
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                  {item.image && <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{item.name}</p>
                    <p className="text-[10px] text-white/35 mt-0.5">x{item.quantity} · ৳{item.price}</p>
                  </div>
                  <span className="text-xs font-semibold text-white/70">৳{(Number(item.price) * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              {/* Totals */}
              <div className="pt-2 space-y-1.5 border-t border-white/5">
                <div className="flex justify-between text-xs"><span className="text-white/40">Subtotal</span><span className="text-white/70">৳{Number(order.subtotal || 0).toLocaleString()}</span></div>
                {Number(order.discount) > 0 && <div className="flex justify-between text-xs"><span className="text-green-400">Coupon {order.coupon_code && `(${order.coupon_code})`}</span><span className="text-green-400">-৳{Number(order.discount).toLocaleString()}</span></div>}
                <div className="flex justify-between text-xs"><span className="text-white/40">Delivery</span><span className={Number(order.delivery_charge) === 0 ? 'text-green-400' : 'text-white/70'}>{Number(order.delivery_charge) === 0 ? 'Free' : `৳${Number(order.delivery_charge).toLocaleString()}`}</span></div>
                <div className="flex justify-between text-sm font-bold pt-1"><span className="text-white">Total</span><span className="text-mia-orange">৳{Number(order.total).toLocaleString()}</span></div>
              </div>
            </div>

            {/* Payment info */}
            {(order.transaction_id || order.payment_status) && (
              <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Payment</p>
                <div className="flex justify-between text-xs"><span className="text-white/40">Method</span><span className="text-white/70 capitalize">{(order.payment_method || '').replace(/_/g, ' ')}</span></div>
                {order.transaction_id && <div className="flex justify-between text-xs"><span className="text-white/40">Transaction ID</span><span className="text-white/70 font-mono">{order.transaction_id}</span></div>}
                <div className="flex justify-between text-xs"><span className="text-white/40">Payment Status</span><span className={order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}>{order.payment_status || 'Pending'}</span></div>
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

      {showReceipt && (
        <ReceiptModal order={order} onClose={() => setShowReceipt(false)} />
      )}
    </>
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

  const quickAdvance = async (order: any) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    const { error } = await adminUpdateOrderStatus(order.id, next);
    if (error) toast.error(error);
    else { toast.success(`Moved to ${statusMeta(next).label}`); handleStatusChange(order.id, next); }
  };

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
          ...ALL_STATUSES.filter(s => !['placed', 'out_for_delivery'].includes(s.key))
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
            const canAdvance = !!NEXT_STATUS[order.status];
            return (
              <div key={order.id} className="glow-card overflow-hidden transition-all hover:border-white/10">
                <div className="flex items-stretch">
                  <div className="w-1 shrink-0" style={{ background: sm.color }} />
                  <div className="flex-1 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
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
                        <p className="text-sm font-semibold text-white truncate">{addr.full_name || order.profiles?.full_name || 'Customer'}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-white/40 flex items-center gap-1"><Phone size={9} />{addr.phone || '—'}</span>
                          <span className="text-[11px] text-white/40 flex items-center gap-1"><MapPin size={9} />{addr.area || addr.city || '—'}</span>
                          <span className="text-[11px] text-white/30">{items.length} item{items.length !== 1 ? 's' : ''} · {(order.payment_method || '').replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-[10px] text-white/20 mt-1">{new Date(order.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className="text-base font-bold text-mia-orange">৳{Number(order.total).toLocaleString()}</span>
                        <div className="flex items-center gap-1.5">
                          {canAdvance && (
                            <button onClick={() => quickAdvance(order)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all hover:scale-105"
                              style={{ background: `${statusMeta(NEXT_STATUS[order.status]).color}15`, color: statusMeta(NEXT_STATUS[order.status]).color, border: `1px solid ${statusMeta(NEXT_STATUS[order.status]).color}30` }}>
                              <ChevronRight size={10} /> {statusMeta(NEXT_STATUS[order.status]).label}
                            </button>
                          )}
                          <button onClick={() => setSelectedOrder(order)} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }} title="View">
                            <Eye size={11} className="text-mia-orange" />
                          </button>
                        </div>
                      </div>
                    </div>

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
