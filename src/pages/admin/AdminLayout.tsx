import { useState, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import { useNavigate, useParams, useLocation } from '../../lib/router';
import {
  LayoutDashboard, Package, Tag, Image, ShoppingCart, Users, LogOut, Shield,
  Ticket, Bell, Zap, BarChart2, Settings, Star, Menu, X, ChevronLeft,
  ChevronRight as ChevronRightIcon, Store, RotateCw,
} from 'lucide-react';

const COLLAPSE_KEY = 'mia-admin-sidebar-collapsed';
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

// ── Section definitions ────────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    label: 'Store',
    items: [
      { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
      { id: 'orders',        label: 'Orders',        icon: ShoppingCart    },
      { id: 'products',      label: 'Products',      icon: Package         },
      { id: 'categories',    label: 'Categories',    icon: Tag             },
      { id: 'brands',        label: 'Brands',        icon: Tag             },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'banners',       label: 'Banners',       icon: Image           },
      { id: 'flash-sale',    label: 'Flash Sale',    icon: Zap             },
      { id: 'coupons',       label: 'Coupons',       icon: Ticket          },
      { id: 'notifications', label: 'Notifications', icon: Bell            },
    ],
  },
  {
    label: 'Community',
    items: [
      { id: 'customers',     label: 'Customers',     icon: Users           },
      { id: 'reviews',       label: 'Reviews',       icon: Star            },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'reports',       label: 'Analytics',     icon: BarChart2       },
      { id: 'settings',      label: 'Settings',      icon: Settings        },
    ],
  },
];

const ALL_SECTIONS = NAV_GROUPS.flatMap(g => g.items);

// Bottom nav items for mobile (most important 5)
const MOBILE_NAV = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'orders',    icon: ShoppingCart    },
  { id: 'products',  icon: Package         },
  { id: 'reports',   icon: BarChart2       },
];

// ── Sidebar nav item ───────────────────────────────────────────────────────────

function NavItem({
  item, active, collapsed, onClick,
}: { item: typeof ALL_SECTIONS[0]; active: boolean; collapsed: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative"
      style={active
        ? { background: 'rgba(255,138,0,0.12)', color: '#FF8A00' }
        : { color: 'rgba(255,255,255,0.5)', background: 'transparent' }
      }
    >
      <Icon size={17} className="shrink-0 transition-colors" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-orange-400" />}
    </button>
  );
}

// ── Sidebar component ─────────────────────────────────────────────────────────

function Sidebar({
  activeSection, collapsed, onNav, onCollapse, profile, onSignOut,
}: {
  activeSection: string;
  collapsed: boolean;
  onNav: (id: string) => void;
  onCollapse: () => void;
  profile: any;
  onSignOut: () => void;
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: 'rgba(10,10,14,0.98)' }}>
      {/* Logo row */}
      <div
        className="flex items-center justify-between px-4 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.2)' }}>
              <Shield size={15} className="text-mia-orange" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">Admin Panel</p>
              <p className="text-[10px] text-white/25 mt-0.5">MIA ONE</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto"
            style={{ background: 'rgba(255,138,0,0.1)' }}>
            <Shield size={15} className="text-mia-orange" />
          </div>
        )}
        <button
          onClick={onCollapse}
          className="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center hover:bg-white/8 transition-colors shrink-0"
        >
          {collapsed
            ? <ChevronRightIcon size={14} className="text-white/30" />
            : <ChevronLeft size={14} className="text-white/30" />
          }
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-hide">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest px-3 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={activeSection === item.id}
                  collapsed={collapsed}
                  onClick={() => onNav(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User footer */}
      <div
        className="px-3 py-3 shrink-0 space-y-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        {!collapsed && profile?.full_name && (
          <div className="px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <p className="text-xs font-semibold text-white/80 truncate">{profile.full_name}</p>
            <p className="text-[10px] text-white/30 mt-0.5">Administrator</p>
          </div>
        )}
        <button
          onClick={onSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all"
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </div>
  );
}

// ── Section renderer ──────────────────────────────────────────────────────────

function SectionContent({ section }: { section: string }) {
  switch (section) {
    case 'dashboard':     return <AdminDashboard />;
    case 'products':      return <AdminProducts />;
    case 'categories':    return <AdminCategories />;
    case 'brands':        return <AdminBrands />;
    case 'banners':       return <AdminBanners />;
    case 'flash-sale':    return <AdminFlashSale />;
    case 'orders':        return <AdminOrders />;
    case 'customers':     return <AdminCustomers />;
    case 'reviews':       return <AdminReviews />;
    case 'coupons':       return <AdminCoupons />;
    case 'notifications': return <AdminNotifications />;
    case 'reports':       return <AdminReports />;
    case 'settings':      return <AdminSettings />;
    default:              return <AdminDashboard />;
  }
}

// ── Main layout ───────────────────────────────────────────────────────────────

export function AdminLayout() {
  const { user, profile, loading, isAdmin, signOut } = useAuth();
  const navigate  = useNavigate();
  const params    = useParams();
  const { pathname } = useLocation();

  const sectionFromParam = params.section && params.section !== '' ? params.section : null;
  const [activeSection, setActiveSection] = useState(sectionFromParam || 'dashboard');
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [collapsed, setCollapsed]         = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
  });
  const [refreshKey, setRefreshKey]       = useState(0);
  const [refreshing, setRefreshing]       = useState(false);

  useEffect(() => {
    if (sectionFromParam) setActiveSection(sectionFromParam);
    else if (pathname === '/admin') setActiveSection('dashboard');
  }, [sectionFromParam, pathname]);

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  const handleRefresh = () => {
    setRefreshing(true);
    setRefreshKey(k => k + 1);
    setTimeout(() => setRefreshing(false), 600);
  };

  // Close drawer on nav
  const handleNav = (id: string) => {
    setActiveSection(id);
    navigate(`/admin/${id}`);
    setDrawerOpen(false);
  };

  const handleSignOut = () => { signOut(); navigate('/'); };

  if (loading) {
    return (
      <div className="min-h-screen bg-mia-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl breathe-neon"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }} />
          <span className="text-white/40 text-sm">Verifying access…</span>
        </div>
      </div>
    );
  }

  if (!user) { navigate('/login'); return null; }
  if (!isAdmin) { navigate('/'); return null; }

  const activeLabel = ALL_SECTIONS.find(s => s.id === activeSection)?.label || 'Dashboard';
  const sidebarW = collapsed ? 64 : 240;

  return (
    <div className="min-h-screen bg-mia-black flex">

      {/* ── Desktop sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-30 transition-all duration-300"
        style={{
          width: sidebarW,
          borderRight: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
        }}
      >
        <Sidebar
          activeSection={activeSection}
          collapsed={collapsed}
          onNav={handleNav}
          onCollapse={() => setCollapsed(v => !v)}
          profile={profile}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ── Mobile drawer overlay ─────────────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 flex flex-col transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)', boxShadow: '8px 0 32px rgba(0,0,0,0.5)' }}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-white/50" />
          </button>
        </div>
        <Sidebar
          activeSection={activeSection}
          collapsed={false}
          onNav={handleNav}
          onCollapse={() => {}}
          profile={profile}
          onSignOut={handleSignOut}
        />
      </aside>

      {/* ── Main content area ─────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ transition: 'margin-left 0.3s' }}
      >
        {/* On lg+, push entire content area right to clear the fixed sidebar */}
        <style>{`@media (min-width: 1024px) { #admin-main-wrap { margin-left: ${sidebarW}px; } }`}</style>
        <div id="admin-main-wrap" className="flex flex-col flex-1 min-h-screen">

        {/* Mobile top header */}
        <header
          className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3"
          style={{
            background: 'rgba(10,10,14,0.95)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Menu size={18} className="text-white/70" />
            </button>
            <div>
              <p className="text-xs text-white/30 leading-none">Admin</p>
              <h1 className="text-sm font-bold text-white leading-tight">{activeLabel}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/8 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              title="Refresh page data"
            >
              <RotateCw size={15} className={`text-white/40 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/8 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              title="Go to store"
            >
              <Store size={15} className="text-white/40" />
            </button>
            <button
              onClick={handleSignOut}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-500/10 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <LogOut size={15} className="text-red-400/60" />
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <header
          className="hidden lg:flex sticky top-0 z-20 items-center justify-between px-6 py-3"
          style={{
            background: 'rgba(10,10,14,0.95)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <h1 className="text-base font-bold text-white">{activeLabel}</h1>
          <div className="flex items-center gap-3">
            {profile?.full_name && (
              <span className="text-xs text-white/40 font-medium">{profile.full_name}</span>
            )}
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
              title="Refresh page data"
            >
              <RotateCw size={13} className={refreshing ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/50 hover:text-white/80 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Store size={13} /> View Store
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6 pb-28 lg:pb-8">
          <div className="max-w-6xl mx-auto">
            <SectionContent key={refreshKey} section={activeSection} />
          </div>
        </main>

        {/* Mobile bottom navigation */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around px-2 py-2"
          style={{
            background: 'rgba(10,10,14,0.97)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
          }}
        >
          {MOBILE_NAV.map(item => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all"
                style={active ? { background: 'rgba(255,138,0,0.1)' } : {}}
              >
                <Icon size={20} style={{ color: active ? '#FF8A00' : 'rgba(255,255,255,0.4)' }} />
                <span className="text-[9px] font-medium" style={{ color: active ? '#FF8A00' : 'rgba(255,255,255,0.35)' }}>
                  {ALL_SECTIONS.find(s => s.id === item.id)?.label}
                </span>
              </button>
            );
          })}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all"
          >
            <Menu size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
            <span className="text-[9px] font-medium text-white/35">More</span>
          </button>
        </nav>

        </div>{/* end admin-main-wrap */}
      </div>
    </div>
  );
}
