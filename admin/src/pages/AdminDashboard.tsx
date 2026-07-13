import { useState, useEffect } from 'react';
import { TrendingUp, Package, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight, Truck, Ticket, Loader2 } from 'lucide-react';
import { adminGetStats, adminFetchDeliveryStats, adminFetchCouponStats } from '../lib/api';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  pendingOrders: number;
  deliveredOrders: number;
  todaysSales: number;
  revenueChart: { day: string; revenue: number }[];
}

interface DeliveryStats {
  totalDeliveryIncome: number;
  freeDeliveryOrders: number;
  paidDeliveryOrders: number;
  avgDeliveryCharge: number;
  ordersByZone: { zone: string; label: string; count: number; revenue: number; color: string }[];
}

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  totalCouponUses: number;
  totalDiscountGiven: number;
  mostUsedCoupon: { code: string; uses: number } | null;
  freeDeliveryCouponUses: number;
  conversionRate: number;
  usageByDay: { day: string; count: number }[];
  discountDistribution: { label: string; value: number; color: string }[];
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [couponStats, setCouponStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetStats().then(s => { setStats(s as Stats); setLoading(false); })
      .catch(e => { setError(e.message || 'Failed to load dashboard'); setLoading(false); });
    adminFetchDeliveryStats().then(delivery => {
      const avgCharge = delivery.paidCount > 0 ? Math.round(delivery.totalIncome / delivery.paidCount) : 0;
      setDeliveryStats({
        totalDeliveryIncome: delivery.totalIncome,
        freeDeliveryOrders: delivery.freeCount,
        paidDeliveryOrders: delivery.paidCount,
        avgDeliveryCharge: avgCharge,
        ordersByZone: [],
      });
    });

    adminFetchCouponStats().then(cs => {
      const now = new Date();
      const active = cs.coupons.filter((c: any) => c.is_active && (!c.expires_at || new Date(c.expires_at) >= now));
      const expired = cs.coupons.filter((c: any) => c.expires_at && new Date(c.expires_at) < now);

      const useCount: Record<string, number> = {};
      cs.couponUsage.forEach((u: any) => { useCount[u.coupon_code] = (useCount[u.coupon_code] || 0) + 1; });
      const sorted = Object.entries(useCount).sort((a, b) => b[1] - a[1]);
      const mostUsed = sorted.length > 0 ? { code: sorted[0][0], uses: sorted[0][1] } : null;

      const ordersWithCoupon = cs.couponUsage.length;
      const conversionRate = cs.totalOrders > 0 ? Math.round((ordersWithCoupon / cs.totalOrders) * 100) : 0;

      const dayMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dayMap[d.toISOString().slice(0, 10)] = 0;
      }
      cs.couponUsage.forEach((u: any) => {
        const day = u.created_at?.slice(0, 10);
        if (day && day in dayMap) dayMap[day]++;
      });
      const usageByDay = Object.entries(dayMap).map(([day, count]) => ({ day: day.slice(5), count }));

      const dist: Record<string, number> = { 'Fixed': 0, '1-10%': 0, '11-25%': 0, '26-50%': 0, '51%+': 0 };
      cs.coupons.forEach((c: any) => {
        if (c.type === 'fixed') dist['Fixed']++;
        else if (c.value <= 10) dist['1-10%']++;
        else if (c.value <= 25) dist['11-25%']++;
        else if (c.value <= 50) dist['26-50%']++;
        else dist['51%+']++;
      });
      const distColors = ['#FF8A00', '#FF2EC9', '#7B2CFF', '#00D1FF', '#22c55e'];
      const discountDistribution = Object.entries(dist).map(([label, value], i) => ({ label, value, color: distColors[i] }));

      setCouponStats({
        totalCoupons: cs.totalCoupons,
        activeCoupons: active.length,
        expiredCoupons: expired.length,
        totalCouponUses: cs.totalUsage,
        totalDiscountGiven: cs.totalDiscount,
        mostUsedCoupon: mostUsed,
        freeDeliveryCouponUses: cs.deliveryDiscount > 0 ? cs.totalUsage : 0,
        conversionRate,
        usageByDay,
        discountDistribution,
      });
    });
  }, []);

  if (loading || !stats) {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white glow-btn" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>Retry</button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-mia-orange" size={24} />
      </div>
    );
  }

  const kpis = [
    { label: 'Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#FF8A00', change: null as string | null },
    { label: 'Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: '#00D1FF', change: null as string | null },
    { label: 'Customers', value: stats.totalCustomers.toLocaleString(), icon: TrendingUp, color: '#22c55e', change: null as string | null },
    { label: 'Products', value: stats.totalProducts.toLocaleString(), icon: Package, color: '#7B2CFF', change: null as string | null },
  ];

  const maxRevenue = Math.max(...stats.revenueChart.map(r => r.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Dashboard</h2>
        <p className="text-xs text-white/30 mt-0.5">Store overview and analytics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glow-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${k.color}15`, border: `1px solid ${k.color}30` }}>
                  <Icon size={16} style={{ color: k.color }} />
                </div>
                {k.change && (
                  <span className={`flex items-center gap-0.5 text-[10px] font-medium ${k.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {k.change.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {k.change}
                  </span>
                )}
              </div>
              <p className="text-xl font-bold text-white">{k.value}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="glow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-white">Revenue (Last 7 Days)</p>
            <p className="text-[11px] text-white/30">Daily sales overview</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Today</p>
            <p className="text-sm font-bold text-mia-orange">৳{stats.todaysSales.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {stats.revenueChart.map((r, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-t-lg transition-all hover:opacity-80"
                style={{
                  height: `${(r.revenue / maxRevenue) * 100}%`,
                  minHeight: '4px',
                  background: `linear-gradient(180deg, #FF8A00, #FF2EC9)`,
                }}
                title={`৳${r.revenue.toLocaleString()}`}
              />
              <span className="text-[10px] text-white/30">{r.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Status + Delivery Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glow-card p-5">
          <p className="text-sm font-semibold text-white mb-3">Order Status</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Pending</span>
              <span className="text-sm font-bold text-yellow-400">{stats.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Delivered</span>
              <span className="text-sm font-bold text-green-400">{stats.deliveredOrders}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-white/50">Total</span>
              <span className="text-sm font-bold text-white">{stats.totalOrders}</span>
            </div>
          </div>
        </div>

        {deliveryStats && (
          <div className="glow-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={14} className="text-mia-orange" />
              <p className="text-sm font-semibold text-white">Delivery Stats</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Delivery Income</span>
                <span className="text-sm font-bold text-mia-orange">৳{deliveryStats.totalDeliveryIncome.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Avg Charge</span>
                <span className="text-sm font-bold text-white">৳{deliveryStats.avgDeliveryCharge}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Free Delivery</span>
                <span className="text-sm font-bold text-[#00D1FF]">{deliveryStats.freeDeliveryOrders}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Coupon Stats */}
      {couponStats && (
        <div className="glow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Ticket size={14} className="text-mia-orange" />
            <p className="text-sm font-semibold text-white">Coupon Analytics</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,138,0,0.06)' }}>
              <p className="text-lg font-bold text-mia-orange">{couponStats.totalCoupons}</p>
              <p className="text-[10px] text-white/40">Total Coupons</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)' }}>
              <p className="text-lg font-bold text-green-400">{couponStats.activeCoupons}</p>
              <p className="text-[10px] text-white/40">Active</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(0,209,255,0.06)' }}>
              <p className="text-lg font-bold text-[#00D1FF]">{couponStats.totalCouponUses}</p>
              <p className="text-[10px] text-white/40">Total Uses</p>
            </div>
            <div className="text-center p-3 rounded-xl" style={{ background: 'rgba(123,44,255,0.06)' }}>
              <p className="text-lg font-bold text-[#7B2CFF]">{couponStats.conversionRate}%</p>
              <p className="text-[10px] text-white/40">Conversion</p>
            </div>
          </div>
          {couponStats.mostUsedCoupon && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">Most Used Coupon</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-mia-orange">{couponStats.mostUsedCoupon.code}</span>
                  <span className="text-xs text-white/40">{couponStats.mostUsedCoupon.uses} uses</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
