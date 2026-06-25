import { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, Download, FileText, FileSpreadsheet,
  Printer, ChevronDown, AlertTriangle, Package, Users, ShoppingCart,
  DollarSign, Target, CreditCard, BarChart3, RefreshCw,
} from 'lucide-react';
import { adminGetAnalytics, type AnalyticsPeriod } from '../../lib/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function pctBadge(v: number) {
  const color = v > 0 ? '#34D399' : v < 0 ? '#F87171' : '#8B8B9A';
  const Icon  = v > 0 ? TrendingUp : v < 0 ? TrendingDown : Minus;
  const bg    = v > 0 ? 'rgba(52,211,153,0.12)' : v < 0 ? 'rgba(248,113,113,0.12)' : 'rgba(139,139,154,0.1)';
  return { color, Icon, bg, label: `${v > 0 ? '+' : ''}${v}%` };
}

const METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: 'Cash on Delivery',
  bkash:            'bKash',
  nagad:            'Nagad',
  stripe:           'Stripe / Card',
  sslcommerz:       'SSLCommerz',
  bank_transfer:    'Bank Transfer',
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  placed:           { label: 'Placed',          color: '#00D1FF' },
  processing:       { label: 'Processing',       color: '#FF8A00' },
  packed:           { label: 'Packed',           color: '#7B2CFF' },
  out_for_delivery: { label: 'Out for Delivery', color: '#F59E0B' },
  delivered:        { label: 'Delivered',        color: '#22C55E' },
  cancelled:        { label: 'Cancelled',        color: '#EF4444' },
};

const BAR_COLORS = ['#FF8A00', '#FF2EC9', '#7B2CFF', '#00D1FF', '#22C55E', '#F59E0B'];

// ── Tooltip ───────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(13,17,23,0.97)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>
            {p.dataKey === 'revenue' ? `৳${Number(p.value).toLocaleString()}` : p.value}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{p.dataKey}</span>
        </div>
      ))}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, change, icon: Icon, color }: {
  label: string; value: string | number; change: number; icon: any; color: string;
}) {
  const badge = pctBadge(change);
  const BadgeIcon = badge.Icon;
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.04] blur-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${color}, transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}20` }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold"
          style={{ background: badge.bg, color: badge.color }}>
          <BadgeIcon size={10} />
          {badge.label}
        </div>
      </div>
      <p className="text-xs text-white/40 font-medium mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/25 mt-1">vs previous period</p>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {children}
    </div>
  );
}

function CardHeader({ icon: Icon, color, title, sub }: { icon: any; color: string; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {sub && <p className="text-[10px] text-white/30">{sub}</p>}
      </div>
    </div>
  );
}

// ── Export utilities ──────────────────────────────────────────────────────────

function triggerDownload(content: string, type: string, filename: string) {
  const blob = new Blob([content], { type });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(data: any) {
  const rows: (string | number)[][] = [
    ['Period', 'Revenue (BDT)', 'Orders', 'New Customers'],
    ...data.timeSeries.map((r: any) => [r.label, r.revenue, r.orders, r.customers]),
    [], ['--- Top Products ---'], ['#', 'Product', 'Units Sold', 'Revenue (BDT)'],
    ...data.topProducts.map((p: any, i: number) => [i + 1, p.name, p.qty, p.revenue]),
  ];
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  triggerDownload('\uFEFF' + csv, 'text/csv;charset=utf-8', 'analytics.csv');
}

function exportExcel(data: any) {
  const tbody = [
    '<tr><th>Period</th><th>Revenue (BDT)</th><th>Orders</th><th>New Customers</th></tr>',
    ...data.timeSeries.map((r: any) =>
      `<tr><td>${r.label}</td><td>${r.revenue}</td><td>${r.orders}</td><td>${r.customers}</td></tr>`
    ),
    '<tr><td colspan="4"></td></tr>',
    '<tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th></tr>',
    ...data.topProducts.map((p: any, i: number) =>
      `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.qty}</td><td>${p.revenue}</td></tr>`
    ),
  ].join('');
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"></head><body><table border="1">${tbody}</table></body></html>`;
  triggerDownload(html, 'application/vnd.ms-excel', 'analytics.xls');
}

function exportPDF() {
  const s = document.createElement('style');
  s.id = '__ana_print';
  s.textContent = '@media print{body>*:not(#ana-root){display:none!important}#ana-root{display:block!important}.no-print{display:none!important}}';
  document.head.appendChild(s);
  window.print();
  setTimeout(() => document.getElementById('__ana_print')?.remove(), 1500);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: 'daily',   label: 'Daily'   },
  { key: 'weekly',  label: 'Weekly'  },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly',  label: 'Yearly'  },
];

export function AdminReports() {
  const [period, setPeriod]         = useState<AnalyticsPeriod>('monthly');
  const [data, setData]             = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const load = async (p: AnalyticsPeriod) => {
    setLoading(true);
    setData(await adminGetAnalytics(p));
    setLoading(false);
  };

  useEffect(() => { load(period); }, [period]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const totalOrders = data?.statuses?.reduce((s: number, x: any) => s + x.count, 0) || 1;
  const maxPayRev   = data?.paymentMethods?.[0]?.revenue || 1;
  const xInterval   = period === 'daily' ? 4 : period === 'weekly' ? 2 : 0;

  return (
    <div id="ana-root" className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 no-print">
        <div>
          <h2 className="text-base font-bold text-white">Analytics Dashboard</h2>
          <p className="text-[11px] text-white/30 mt-0.5">Sales · Revenue · Orders · Customers · Products</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            {PERIODS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className="px-3.5 py-2 text-xs font-medium transition-all"
                style={period === p.key
                  ? { background: 'rgba(255,138,0,0.15)', color: '#FF8A00' }
                  : { background: 'transparent', color: 'rgba(255,255,255,0.4)' }
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          <button onClick={() => load(period)} disabled={loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/8 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <RefreshCw size={14} className={`text-mia-gray ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Export */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(v => !v)}
              disabled={!data}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 4px 16px rgba(255,138,0,0.25)' }}
            >
              <Download size={14} /> Export
              <ChevronDown size={12} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>
            {exportOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-44 rounded-2xl overflow-hidden py-1.5"
                style={{ background: '#141820', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
                {[
                  { icon: FileText,        label: 'CSV',         action: () => { exportCSV(data); setExportOpen(false); } },
                  { icon: FileSpreadsheet, label: 'Excel (.xls)', action: () => { exportExcel(data); setExportOpen(false); } },
                  { icon: Printer,         label: 'Print / PDF', action: () => { exportPDF(); setExportOpen(false); } },
                ].map(item => {
                  const I = item.icon;
                  return (
                    <button key={item.label} onClick={item.action}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:bg-white/6 hover:text-white transition-colors">
                      <I size={14} className="text-mia-orange" /> {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="rounded-2xl h-28 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
          </div>
          {[1,2].map(i => <div key={i} className="rounded-2xl h-52 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
      ) : data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Total Revenue"   value={`৳${Math.round(data.kpis.revenue).toLocaleString()}`}         change={data.kpis.revenueChange}   icon={DollarSign}   color="#FF8A00" />
            <KpiCard label="Total Orders"    value={data.kpis.orders}                                              change={data.kpis.ordersChange}    icon={ShoppingCart} color="#00D1FF" />
            <KpiCard label="New Customers"   value={data.kpis.customers}                                           change={data.kpis.customersChange} icon={Users}        color="#7B2CFF" />
            <KpiCard label="Avg Order Value" value={`৳${Math.round(data.kpis.avgOrder).toLocaleString()}`}         change={data.kpis.avgOrderChange}  icon={Target}       color="#FF2EC9" />
          </div>

          {/* Revenue area chart */}
          <Card>
            <CardHeader
              icon={TrendingUp} color="#FF8A00" title="Revenue"
              sub={`৳${Math.round(data.kpis.revenue).toLocaleString()} total · ${PERIODS.find(p => p.key === period)?.label} view`}
            />
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.timeSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FF8A00" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#FF8A00" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} interval={xInterval} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => v >= 1000 ? `৳${(v/1000).toFixed(0)}k` : `৳${v}`} width={54} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,138,0,0.2)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="revenue" stroke="#FF8A00" strokeWidth={2.5}
                  fill="url(#gRev)" dot={false} activeDot={{ r: 5, fill: '#FF8A00', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          {/* Orders + Customers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader icon={ShoppingCart} color="#00D1FF" title="Orders" sub={`${data.kpis.orders} total this period`} />
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.timeSeries} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} interval={xInterval} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,209,255,0.05)' }} />
                  <Bar dataKey="orders" fill="#00D1FF" radius={[4,4,0,0]} opacity={0.8}
                    activeBar={{ fill: '#00D1FF', opacity: 1 }} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardHeader icon={Users} color="#7B2CFF" title="New Customers" sub={`${data.kpis.customers} registered this period`} />
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={data.timeSeries} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} interval={xInterval} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} width={24} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(123,44,255,0.2)', strokeWidth: 1 }} />
                  <Line type="monotone" dataKey="customers" stroke="#7B2CFF" strokeWidth={2.5}
                    dot={false} activeDot={{ r: 4, fill: '#7B2CFF', strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Payment methods + Order status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader icon={CreditCard} color="#FF2EC9" title="Payment Methods" />
              {data.paymentMethods.length === 0 ? (
                <p className="text-xs text-white/25 text-center py-8">No payment data this period</p>
              ) : (
                <div className="space-y-3.5">
                  {data.paymentMethods.map((m: any, i: number) => {
                    const c = BAR_COLORS[i % BAR_COLORS.length];
                    const pct = maxPayRev > 0 ? (m.revenue / maxPayRev) * 100 : 0;
                    return (
                      <div key={m.method}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/70">{METHOD_LABELS[m.method] || m.method}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/35">{m.count} orders</span>
                            <span className="text-xs font-semibold text-white">৳{Number(m.revenue).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.max(pct, 2)}%`, background: c }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader icon={BarChart3} color="#00D1FF" title="Order Status" />
              <div className="space-y-3.5">
                {data.statuses.filter((s: any) => s.count > 0).map((s: any) => {
                  const meta = STATUS_META[s.status];
                  const pct  = totalOrders > 0 ? Math.round((s.count / totalOrders) * 100) : 0;
                  return (
                    <div key={s.status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-white/70">{meta?.label || s.status}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/35">{pct}%</span>
                          <span className="text-xs font-semibold text-white">{s.count}</span>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(pct, 1)}%`, background: meta?.color || '#8B8B9A' }} />
                      </div>
                    </div>
                  );
                })}
                {data.statuses.every((s: any) => s.count === 0) && (
                  <p className="text-xs text-white/25 text-center py-6">No orders in this period</p>
                )}
              </div>
            </Card>
          </div>

          {/* Top Products table */}
          {data.topProducts.length > 0 && (
            <Card>
              <CardHeader icon={Package} color="#FF8A00" title="Top Products" sub="Ranked by revenue this period" />
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['#', 'Product', 'Units Sold', 'Revenue'].map((h, i) => (
                        <th key={h} className={`py-2 pr-4 text-white/30 font-medium ${i === 3 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p: any, i: number) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                        className="hover:bg-white/2 transition-colors">
                        <td className="py-2.5 pr-4 text-white/30 font-bold w-8">{i + 1}</td>
                        <td className="py-2.5 pr-4 text-white/80 font-medium max-w-[200px] truncate">{p.name}</td>
                        <td className="py-2.5 pr-4 text-white/55">{p.qty}</td>
                        <td className="py-2.5 text-right font-bold" style={{ color: '#FF8A00' }}>৳{Number(p.revenue).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Low stock alert */}
          {data.lowStock.length > 0 && (
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-yellow-400" />
                <h3 className="text-sm font-semibold text-white">Low Stock Alert</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                  {data.lowStock.length}
                </span>
              </div>
              <div className="space-y-1">
                {data.lowStock.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between py-1.5"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span className="text-sm text-white/80">{p.name}</span>
                    <span className="text-xs font-bold"
                      style={{ color: p.stock === 0 ? '#EF4444' : '#F59E0B' }}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
