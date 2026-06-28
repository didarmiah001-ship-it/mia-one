import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Search, X, Printer, Download, ChevronRight,
  Package, Clock, CheckCircle, Truck, PackageCheck, XCircle,
  Filter, RefreshCw, FileText, MapPin, Phone, User, Calendar,
  ArrowUpDown, Eye, CreditCard, Image as ImageIcon, MessageCircle
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

// ── Invoice Modal Component ─────────────────────────────────────────────────────

// ── Company Constants ──────────────────────────────────────────────────────────

const COMPANY = {
  name: 'MIA ONE',
  tagline: 'Everything You Need',
  website: 'miaone.shop',
  email: 'miaonebd@gmail.com',
  whatsapp: '01823057578',
  whatsappRaw: '8801823057578',
  logo: '/mia-one-logo.png',
  address: 'মিয়া শপ, দশত্তর, পাঁচগাঁও, টংগিবাড়ি, মুন্সিগঞ্জ, ঢাকা, বাংলাদেশ',
};

// ── Resolve order items from any possible field name ───────────────────────────

function resolveItems(order: any): any[] {
  const raw = order.items ?? order.order_items ?? order.line_items ?? order.products ?? [];
  if (!Array.isArray(raw)) return [];
  return raw.map((item: any) => ({
    name: item.name || item.product_name || item.title || 'Product',
    price: Number(item.price ?? item.unit_price ?? item.amount ?? 0),
    quantity: Number(item.quantity ?? item.qty ?? item.count ?? 1),
    image: item.image ?? item.image_url ?? item.thumbnail ?? null,
  }));
}

// ── PDF Download via jsPDF + html2canvas → real .pdf file ──────────────────────

async function downloadInvoicePDF(el: HTMLElement, orderNum: string) {
  const clone = el.cloneNode(true) as HTMLElement;
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1';
  clone.style.cssText = 'background:#fff;color:#111;padding:0;width:794px;font-family:Arial,Helvetica,sans-serif';
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(`Invoice-${orderNum}.pdf`);
    return pdf;
  } finally {
    if (document.body.contains(wrapper)) document.body.removeChild(wrapper);
  }
}

// ── Invoice Modal Component ────────────────────────────────────────────────────

function InvoiceModal({ order, payment, onClose }: { order: any; payment?: any; onClose: () => void }) {
  const addr = order.address || {};
  const items = resolveItems(order);
  const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const paymentMethod = (order.payment_method || payment?.method || '').replace(/_/g, ' ');
  const transactionId = payment?.transaction_id || order.transaction_id || '';
  const paymentStatus = payment?.status || order.payment_status || 'pending';
  const sm = statusMeta(order.status);
  const orderNum = order.order_number || '#' + String(order.id).slice(-8).toUpperCase();
  const orderNumClean = (order.order_number || order.id.slice(-8)).toUpperCase();

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = Number(order.discount || 0);
  const couponDiscount = Number(order.coupon_discount || 0);
  const deliveryCharge = Number(order.delivery_charge || 0);
  const grandTotal = Number(order.total || 0);

  const invoiceRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${orderNumClean}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 12mm; }
      @media print {
        body { background: #fff !important; }
        #invoice-content { padding: 0 !important; }
      }
    `,
  });

  const handleDownloadPDF = async () => {
    if (downloading || !invoiceRef.current) return;
    setDownloading(true);
    try {
      await downloadInvoicePDF(invoiceRef.current, orderNumClean);
    } catch (err) {
      console.error('PDF download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppShare = async () => {
    const customerPhone = addr.phone;
    if (!customerPhone) { alert('Customer WhatsApp number not available.'); return; }
    const normalizedPhone = normalizeBangladeshPhone(customerPhone);
    if (!normalizedPhone) { alert('Customer WhatsApp number not available.'); return; }

    // Generate PDF first so user can download it, then open WhatsApp
    if (invoiceRef.current && !downloading) {
      setDownloading(true);
      try { await downloadInvoicePDF(invoiceRef.current, orderNumClean); }
      catch (err) { console.error('PDF for WhatsApp failed:', err); }
      finally { setDownloading(false); }
    }

    const message = buildWhatsAppMessage(order, payment);
    const waUrl = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const statusBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    background: order.status === 'delivered' ? '#dcfce7' : order.status === 'cancelled' || order.status === 'refunded' ? '#fee2e2' : '#fef3c7',
    color: order.status === 'delivered' ? '#16a34a' : order.status === 'cancelled' || order.status === 'refunded' ? '#dc2626' : '#d97706',
    border: `1px solid ${order.status === 'delivered' ? '#86efac' : order.status === 'cancelled' || order.status === 'refunded' ? '#fca5a5' : '#fcd34d'}`,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em',
    color: '#FF8A00', marginBottom: '8px', fontWeight: 700,
  };

  const infoValue: React.CSSProperties = { color: '#333', fontSize: '12px', lineHeight: '1.6' };
  const infoLabel: React.CSSProperties = { color: '#999', fontSize: '11px' };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 print:p-0" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 print:bg-white" />

      <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto print:max-h-none print:rounded-none print:shadow-none shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Action Buttons - Hidden on Print */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex items-center justify-between no-print">
          <h2 className="text-lg font-bold text-gray-900">Invoice / Receipt</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 transition-colors">
              <Printer size={14} /> Print
            </button>
            <button onClick={handleDownloadPDF} disabled={downloading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-colors disabled:opacity-60" style={{ background: '#FF8A00' }}>
              <Download size={14} /> {downloading ? 'Generating…' : 'Download PDF'}
            </button>
            <button onClick={handleWhatsAppShare} disabled={downloading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-colors disabled:opacity-60">
              <MessageCircle size={14} /> WhatsApp
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <X size={16} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div id="invoice-content" ref={invoiceRef} className="p-8 print:p-0" style={{ background: '#fff', color: '#111' }}>

          {/* ── HEADER ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '20px', borderBottom: '3px solid #FF8A00', marginBottom: '24px' }}>
            {/* Left: Logo + Company */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img src={COMPANY.logo} alt="MIA ONE" style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                <div>
                  <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FF8A00', margin: 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>MIA ONE</h1>
                  <p style={{ color: '#666', fontSize: '12px', margin: '2px 0 0 0', fontWeight: 500 }}>{COMPANY.tagline}</p>
                </div>
              </div>
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#888' }}>
                <p style={{ margin: '2px 0' }}>{COMPANY.website}</p>
                <p style={{ margin: '2px 0' }}>{COMPANY.email}</p>
                <p style={{ margin: '2px 0' }}>WhatsApp: {COMPANY.whatsapp}</p>
              </div>
            </div>
            {/* Right: Invoice meta */}
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#999', fontWeight: 600, margin: '0 0 4px 0' }}>Invoice</p>
              <p style={{ fontWeight: 800, fontSize: '18px', color: '#111', margin: 0 }}>{orderNum}</p>
              <p style={{ color: '#666', fontSize: '12px', marginTop: '6px' }}>{date}</p>
              <p style={{ marginTop: '10px' }}>
                <span style={statusBadgeStyle}>{sm.label}</span>
              </p>
            </div>
          </div>

          {/* ── CUSTOMER + PAYMENT INFO ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Customer */}
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px' }}>
              <p style={sectionLabel}>Customer Information</p>
              <p style={{ fontWeight: 600, fontSize: '13px', color: '#111', margin: '0 0 4px 0' }}>{addr.full_name || 'Customer'}</p>
              <p style={{ ...infoValue, margin: '0 0 4px 0' }}>{addr.phone || 'N/A'}</p>
              {addr.address && (
                <p style={{ ...infoValue, margin: '0 0 2px 0' }}>
                  {addr.address}{addr.area ? `, ${addr.area}` : ''}{addr.city ? `, ${addr.city}` : ''}
                </p>
              )}
              {addr.notes && (
                <p style={{ ...infoValue, margin: '6px 0 0 0', fontStyle: 'italic', color: '#666' }}>
                  <span style={infoLabel}>Note: </span>{addr.notes}
                </p>
              )}
            </div>
            {/* Payment */}
            <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '16px' }}>
              <p style={sectionLabel}>Payment Information</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={infoLabel}>Method</span>
                <span style={{ ...infoValue, textTransform: 'capitalize', fontWeight: 500 }}>{paymentMethod || 'N/A'}</span>
              </div>
              {transactionId && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={infoLabel}>Transaction ID</span>
                  <span style={infoValue}>{transactionId}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={infoLabel}>Payment Status</span>
                <span style={{ ...infoValue, textTransform: 'capitalize', color: paymentStatus === 'confirmed' || paymentStatus === 'submitted' ? '#16a34a' : '#d97706', fontWeight: 500 }}>{paymentStatus}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={infoLabel}>Order Status</span>
                <span style={{ ...infoValue, textTransform: 'capitalize', fontWeight: 500 }}>{sm.label}</span>
              </div>
            </div>
          </div>

          {/* ── PRODUCT TABLE ── */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
            <thead>
              <tr>
                {['#', 'Product', 'Qty', 'Unit Price', 'Subtotal'].map((h, i) => (
                  <th key={h} style={{
                    background: '#FF8A00', color: '#fff', padding: '10px 12px',
                    fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700,
                    textAlign: i === 0 ? 'left' : i === 2 ? 'center' : i === 1 ? 'left' : 'right',
                    borderRadius: i === 0 ? '8px 0 0 0' : i === 4 ? '0 8px 0 0' : 0,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: '#666' }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.image ? (
                        <img src={item.image} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: '6px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={16} color="#999" />
                        </div>
                      )}
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', textAlign: 'right' }}>৳{item.price.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', textAlign: 'right', fontWeight: 600 }}>৳{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#999', fontSize: '12px' }}>No items found</td></tr>
              )}
            </tbody>
          </table>

          {/* ── SUMMARY ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
            <div style={{ width: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px' }}>
                <span style={{ color: '#666' }}>Subtotal</span>
                <span style={{ fontWeight: 500 }}>৳{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px' }}>
                  <span style={{ color: '#16a34a' }}>Discount</span>
                  <span style={{ color: '#16a34a', fontWeight: 500 }}>-৳{discount.toLocaleString()}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px' }}>
                  <span style={{ color: '#16a34a' }}>Coupon Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                  <span style={{ color: '#16a34a', fontWeight: 500 }}>-৳{couponDiscount.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '12px' }}>
                <span style={{ color: '#666' }}>Delivery Charge</span>
                <span style={{ fontWeight: 500 }}>
                  {deliveryCharge === 0 ? <span style={{ color: '#16a34a' }}>Free</span> : `৳${deliveryCharge.toLocaleString()}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0 0', fontSize: '15px', fontWeight: 700, borderTop: '2px solid #FF8A00', marginTop: '4px' }}>
                <span>Grand Total</span>
                <span style={{ color: '#FF8A00', fontSize: '18px' }}>৳{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div style={{ paddingTop: '20px', borderTop: '2px solid #f3f4f6', textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '13px', color: '#111', margin: '0 0 6px 0' }}>Thank you for shopping with MIA ONE!</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '11px', color: '#666', marginBottom: '12px' }}>
              <span>{COMPANY.website}</span>
              <span>•</span>
              <span>{COMPANY.email}</span>
              <span>•</span>
              <span>WhatsApp: {COMPANY.whatsapp}</span>
            </div>
            <div style={{ fontSize: '11px', color: '#999', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {COMPANY.address}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-content, #invoice-content * { visibility: visible; }
          #invoice-content { position: absolute; left: 0; top: 0; width: 100%; background: white; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ── WhatsApp Status Notification Messages ───────────────────────────────────────

function buildStatusWhatsAppMessage(status: string, customerName: string, orderId: string): string {
  const orderIdDisplay = orderId || 'N/A';

  switch (status) {
    case 'placed':
      return `🟡 Received

Assalamu Alaikum ${customerName},

Your order has been received successfully.
Order ID: ${orderIdDisplay}

Thank you for shopping with MIA ONE.`;

    case 'confirmed':
      return `🟢 Confirmed

Good news!
Your order has been confirmed.
Order ID:
${orderIdDisplay}

We are preparing your package.`;

    case 'processing':
      return `📦 Processing

Your order is now being processed.
Order ID:
${orderIdDisplay}

We will notify you again when it is shipped.`;

    case 'packed':
      return `📦 Packed

Your order has been packed successfully.
Order ID:
${orderIdDisplay}

Ready for dispatch.`;

    case 'ready_for_delivery':
      return `🚚 Ready for Delivery

Your parcel is ready for delivery.
Please keep your phone available.`;

    case 'shipped':
      return `🚛 Shipped

Your order has been shipped.
Order ID:
${orderIdDisplay}

It is now on the way.`;

    case 'out_for_delivery':
      return `📍 Out for Delivery

Our delivery rider is coming today.
Please keep your phone available.`;

    case 'delivered':
      return `✅ Delivered

Your order has been delivered successfully.
Thank you for shopping with MIA ONE ❤️`;

    case 'cancelled':
      return `❌ Cancelled

We are sorry.
Your order has been cancelled.
For assistance contact MIA ONE Support.`;

    default:
      return `📦 Order Update

Your order status has been updated.
Order ID: ${orderIdDisplay}

Thank you for shopping with MIA ONE.`;
  }
}

function sendStatusWhatsAppNotification(order: any, newStatus: string) {
  const addr = order.address || {};
  const customerPhone = addr.phone;
  const customerName = addr.full_name || 'Customer';
  const orderId = order.order_number || '#' + String(order.id).slice(-8).toUpperCase();

  if (!customerPhone) {
    return false;
  }

  const normalizedPhone = normalizeBangladeshPhone(customerPhone);

  if (!normalizedPhone) {
    return false;
  }

  const message = buildStatusWhatsAppMessage(newStatus, customerName, orderId);
  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return true;
}

function normalizeBangladeshPhone(phone: string): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // Remove leading + if present (already handled by \D removal)
  // Check various formats:
  // 01812345678 (11 digits, starts with 0) -> 8801812345678
  // 8801812345678 (13 digits, starts with 880) -> keep as is
  // +8801812345678 -> 8801812345678

  if (digits.startsWith('880')) {
    // Already has country code
    digits = digits; // keep as is
  } else if (digits.startsWith('0') && digits.length === 11) {
    // Local format: 01812345678
    digits = '880' + digits.substring(1);
  } else if (digits.length === 10 && !digits.startsWith('0')) {
    // Missing leading 0: 1812345678
    digits = '880' + digits;
  }

  // Validate: must be 880 followed by 10 digits (total 13)
  if (/^880[0-9]{10}$/.test(digits)) {
    return digits;
  }

  // If validation fails but we have digits, return as-is (might still work)
  if (digits.length >= 10) {
    return digits;
  }

  return null;
}

function buildWhatsAppMessage(order: any, payment?: any): string {
  const addr = order.address || {};
  const items = resolveItems(order);
  const date = new Date(order.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const paymentMethod = (order.payment_method || payment?.method || '').replace(/_/g, ' ');
  const sm = statusMeta(order.status);
  const orderNum = order.order_number || '#' + String(order.id).slice(-8).toUpperCase();

  let message = `🛍️ MIA ONE — Everything You Need\n`;
  message += `Invoice: ${orderNum}\n`;
  message += `Date: ${date}\n\n`;

  message += `👤 Customer:\n`;
  message += `${addr.full_name || 'N/A'}\n`;
  message += `${addr.phone || 'N/A'}\n`;
  if (addr.address) {
    message += `${addr.address}`;
    if (addr.area) message += `, ${addr.area}`;
    if (addr.city) message += `, ${addr.city}`;
    message += `\n`;
  }

  message += `\n📦 Products:\n`;
  items.forEach((item: any, i: number) => {
    message += `${i + 1}. ${item.name} x${item.quantity} = ৳${(item.price * item.quantity).toLocaleString()}\n`;
  });

  message += `\n💰 Grand Total: ৳${Number(order.total || 0).toLocaleString()}\n`;

  message += `\n💳 Payment: ${paymentMethod || 'N/A'}\n`;
  message += `📋 Status: ${sm.label}\n`;

  message += `\n🌐 ${COMPANY.website}\n`;
  message += `📧 ${COMPANY.email}\n`;
  message += `💬 WhatsApp: ${COMPANY.whatsapp}\n`;
  message += `\nThank you for shopping with MIA ONE!`;

  return message;
}

function shareOnWhatsApp(order: any, payment?: any) {
  const addr = order.address || {};
  const customerPhone = addr.phone;

  if (!customerPhone) {
    alert('Customer WhatsApp number not available.');
    return;
  }

  const normalizedPhone = normalizeBangladeshPhone(customerPhone);

  if (!normalizedPhone) {
    alert('Customer WhatsApp number not available.');
    return;
  }

  const message = buildWhatsAppMessage(order, payment);
  const encodedMessage = encodeURIComponent(message);
  const waUrl = `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
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

// ── Order Detail Drawer ────────────────────────────────────────────────────────

function OrderDrawer({ order, onClose, onStatusChange }: { order: any; onClose: () => void; onStatusChange: (id: string, status: string) => void }) {
  const toast = useToast();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [payment, setPayment] = useState<any>(null);
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [showInvoice, setShowInvoice] = useState(false);

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

      // Send WhatsApp notification
      const sent = sendStatusWhatsAppNotification(order, newStatus);
      if (!sent) {
        toast.error('Customer WhatsApp number not found.');
      }
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

      // Send WhatsApp notification
      const sent = sendStatusWhatsAppNotification(order, nextStatus);
      if (!sent) {
        toast.error('Customer WhatsApp number not found.');
      }
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
            <button onClick={() => shareOnWhatsApp(order, payment)} className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors" title="Share on WhatsApp">
              <MessageCircle size={13} className="text-green-500" />
            </button>
            <button onClick={() => setShowInvoice(true)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors" title="Print Invoice">
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
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider">Quick Actions (WhatsApp)</p>
              <div className="flex flex-wrap gap-2">
                {actions.map(action => (
                  <button key={action.nextStatus} onClick={() => handleQuickStatus(action.nextStatus, action.label)} disabled={updating}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: `${action.color}15`, color: action.color, border: `1px solid ${action.color}30` }}>
                    <MessageCircle size={12} />
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
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: newStatus !== order.status ? `linear-gradient(135deg, ${statusMeta(newStatus).color}, ${statusMeta(newStatus).color}99)` : 'rgba(255,255,255,0.05)' }}>
              <MessageCircle size={14} />
              {updating ? 'Updating...' : `Update Status & Send WhatsApp`}
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

      {/* Invoice Modal */}
      {showInvoice && (
        <InvoiceModal
          order={order}
          payment={payment}
          onClose={() => setShowInvoice(false)}
        />
      )}
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
                          <button onClick={() => setSelectedOrder(order)} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors" title="Print Invoice">
                            <Printer size={11} className="text-white/40" />
                          </button>
                          <button onClick={() => shareOnWhatsApp(order)} className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center hover:bg-green-500/20 transition-colors" title="Share on WhatsApp">
                            <MessageCircle size={11} className="text-green-500" />
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
