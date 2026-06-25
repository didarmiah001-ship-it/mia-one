import { useState, useEffect } from 'react';
import { adminGetReports } from '../../lib/api';
import { TrendingUp, ShoppingCart, CreditCard, AlertTriangle } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  placed: 'Placed', processing: 'Processing', packed: 'Packed',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  placed: '#00D1FF', processing: '#FF8A00', packed: '#7B2CFF',
  out_for_delivery: '#FF8A00', delivered: '#22c55e', cancelled: '#ef4444',
};

const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad', card: 'Card',
};

export function AdminReports() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetReports().then(r => { setData(r); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="glow-card h-48 shimmer" />)}
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...(data?.revenueByMonth || []).map((m: any) => m.revenue), 1);
  const totalRevenue = (data?.revenueByMonth || []).reduce((s: number, m: any) => s + m.revenue, 0);
  const totalOrders = (data?.byStatus || []).reduce((s: number, x: any) => s + x.count, 0);

  return (
    <div className="space-y-5">
      <h2 className="text-base font-bold text-white">Reports</h2>

      {/* Revenue Chart */}
      <div className="glow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-mia-orange" />
            <h3 className="text-sm font-semibold text-white">Revenue — Last 6 Months</h3>
          </div>
          <span className="text-xs text-white/40">Total: ৳{totalRevenue.toLocaleString()}</span>
        </div>
        <div className="flex items-end gap-3 h-40">
          {(data?.revenueByMonth || []).map((m: any) => {
            const h = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
            return (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-white/40">৳{m.revenue > 0 ? (m.revenue / 1000).toFixed(0) + 'k' : '0'}</span>
                <div className="w-full rounded-t-lg transition-all duration-700 relative overflow-hidden" style={{ height: `${Math.max(h, 4)}%`, minHeight: '6px', background: 'linear-gradient(to top, #FF8A00, #FF2EC9)' }}>
                  <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(to top, transparent, rgba(255,255,255,0.2))' }} />
                </div>
                <span className="text-[10px] text-white/50">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Order Status Breakdown */}
        <div className="glow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={15} className="text-mia-blue" />
            <h3 className="text-sm font-semibold text-white">Orders by Status</h3>
          </div>
          <div className="space-y-2.5">
            {(data?.byStatus || []).map((s: any) => {
              const c = STATUS_COLORS[s.status] || '#fff';
              const pct = totalOrders > 0 ? Math.round((s.count / totalOrders) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/60">{STATUS_LABELS[s.status] || s.status}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{s.count}</span>
                      <span className="text-[10px] text-white/30">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: c }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="glow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={15} className="text-mia-pink" />
            <h3 className="text-sm font-semibold text-white">Payment Methods</h3>
          </div>
          <div className="space-y-2.5">
            {(data?.byPayment || []).map((p: any) => (
              <div key={p.method} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-xs text-white/60">{PAYMENT_LABELS[p.method] || p.method}</span>
                <div className="text-right">
                  <p className="text-xs font-semibold text-white">{p.count} orders</p>
                  <p className="text-[10px] text-white/35">৳{Number(p.revenue).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      <div className="glow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={15} className="text-yellow-400" />
          <h3 className="text-sm font-semibold text-white">Low Stock Products</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">{data?.lowStock?.length || 0}</span>
        </div>
        {data?.lowStock?.length === 0 ? (
          <p className="text-sm text-white/25 text-center py-4">All products are well-stocked</p>
        ) : (
          <div className="space-y-2">
            {(data?.lowStock || []).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-white/80">{p.name}</span>
                <span className="text-xs font-bold" style={{ color: p.stock === 0 ? '#ef4444' : '#FF8A00' }}>
                  {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
