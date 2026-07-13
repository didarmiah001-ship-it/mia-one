import { useAuth } from '../lib/auth';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, ShoppingCart, Users, LayoutDashboard, Tag, Bell, Settings, LogOut, Ticket, Truck, CreditCard, Megaphone, BarChart3 } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { AdminOrders } from './AdminOrders';
import { AdminProducts } from './AdminProducts';
import { AdminCategories } from './AdminCategories';
import { AdminCustomers } from './AdminCustomers';
import { AdminBanners } from './AdminBanners';
import { AdminCoupons } from './AdminCoupons';
import { AdminPayments } from './AdminPayments';
import { AdminPaymentSettings } from './AdminPaymentSettings';
import { AdminNotifications } from './AdminNotifications';
import { AdminReports } from './AdminReports';
import { AdminSettings } from './AdminSettings';

const NAV_ITEMS = [
  { section: 'dashboard',         label: 'Dashboard',         icon: LayoutDashboard, Page: AdminDashboard },
  { section: 'orders',            label: 'Orders',            icon: ShoppingCart,    Page: AdminOrders },
  { section: 'products',          label: 'Products',          icon: Package,         Page: AdminProducts },
  { section: 'categories',        label: 'Categories',        icon: Tag,             Page: AdminCategories },
  { section: 'customers',         label: 'Customers',         icon: Users,           Page: AdminCustomers },
  { section: 'banners',           label: 'Banners',           icon: Megaphone,       Page: AdminBanners },
  { section: 'coupons',           label: 'Coupons',           icon: Ticket,          Page: AdminCoupons },
  { section: 'payments',          label: 'Payments',          icon: CreditCard,      Page: AdminPayments },
  { section: 'payment-settings',  label: 'Payment Settings',  icon: Truck,           Page: AdminPaymentSettings },
  { section: 'notifications',     label: 'Notifications',     icon: Bell,            Page: AdminNotifications },
  { section: 'reports',           label: 'Reports',           icon: BarChart3,       Page: AdminReports },
  { section: 'settings',          label: 'Settings',          icon: Settings,       Page: AdminSettings },
];

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { section = 'dashboard' } = useParams();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const activeItem = NAV_ITEMS.find(n => n.section === section) ?? NAV_ITEMS[0];
  const Page = activeItem.Page;

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex">
      <aside className="w-64 shrink-0 border-r border-white/5 flex flex-col" style={{ background: 'rgba(13,17,23,0.6)' }}>
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
            >
              M
            </div>
            <div>
              <p className="text-sm font-bold text-white">MIA Admin</p>
              <p className="text-[10px] text-white/30">Control Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = section === item.section;
            return (
              <button
                key={item.label}
                onClick={() => navigate(`/admin/${item.section}`)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  active ? 'text-white font-semibold' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
                }`}
                style={active ? { background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' } : {}}
              >
                <Icon size={16} className={active ? 'text-mia-orange' : ''} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          {profile?.email && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs text-white/50 font-medium truncate">{profile.email}</p>
              <p className="text-[10px] text-white/25">Admin</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <Page />
        </div>
      </main>
    </div>
  );
}
