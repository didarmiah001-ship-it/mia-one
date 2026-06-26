import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate, useParams, useLocation } from '../lib/router';
import {
  LayoutDashboard, Package, Tag, Image, ShoppingCart, Users, LogOut,
  Ticket, Bell, Zap, BarChart2, Settings, Star, Menu, X, ChevronLeft,
  ChevronRight as ChevronRightIcon, CreditCard,
} from 'lucide-react';
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
import { AdminPayments } from './AdminPayments';

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
    label: 'Finance',
    items: [
      { id: 'payments',      label: 'Payments',      icon: CreditCard      },
      { id: 'reports',       label: 'Analytics',     icon: BarChart2       },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'settings',      label: 'Settings',      icon: Settings        },
    ],
  },
];

const ALL_SECTIONS = NAV_GROUPS.flatMap(g => g.items);

const MOBILE_NAV = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'orders',    icon: ShoppingCart    },
  { id: 'products',  icon: Package         },
  { id: 'reports',   icon: BarChart2       },
];

function NavItem({
  item, active, collapsed, onClick,
}: { item: typeof ALL_SECTIONS[0]; active: boolean; collapsed: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 relative"
      style={active
        ? { background: 'rgba(255,138,0,0.12)', color: '#FF8A00' }
        : { color: 'rgba(255,255,255,0.5)', background: 'transparent' }
      }
    >
      <Icon size={17} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-orange-400" />}
    </button>
  );
}

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
      <div className="flex items-center justify-between px-4 py-4 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <img
              src="/mia-admin-logo.png"
              alt="MIA Admin"
              className="w-9 h-9 object-contain shrink-0"
              style={{ filter: 'drop-shadow(0 0 8px rgba(255,138,0,0.4))' }}
            />
            <div>
              <p className="text-xs font-bold text-white leading-none">MIA Admin</p>
              <p className="text-[10px] text-white/25 mt-0.5">Admin Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img
            src="/mia-admin-logo.png"
            alt="MIA"
            className="w-9 h-9 object-contain mx-auto"
            style={{ filter: 'drop-shadow(0 0 8px rgba(255,138,0,0.4))' }}
          />
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

      <div className="px-3 py-3 shrink-0 space-y-1"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
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
    case 'payments':      return <AdminPayments />;
    case 'reports':       return <AdminReports />;
    case 'settings':      return <AdminSettings />;
    default:              return <AdminDashboard />;
  }
}

export function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const { pathname } = useLocation();

  const sectionFromParam = params.section && params.section !== '' ? params.section : null;
  const [activeSection, setActiveSection] = useState(sectionFromParam || 'dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (sectionFromParam) setActiveSection(sectionFromParam);
    else if (pathname === '/') setActiveSection('dashboard');
  }, [sectionFromParam, pathname]);

  const handleNav = (id: string) => {
    setActiveSection(id);
    navigate(`/${id}`);
    setDrawerOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const activeLabel = ALL_SECTIONS.find(s => s.id === activeSection)?.label || 'Dashboard';
  const sidebarW = collapsed ? 64 : 240;

  return (
    <div className="min-h-screen bg-mia-black flex">
      {/* Desktop sidebar */}
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

      {/* Mobile drawer overlay */}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ transition: 'margin-left 0.3s' }}>
        <style>{`@media (min-width: 1024px) { #admin-main-wrap { margin-left: ${sidebarW}px; } }`}</style>
        <div id="admin-main-wrap" className="flex flex-col flex-1 min-h-screen">

          {/* Mobile header */}
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
              <div className="flex items-center gap-2">
                <img src="/mia-admin-logo.png" alt="MIA" className="w-7 h-7 object-contain" />
                <div>
                  <p className="text-[10px] text-white/30 leading-none">Admin</p>
                  <h1 className="text-sm font-bold text-white leading-tight">{activeLabel}</h1>
                </div>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-red-500/10 transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <LogOut size={15} className="text-red-400/60" />
            </button>
          </header>

          {/* Desktop header */}
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
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }}>
                <img src="/mia-admin-logo.png" alt="" className="w-4 h-4 object-contain" />
                <span className="text-xs font-semibold text-[#FF8A00]">Administrator</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 px-4 py-5 lg:px-6 lg:py-6 pb-28 lg:pb-8">
            <div className="max-w-6xl mx-auto">
              <SectionContent section={activeSection} />
            </div>
          </main>

          {/* Mobile bottom nav */}
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

        </div>
      </div>
    </div>
  );
}
