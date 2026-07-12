import { useAuth } from '../lib/auth';
import { useNavigate, useLocation } from '../lib/router';
import { Package, ShoppingCart, Users, LayoutDashboard, Tag, Bell, Settings, LogOut, Ticket, Truck, CreditCard, Megaphone, BarChart3 } from 'lucide-react';

const NAV_ITEMS = [
  { section: '', label: 'Dashboard', icon: LayoutDashboard },
  { section: 'orders', label: 'Orders', icon: ShoppingCart },
  { section: 'products', label: 'Products', icon: Package },
  { section: 'categories', label: 'Categories', icon: Tag },
  { section: 'customers', label: 'Customers', icon: Users },
  { section: 'banners', label: 'Banners', icon: Megaphone },
  { section: 'coupons', label: 'Coupons', icon: Ticket },
  { section: 'payments', label: 'Payments', icon: CreditCard },
  { section: 'payment-settings', label: 'Payment Settings', icon: Truck },
  { section: 'notifications', label: 'Notifications', icon: Bell },
  { section: 'reports', label: 'Reports', icon: BarChart3 },
  { section: 'settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const section = pathname.split('/')[1] || '';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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
                onClick={() => navigate(item.section ? `/${item.section}` : '/')}
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
          <h1 className="text-lg font-bold text-white mb-4">
            {NAV_ITEMS.find(n => (n.section || '') === section)?.label || 'Dashboard'}
          </h1>
          <div className="glow-card p-8 text-center">
            <p className="text-sm text-white/30">Admin content loads here.</p>
            <p className="text-xs text-white/20 mt-2">Section: {section || 'dashboard'}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
