import { useEffect, useState } from 'react';
import { ShoppingBag, Users, Package, TrendingUp, Clock, CheckCircle2, DollarSign, Zap, Truck, MapPin, BarChart2, Ticket, Megaphone, Percent } from 'lucide-react';
import { adminGetStats } from '../lib/api';
import { supabase } from '../lib/supabase';

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

const ZONE_LABELS: Record<string, { label: string; color: string }> = {
  munshiganj: { label: 'Munshiganj', color: '#FF2EC9' },
  inside_dhaka: { label: 'Inside Dhaka', color: '#FF8A00' },
  outside_dhaka: { label: 'Outside Dhaka', color: '#00D1FF' },
  remote_area: { label: 'Remote Area', color: '#7B2CFF' },
};

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [couponStats, setCouponStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetStats().then(s => { setStats(s as Stats); setLoading(false); });
    // Fetch delivery analytics
    supabase.from('orders').select('delivery_charge, delivery_zone, status').then(({ data }) => {
      if (!data) return;
      const orders = data as any[];
      const paid = orders.filter(o => Number(o.delivery_charge) > 0);
      const free = orders.filter(o => Number(o.delivery_charge) === 0);
      const totalIncome = paid.reduce((s, o) => s + Number(o.delivery_charge), 0);
      const avgCharge = paid.length > 0 ? Math.round(totalIncome / paid.length) : 0;

      const zoneMap: Record<string, { count: number; revenue: number }> = {};
      orders.forEach(o => {
        const z = o.delivery_zone || 'outside_dhaka';
        if (!zoneMap[z]) zoneMap[z] = { count: 0, revenue: 0 };
        zoneMap[z].count++;
        zoneMap[z].revenue += Number(o.delivery_charge || 0);
      });

      const ordersByZone = Object.entries(zoneMap).map(([zone, v]) => ({
        zone,
        label: ZONE_LABELS[zone]?.label || 'Outside Dhaka',
        count: v.count,
        revenue: v.revenue,
        color: ZONE_LABELS[zone]?.color || '#00D1FF',
      })).sort((a, b) => b.count - a.count);

      setDeliveryStats({
        totalDeliveryIncome: totalIncome,
        freeDeliveryOrders: free.length,
        paidDeliveryOrders: paid.length,
        avgDeliveryCharge: avgCharge,
        ordersByZone,
      });
    });

    // Fetch coupon analytics
    Promise.all([
      supabase.from('coupons').select('*'),
      supabase.from('orders').select('coupon_code, coupon_discount, delivery_discount, created_at, total'),
      supabase.from('coupon_usage').select('coupon_code, created_at'),
    ]).then(([couponsRes, ordersRes, usageRes]) => {
      const coupons = (couponsRes.data || []) as any[];
      const orders = (ordersRes.data || []) as any[];
      const usage = (usageRes.data || []) as any[];

      const now = new Date();
      const active = coupons.filter(c => c.is_active && (!c.expires_at || new Date(c.expires_at) >= now));
      const expired = coupons.filter(c => c.expires_at && new Date(c.expires_at) < now);

      const totalDiscount = orders.reduce((s, o) => s + Number(o.coupon_discount || 0), 0);
      const freeDeliveryUses = orders.filter(o => Number(o.delivery_discount || 0) > 0).length;

      // Most used coupon
      const useCount: Record<string, number> = {};
      usage.forEach(u => { useCount[u.coupon_code] = (useCount[u.coupon_code] || 0) + 1; });
      const sorted = Object.entries(useCount).sort((a, b) => b[1] - a[1]);
      const mostUsed = sorted.length > 0 ? { code: sorted[0][0], uses: sorted[0][1] } : null;

      // Conversion rate: orders with coupon / total orders
      const ordersWithCoupon = orders.filter(o => o.coupon_code).length;
      const conversionRate = orders.length > 0 ? Math.round((ordersWithCoupon / orders.length) * 100) : 0;

      // Usage by day (last 30 days)
      const dayMap: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        dayMap[d.toISOString().slice(0, 10)] = 0;
      }
      usage.forEach(u => {
        const day = u.created_at?.slice(0, 10);
        if (day && day in dayMap) dayMap[day]++;
      });
      const usageByDay = Object.entries(dayMap).map(([day, count]) => ({ day: day.slice(5), count }));

      // Discount distribution
      const dist: Record<string, number> = { 'Fixed': 0, '1-10%': 0, '11-25%': 0, '26-50%': 0, '51%+': 0 };
      coupons.forEach(c => {
        if (c.type === 'fixed') dist['Fixed']++;
        else if (c.value <= 10) dist['1-10%']++;
        else if (c.value <= 25) dist['11-25%']++;
        else if (c.value <= 50) dist['26-50%']++;
        else dist['51%+']++;
      });
      const distColors = ['#FF8A00', '#FF2EC9', '#7B2CFF', '#00D1FF', '#22c55e'];
      const discountDistribution = Object.entries(dist).map(([label, value], i) => ({ label, value, color: distColors[i] }));

      setCouponStats({
        totalCoupons: coupons.length,
        activeCoupons: active.length,
        expiredCoupons: expired.length,
        totalCouponUses: usage.length,
        totalDiscountGiven: totalDiscount,
        mostUsedCoupon: mostUsed,
        freeDeliveryCouponUses: freeDeliveryUses,
        conversionRate,
        usageByDay,
        discountDistribution,
      });
    });
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!stats) return null;

  const maxRevenue = Math.max(...stats.revenueChart.map(d => d.revenue), 1);

  const statCards = [
    { label: 'Total Revenue', value: `৳${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#FF8A00', sub: 'All time' },
    { label: "Today's Sales", value: `৳${stats.todaysSales.toLocaleString()}`, icon: Zap, color: '#FF2EC9', sub: 'Last 24 hours' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: '#7B2CFF', sub: 'Need action' },
    { label: 'Delivered', value: stats.deliveredOrders, icon: CheckCircle2, color: '#22c55e', sub: 'Completed' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: '#00D1FF', sub: 'All time' },
    { label: 'Customers', value: stats.totalCustomers, icon: Users, color: '#FF8A00', sub: 'Registered' },
    { label: 'Products', value: stats.totalProducts, icon: Package, color: '#FF2EC9', sub: 'Active' },
    { label: 'Avg Order', value: stats.totalOrders > 0 ? `৳${Math.round(stats.totalRevenue / stats.totalOrders)}` : '৳0', icon: TrendingUp, color: '#7B2CFF', sub: 'Per order' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {statCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="glow-card p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-5 blur-xl"
                style={{ background: `radial-gradient(circle, ${card.color}, transparent)` }} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${card.color}12`, border: `1px solid ${card.color}20` }}>
                <Icon size={16} style={{ color: card.color }} />
              </div>
              <p className="text-xs text-white/40 mb-1 font-medium">{card.label}</p>
              <p className="text-xl font-bold text-white">{card.value}</p>
              <p className="text-[10px] text-white/25 mt-1">{card.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Revenue Chart */}
      <div className="glow-card p-5">
        <h3 className="text-sm font-bold text-white/90 mb-5">Revenue — Last 7 Days</h3>
        <div className="flex items-end gap-2 h-36">
          {stats.revenueChart.map((d, i) => {
            const pct = (d.revenue / maxRevenue) * 100;
            const barColors = ['#FF8A00', '#FF2EC9', '#7B2CFF', '#00D1FF', '#FF8A00', '#FF2EC9', '#7B2CFF'];
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                <span className="text-[9px] text-white/40 font-medium leading-none">
                  {d.revenue > 0 ? (d.revenue > 999 ? `৳${(d.revenue / 1000).toFixed(1)}k` : `৳${d.revenue}`) : ''}
                </span>
                <div className="w-full flex-1 flex items-end">
                  <div className="w-full rounded-t-lg relative overflow-hidden" style={{ height: `${Math.max(pct, 3)}%`, minHeight: '4px' }}>
                    <div className="absolute inset-0 rounded-t-lg"
                      style={{ background: `linear-gradient(180deg, ${barColors[i]}, ${barColors[i]}50)` }} />
                  </div>
                </div>
                <span className="text-[9px] text-white/50">{d.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glow-card p-4">
          <p className="text-xs text-white/40 mb-2 font-medium">Completion Rate</p>
          <p className="text-2xl font-bold text-white mb-2">
            {stats.totalOrders > 0 ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}%
          </p>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${stats.totalOrders > 0 ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
          </div>
        </div>
        <div className="glow-card p-4">
          <p className="text-xs text-white/40 mb-2 font-medium">Pending Rate</p>
          <p className="text-2xl font-bold text-white mb-2">
            {stats.totalOrders > 0 ? Math.round((stats.pendingOrders / stats.totalOrders) * 100) : 0}%
          </p>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${stats.totalOrders > 0 ? (stats.pendingOrders / stats.totalOrders) * 100 : 0}%`, background: 'linear-gradient(90deg, #FF8A00, #FF2EC9)' }} />
          </div>
        </div>
        <div className="glow-card p-4">
          <p className="text-xs text-white/40 mb-2 font-medium">Today vs Total</p>
          <p className="text-2xl font-bold" style={{ color: '#FF8A00' }}>৳{stats.todaysSales.toLocaleString()}</p>
          <p className="text-[10px] text-white/25 mt-2">Total: ৳{stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Delivery Analytics */}
      {deliveryStats && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-2">
            <Truck size={16} className="text-mia-orange" />
            <h3 className="text-sm font-bold text-white">Delivery Analytics</h3>
          </div>

          {/* Delivery KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,138,0,0.08)' }}>
                  <DollarSign size={13} className="text-mia-orange" />
                </div>
                <p className="text-[10px] text-white/40 font-medium">Delivery Income</p>
              </div>
              <p className="text-xl font-bold text-white">৳{deliveryStats.totalDeliveryIncome.toLocaleString()}</p>
            </div>
            <div className="glow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
                  <CheckCircle2 size={13} className="text-green-400" />
                </div>
                <p className="text-[10px] text-white/40 font-medium">Free Delivery</p>
              </div>
              <p className="text-xl font-bold text-green-400">{deliveryStats.freeDeliveryOrders}</p>
              <p className="text-[9px] text-white/25 mt-1">orders</p>
            </div>
            <div className="glow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,209,255,0.08)' }}>
                  <Truck size={13} className="text-mia-blue" />
                </div>
                <p className="text-[10px] text-white/40 font-medium">Paid Delivery</p>
              </div>
              <p className="text-xl font-bold text-mia-blue">{deliveryStats.paidDeliveryOrders}</p>
              <p className="text-[9px] text-white/25 mt-1">orders</p>
            </div>
            <div className="glow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,46,201,0.08)' }}>
                  <BarChart2 size={13} className="text-mia-pink" />
                </div>
                <p className="text-[10px] text-white/40 font-medium">Avg Charge</p>
              </div>
              <p className="text-xl font-bold text-mia-pink">৳{deliveryStats.avgDeliveryCharge}</p>
              <p className="text-[9px] text-white/25 mt-1">per paid order</p>
            </div>
          </div>

          {/* Orders by Delivery Zone */}
          <div className="glow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={14} className="text-white/40" />
              <h4 className="text-xs font-semibold text-white/70">Orders by Delivery Zone</h4>
            </div>
            <div className="space-y-3">
              {deliveryStats.ordersByZone.length === 0 && (
                <p className="text-xs text-white/30 text-center py-4">No delivery data yet</p>
              )}
              {deliveryStats.ordersByZone.map(zone => {
                const maxCount = Math.max(...deliveryStats.ordersByZone.map(z => z.count), 1);
                const pct = Math.round((zone.count / maxCount) * 100);
                return (
                  <div key={zone.zone}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: zone.color }} />
                        <span className="text-xs font-medium text-white/80">{zone.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-white/40">{zone.count} orders</span>
                        <span className="text-[10px] font-semibold" style={{ color: zone.color }}>৳{zone.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: zone.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Marketing Analytics */}
      {couponStats && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pt-2">
            <Ticket size={16} className="text-mia-purple" />
            <h3 className="text-sm font-bold text-white">Marketing Analytics</h3>
          </div>

          {/* Coupon KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="glow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(123,44,255,0.08)' }}>
                  <Ticket size={13} className="text-mia-purple" />
                </div>
                <p className="text-[10px] text-white/40 font-medium">Total Coupons</p>
              </div>
              <p className="text-xl font-bold text-white">{couponStats.totalCoupons}</p>
              <p className="text-[9px] text-white/25 mt-1">{couponStats.activeCoupons} active · {couponStats.expiredCoupons} expired</p>
            </div>
            <div className="glow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,138,0,0.08)' }}>
                  <BarChart2 size={13} className="text-mia-orange" />
                </div>
                <p className="text-[10px] text-white/40 font-medium">Total Uses</p>
              </div>
              <p className="text-xl font-bold text-mia-orange">{couponStats.totalCouponUses}</p>
              <p className="text-[9px] text-white/25 mt-1">{couponStats.conversionRate}% conversion</p>
            </div>
            <div className="glow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
                  <DollarSign size={13} className="text-green-400" />
                </div>
                <p className="text-[10px] text-white/40 font-medium">Discount Given</p>
              </div>
              <p className="text-xl font-bold text-green-400">৳{couponStats.totalDiscountGiven.toLocaleString()}</p>
            </div>
            <div className="glow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,209,255,0.08)' }}>
                  <Truck size={13} className="text-mia-blue" />
                </div>
                <p className="text-[10px] text-white/40 font-medium">Free Delivery Uses</p>
              </div>
              <p className="text-xl font-bold text-mia-blue">{couponStats.freeDeliveryCouponUses}</p>
            </div>
          </div>

          {/* Most Used Coupon */}
          {couponStats.mostUsedCoupon && (
            <div className="glow-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,46,201,0.08)', border: '1px solid rgba(255,46,201,0.2)' }}>
                  <Percent size={14} className="text-mia-pink" />
                </div>
                <div>
                  <p className="text-[10px] text-white/40">Most Used Coupon</p>
                  <p className="text-sm font-bold text-mia-pink font-mono">{couponStats.mostUsedCoupon.code}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-white">{couponStats.mostUsedCoupon.uses} uses</span>
            </div>
          )}

          {/* Coupon Usage Chart (Last 30 Days) */}
          <div className="glow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={14} className="text-white/40" />
              <h4 className="text-xs font-semibold text-white/70">Coupon Usage (Last 30 Days)</h4>
            </div>
            <div className="flex items-end gap-[2px] h-24">
              {couponStats.usageByDay.map((d, i) => {
                const maxCount = Math.max(...couponStats.usageByDay.map(x => x.count), 1);
                const h = Math.max((d.count / maxCount) * 100, 2);
                return (
                  <div key={i} className="flex-1 rounded-t-sm transition-all duration-500"
                    style={{ height: `${h}%`, background: d.count > 0 ? 'linear-gradient(180deg, #7B2CFF, #FF2EC9)' : 'rgba(255,255,255,0.05)' }}
                    title={`${d.day}: ${d.count} uses`} />
                );
              })}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] text-white/25">30 days ago</span>
              <span className="text-[9px] text-white/25">Today</span>
            </div>
          </div>

          {/* Discount Distribution */}
          <div className="glow-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Percent size={14} className="text-white/40" />
              <h4 className="text-xs font-semibold text-white/70">Discount Distribution</h4>
            </div>
            <div className="space-y-2.5">
              {couponStats.discountDistribution.map(d => {
                const maxVal = Math.max(...couponStats.discountDistribution.map(x => x.value), 1);
                const pct = Math.round((d.value / maxVal) * 100);
                return (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs text-white/70">{d.label}</span>
                      </div>
                      <span className="text-[10px] text-white/40">{d.value} coupons</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: d.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glow-card p-4 h-24 shimmer" />
        ))}
      </div>
      <div className="glow-card p-5 h-48 shimmer" />
    </div>
  );
}
