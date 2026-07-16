import { useState, useEffect } from 'react';
import {
  TrendingUp, Package, DollarSign, ShoppingBag, ArrowUpRight, ArrowDownRight,
  Truck, Ticket, Loader2, Target, AlertTriangle, Crown, Flame, Trophy,
} from 'lucide-react';
import { adminGetStats, adminFetchDeliveryStats, adminFetchCouponStats } from '../lib/api';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  netProfit: number;
  totalProductCost: number;
  totalDeliveryCost: number;
  pendingOrders: number;
  deliveredOrders: number;
  todaysSales: number;
  revenueChart: { day: string; revenue: number }[];
  topSellingProducts: { id: string; name: string; qty: number; revenue: number; image?: string }[];
  lowStockProducts: { id: string; name: string; stock: number; threshold: number; image: string }[];
  salesTarget: number;
  monthlyRevenue: number;
}

interface DeliveryStats {
  totalDeliveryIncome: number;
  freeDeliveryOrders: number;
  paidDeliveryOrders: number;
  avgDeliveryCharge: number;
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
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [couponStats, setCouponStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminGetStats()
      .then(s => { setStats(s as Stats); setLoading(false); })
      .catch(e => { setError(e.message || 'Failed to load dashboard'); setLoading(false); });

    adminFetchDeliveryStats().then(delivery => {
      const avgCharge = delivery.paidCount > 0 ? Math.round(delivery.totalIncome / delivery.paidCount) : 0;
      setDeliveryStats({
        totalDeliveryIncome: delivery.totalIncome,
        freeDeliveryOrders: delivery.freeCount,
        paidDeliveryOrders: delivery.paidCount,
        avgDeliveryCharge: avgCharge,
      });
    }).catch(() => {});

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

      setCouponStats({
        totalCoupons: cs.totalCoupons,
        activeCoupons: active.length,
        expiredCoupons: expired.length,
        totalCouponUses: cs.totalUsage,
        totalDiscountGiven: cs.totalDiscount,
        mostUsedCoupon: mostUsed,
        freeDeliveryCouponUses: cs.deliveryDiscount > 0 ? cs.totalUsage : 0,
        conversionRate,
      });
    }).catch(() => {});
  }, []);

  if (loading || !stats) {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>Retry</button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-mia-orange" size={24} />
      </div>
    );
  }

  const profitMargin = stats.totalRevenue > 0 ? Math.round((stats.netProfit / stats.totalRevenue) * 100) : 0;
  const targetProgress = stats.salesTarget > 0 ? Math.min(100, Math.round((stats.monthlyRevenue / stats.salesTarget) * 100)) : 0;
  const maxRevenue = Math.max(...stats.revenueChart.map(r => r.revenue), 1);

  const kpis = [
    { label: 'Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#FF8A00' },
    { label: 'Net Profit', value: `৳${stats.netProfit.toLocaleString()}`, icon: TrendingUp, color: '#22c55e', sub: `${profitMargin}% margin` },
    { label: 'Orders', value: stats.totalOrders.toLocaleString(), icon: ShoppingBag, color: '#00D1FF' },
    { label: 'Customers', value: stats.totalCustomers.toLocaleString(), icon: Package, color: '#7B2CFF' },
  ];

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
              </div>
              <p className="text-xl font-bold text-white">{k.value}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{k.label}</p>
              {'sub' in k && k.sub && <p className="text-[10px] mt-0.5" style={{ color: k.color }}>{k.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Sales Target Progress */}
      <div className="glow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
              <Target size={15} className="text-mia-orange" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Monthly Sales Target</p>
              <p className="text-[11px] text-white/30">Progress towards goal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40">Target</p>
            <p className="text-sm font-bold text-white">৳{stats.salesTarget.toLocaleString()}</p>
          </div>
        </div>
        <div className="relative w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <div
            className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
            style={{
              width: `${targetProgress}%`,
              background: targetProgress >= 100
                ? 'linear-gradient(90deg, #22c55e, #00D1FF)'
                : 'linear-gradient(90deg, #FF8A00, #FF2EC9)',
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-white/50">
            ৳{stats.monthlyRevenue.toLocaleString()} earned
          </span>
          <span className={`text-xs font-bold ${targetProgress >= 100 ? 'text-green-400' : targetProgress >= 75 ? 'text-mia-orange' : 'text-white/60'}`}>
            {targetProgress}%
          </span>
        </div>
        {targetProgress >= 100 && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-green-400">
            <Trophy size={12} /> Target achieved! Great work.
          </div>
        )}
      </div>

      {/* Revenue Chart + Net Profit Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glow-card p-5">
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
                    background: 'linear-gradient(180deg, #FF8A00, #FF2EC9)',
                  }}
                  title={`৳${r.revenue.toLocaleString()}`}
                />
                <span className="text-[10px] text-white/30">{r.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Net Profit Breakdown */}
        <div className="glow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <TrendingUp size={15} className="text-green-400" />
            </div>
            <p className="text-sm font-semibold text-white">Profit Breakdown</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Revenue</span>
              <span className="text-sm font-bold text-white">৳{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Product Cost</span>
              <span className="text-sm font-bold text-red-400">-৳{stats.totalProductCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Delivery Cost</span>
              <span className="text-sm font-bold text-red-400">-৳{stats.totalDeliveryCost.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-white/50">Net Profit</span>
              <span className="text-base font-bold text-green-400">৳{stats.netProfit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Margin</span>
              <span className="text-xs font-semibold text-green-400">{profitMargin}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Selling Products */}
        <div className="glow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={15} className="text-mia-orange" />
            <p className="text-sm font-semibold text-white">Top Selling Products</p>
          </div>
          {stats.topSellingProducts.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-2">
              {stats.topSellingProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: i === 0 ? 'rgba(255,138,0,0.15)' : i === 1 ? 'rgba(0,209,255,0.1)' : 'rgba(255,255,255,0.04)',
                      color: i === 0 ? '#FF8A00' : i === 1 ? '#00D1FF' : 'rgba(255,255,255,0.4)',
                    }}>
                    {i === 0 ? <Crown size={13} /> : i + 1}
                  </div>
                  {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{p.name}</p>
                    <p className="text-[10px] text-white/35">{p.qty} sold</p>
                  </div>
                  <span className="text-xs font-semibold text-mia-orange">৳{p.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="glow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={15} className="text-red-400" />
            <p className="text-sm font-semibold text-white">Low Stock Alerts</p>
            {stats.lowStockProducts.length > 0 && (
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-bold">
                {stats.lowStockProducts.length}
              </span>
            )}
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <p className="text-xs text-white/30 text-center py-8">All products well stocked</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.lowStockProducts.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                  {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-md object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{p.name}</p>
                    <p className="text-[10px] text-white/35">Threshold: {p.threshold}</p>
                  </div>
                  <span className="text-xs font-bold text-red-400">{p.stock} left</span>
                </div>
              ))}
            </div>
          )}
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
