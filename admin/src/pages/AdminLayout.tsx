import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Package, ShoppingCart, Users, LayoutDashboard, Tag, Bell, Settings, 
  LogOut, Ticket, Truck, CreditCard, Megaphone, BarChart3, 
  Menu, X, ChevronLeft, ChevronRight, RotateCw 
} from 'lucide-react';
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

const COLLAPSE_KEY = 'mia-admin-sidebar-collapsed';

const NAV_ITEMS = [
  { section: 'dashboard',        label: 'Dashboard',         icon: LayoutDashboard, Page: AdminDashboard },
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
  { section: 'settings',          label: 'Settings',          icon: Settings,        Page: AdminSettings },
];

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { section = 'dashboard' } = useParams();

  // Desktop sidebar collapse state tracking with localstorage persistence
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(COLLAPSE_KEY) === 'true';
  });

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // In-page refresh logic variables
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed));
  }, [collapsed]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setRefreshing(false), 500);
  };

  const activeItem = NAV_ITEMS.find(n => n.section === section) ?? NAV_ITEMS[0];
  const Page = activeItem.Page;

  const renderNavItems = () => {
    return NAV_ITEMS.map(item => {
      const Icon = item.icon;
      const active = section === item.section;
      return (
        <button
          key={item.label}
          onClick={() => {
            navigate(`/admin/${item.section}`);
            setDrawerOpen(false); // Mobile auto-close safety rule
          }}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
            active ? 'text-white font-semibold' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]'
          } ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}
          style={active ? { background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' } : {}}
          title={collapsed ? item.label : undefined}
        >
          <Icon size={16} className={active ? 'text-mia-orange shrink-0' : 'shrink-0'} />
          <span className={collapsed ? 'lg:hidden block truncate' : 'block truncate'}>
            {item.label}
          </span>
        </button>
      );
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col lg:flex-row relative">
      
      {/* Inline styles container for animation frames */}
      <style>{`
        @keyframes admin-spin-frame {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .admin-spin-animate {
          animation: admin-spin-frame 0.5s linear infinite;
        }
      `}</style>

      {/* Mobile Shell Header top panel */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0D1117] border-b border-white/5 z-40 shrink-0 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-white font-bold text-sm">MIA Admin</span>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 transition-colors disabled:opacity-40"
        >
          <RotateCw size={16} className={refreshing ? 'admin-spin-animate' : ''} />
        </button>
      </header>

      {/* Mobile Drawer Overlay Back Drop shield */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Sidebar Slider Panel Container */}
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-[#0D1117] border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br from-[#FF8A00] to-[#FF2EC9]">
              M
            </div>
            <div>
              <p className="text-sm font-bold text-white">MIA Admin</p>
            </div>
          </div>
          <button 
            onClick={() => setDrawerOpen(false)}
            className="p-1 rounded-full bg-white/5 hover:bg-white/10 text-white/60"
          >
            <X size={16} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {renderNavItems()}
        </nav>
        <div className="px-3 py-4 border-t border-white/5 bg-[#0A0A0F]/40">
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

      {/* Desktop Persistent Sidebar standard container */}
      <aside 
        className={`hidden lg:flex shrink-0 border-r border-white/5 flex-col transition-all duration-300 sticky top-0 h-screen ${
          collapsed ? 'w-20' : 'w-64'
        }`} 
        style={{ background: 'rgba(13,17,23,0.6)' }}
      >
        <div className="px-5 py-5 border-b border-white/5 relative flex items-center justify-between min-h-[77px]">
          <div className={`flex items-center gap-2.5 transition-opacity duration-200 ${collapsed ? 'opacity-0 lg:absolute lg:left-5' : 'opacity-100'}`}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br from-[#FF8A00] to-[#FF2EC9] shrink-0">
              M
            </div>
            {!collapsed && (
              <div>
                <p className="text-sm font-bold text-white">MIA Admin</p>
                <p className="text-[10px] text-white/30">Control Panel</p>
              </div>
            )}
          </div>
          
          {collapsed && (
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-white bg-gradient-to-br from-[#FF8A00] to-[#FF2EC9] mx-auto shrink-0">
              M
            </div>
          )}

          {/* Sidebar Collapse/Expand Toggle Action Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#141820] border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-colors z-20"
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {renderNavItems()}
        </nav>

        <div className="px-3 py-4 border-t border-white/5">
          {profile?.email && !collapsed && (
            <div className="px-3 py-2 mb-2 transition-opacity duration-200">
              <p className="text-xs text-white/50 font-medium truncate">{profile.email}</p>
              <p className="text-[10px] text-white/25">Admin</p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-colors ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={16} className="shrink-0" />
            <span className={collapsed ? 'hidden' : 'block'}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Layout Area content frame */}
      <div className="flex-1 flex flex-col min-w-0 max-h-screen overflow-hidden">
        
        {/* Desktop Global Navigation Upper Header */}
        <header className="hidden lg:flex items-center justify-end px-8 py-4 bg-[#0A0A0F]/20 border-b border-white/5 shrink-0">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/60 bg-white/5 hover:bg-white/10 border border-white/5 transition-all disabled:opacity-40"
          >
            <RotateCw size={13} className={refreshing ? 'admin-spin-animate' : ''} />
            Refresh Page
          </button>
        </header>

        {/* Inner viewport component container mount */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <Page key={refreshKey} />
          </div>
        </main>
      </div>
    </div>
  );
}
