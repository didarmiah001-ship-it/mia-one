import { useEffect, useState } from 'react';
import { ShoppingBag, Users, Package, TrendingUp, Clock, CheckCircle2, DollarSign, Zap } from 'lucide-react';
import { adminGetStats } from '../../lib/api';

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

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetStats().then(s => { setStats(s as Stats); setLoading(false); });
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
