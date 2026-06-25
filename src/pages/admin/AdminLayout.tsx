import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useNavigate, useParams, useLocation } from '../../lib/router';
import { LayoutDashboard, Package, Tag, Image, ShoppingCart, Users, LogOut, Shield, Ticket, Bell, Zap, BarChart2, Settings, Star } from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { AdminProducts } from './AdminProducts';
import { AdminCategories } from './AdminCategories';
import { AdminBanners } from './AdminBanners';
import { AdminOrders } from './AdminOrders';
import { AdminCustomers } from './AdminCustomers';
import { AdminBrands } from './AdminBrands';
import { AdminFlashSale } from './AdminFlashSale';
import { AdminReviews } from './AdminReviews';
import { AdminCoupons } from './AdminCoupons';
import { AdminNotifications } from './AdminNotifications';
import { AdminReports } from './AdminReports';
import { AdminSettings } from './AdminSettings';

const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'brands', label: 'Brands', icon: Tag },
  { id: 'banners', label: 'Banners', icon: Image },
  { id: 'flash-sale', label: 'Flash Sale', icon: Zap },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'coupons', label: 'Coupons', icon: Ticket },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'reports', label: 'Analytics', icon: BarChart2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const { pathname } = useLocation();

  const sectionFromParam = params.section && params.section !== '' ? params.section : null;
  const [activeSection, setActiveSection] = useState(sectionFromParam || 'dashboard');

  useEffect(() => {
    if (sectionFromParam) setActiveSection(sectionFromParam);
    else if (pathname === '/admin') setActiveSection('dashboard');
  }, [sectionFromParam, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-mia-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl breathe-neon"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }} />
          <span className="text-white/40 text-sm">Verifying access...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const handleNav = (id: string) => {
    setActiveSection(id);
    navigate(`/admin/${id}`);
  };

  return (
    <div className="min-h-screen bg-mia-black pb-6">
      {/* Top bar */}
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
              <Shield size={16} className="text-mia-orange" />
            </div>
            <h1 className="text-base font-bold text-white">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 hidden sm:block">{profile?.full_name}</span>
            <button
              onClick={() => { signOut(); navigate('/'); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 transition-colors glow-hover"
              title="Sign out"
            >
              <LogOut size={14} className="text-white/40" />
            </button>
          </div>
        </div>
      </header>

      {/* Tab navigation */}
      <div className="sticky top-[52px] z-20 glass border-b border-white/5 overflow-x-auto">
        <div className="max-w-6xl mx-auto flex px-4 gap-1">
          {sections.map(s => {
            const Icon = s.icon;
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleNav(s.id)}
                className="flex items-center gap-2 px-4 py-3 text-xs font-medium whitespace-nowrap transition-all border-b-2"
                style={{
                  borderBottomColor: isActive ? '#FF8A00' : 'transparent',
                  color: isActive ? '#FF8A00' : 'rgba(255,255,255,0.4)',
                }}
              >
                <Icon size={14} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeSection === 'dashboard' && <AdminDashboard />}
        {activeSection === 'products' && <AdminProducts />}
        {activeSection === 'categories' && <AdminCategories />}
        {activeSection === 'brands' && <AdminBrands />}
        {activeSection === 'banners' && <AdminBanners />}
        {activeSection === 'flash-sale' && <AdminFlashSale />}
        {activeSection === 'orders' && <AdminOrders />}
        {activeSection === 'customers' && <AdminCustomers />}
        {activeSection === 'reviews' && <AdminReviews />}
        {activeSection === 'coupons' && <AdminCoupons />}
        {activeSection === 'notifications' && <AdminNotifications />}
        {activeSection === 'reports' && <AdminReports />}
        {activeSection === 'settings' && <AdminSettings />}
      </div>
    </div>
  );
}
