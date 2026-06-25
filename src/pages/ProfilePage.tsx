import { useEffect, useState } from 'react';
import {
  Package, Heart, MapPin, Bell, Settings, LogOut, ChevronRight,
  Edit2, Shield, Tag, User, Camera, Star, ShoppingBag, TrendingUp, Receipt,
} from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../lib/auth';
import { appConfig } from '../lib/config';
import { fetchUserNotifications, fetchOrders } from '../lib/api';

export function ProfilePage() {
  const navigate = useNavigate();
  const { state } = useStore();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchUserNotifications(user.id).then(notifs => {
      setUnreadCount(notifs.filter((n: any) => !n.is_read).length);
    });
    fetchOrders(user.id).then(orders => {
      setOrderCount(orders.length);
    });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuSections = [
    {
      title: 'My Account',
      items: [
        { icon: Package, label: 'My Orders', badge: orderCount > 0 ? orderCount : undefined, path: '/orders', color: '#FF8A00' },
        { icon: Heart, label: 'Wishlist', badge: state.wishlist.length > 0 ? state.wishlist.length : undefined, path: '/wishlist', color: '#FF2EC9' },
        { icon: Receipt, label: 'Transaction History', path: '/transactions', color: '#00D1FF' },
        { icon: MapPin, label: 'Saved Addresses', path: '/addresses', color: '#7B2CFF' },
      ],
    },
    {
      title: 'Offers & Updates',
      items: [
        { icon: Bell, label: 'Notifications', badge: unreadCount > 0 ? unreadCount : undefined, path: '/notifications', color: '#00D1FF' },
        { icon: Tag, label: 'My Coupons', path: '/coupons', color: '#22C55E' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Settings, label: 'Settings', path: '/settings', color: '#94A3B8' },
      ],
    },
  ];

  return (
    <div className="page-transition pb-28">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-white">My Profile</h1>
          {isAdmin && (
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-mia-orange"
              style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
              <Shield size={12} /> Admin Panel
            </button>
          )}
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-6 space-y-5">
        {/* Hero Profile Card */}
        <div className="glow-card p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[-20px] left-[10%] w-40 h-40 rounded-full opacity-[0.06] blur-3xl"
              style={{ background: 'radial-gradient(circle, #FF8A00, transparent)' }} />
            <div className="absolute bottom-[-10px] right-[10%] w-32 h-32 rounded-full opacity-[0.06] blur-3xl"
              style={{ background: 'radial-gradient(circle, #FF2EC9, transparent)' }} />
          </div>

          <div className="flex items-center gap-4 relative">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="absolute inset-[-4px] rounded-2xl opacity-60 blur-md"
                style={{ background: 'conic-gradient(from 0deg, #FF8A00, #FF2EC9, #7B2CFF, #00D1FF, #FF8A00)', animation: 'rotate-glow 3s linear infinite' }} />
              <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ background: 'linear-gradient(145deg, #141820, #0D1117)', border: '2px solid rgba(255,138,0,0.2)' }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : user ? (
                  <span className="text-2xl font-bold text-white/80">
                    {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                  </span>
                ) : (
                  <img src={appConfig.logo} alt="MIA ONE" className="w-12 h-12 object-contain opacity-60" />
                )}
              </div>
              {user && (
                <button
                  onClick={() => navigate('/edit-profile')}
                  className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 2px 8px rgba(255,138,0,0.4)' }}>
                  <Camera size={12} className="text-white" />
                </button>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {user ? (profile?.full_name || 'Welcome!') : 'Guest User'}
              </h2>
              <p className="text-xs text-white/40 mt-0.5 truncate">
                {user ? user.email : 'Sign in to access your account'}
              </p>
              {profile?.phone && (
                <p className="text-xs text-white/30 mt-0.5">{profile.phone}</p>
              )}
              {user && (
                <button
                  onClick={() => navigate('/edit-profile')}
                  className="mt-2 flex items-center gap-1 text-[11px] text-mia-orange font-medium">
                  <Edit2 size={10} /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Stats row */}
          {user ? (
            <div className="grid grid-cols-3 gap-3 mt-5 pt-4"
              style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              {[
                { value: orderCount, label: 'Orders', icon: ShoppingBag, color: '#FF8A00', path: '/orders' },
                { value: state.wishlist.length, label: 'Wishlist', icon: Heart, color: '#FF2EC9', path: '/wishlist' },
                { value: state.cart.reduce((s, i) => s + i.quantity, 0), label: 'In Cart', icon: TrendingUp, color: '#00D1FF', path: '/cart' },
              ].map(stat => {
                const StatIcon = stat.icon;
                return (
                  <button key={stat.label} onClick={() => navigate(stat.path)}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all hover:scale-105"
                    style={{ background: `${stat.color}06` }}>
                    <StatIcon size={14} style={{ color: stat.color }} />
                    <span className="text-lg font-bold leading-none" style={{ color: stat.color }}>{stat.value}</span>
                    <span className="text-[10px] text-white/30 font-medium">{stat.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white glow-btn"
                style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="flex-1 py-3 rounded-2xl text-sm font-medium text-white/70"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Menu sections */}
        {menuSections.map(section => (
          <div key={section.title}>
            <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2 px-1">
              {section.title}
            </p>
            <div className="space-y-1.5">
              {section.items.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (!user && item.path !== '/settings') {
                        navigate('/login');
                      } else {
                        navigate(item.path);
                      }
                    }}
                    className="menu-glow w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group"
                    style={{ border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shrink-0"
                      style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}18` }}>
                      <Icon size={16} style={{ color: item.color }} />
                    </div>
                    <span className="text-sm text-white/80 flex-1 text-left font-medium">{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-lg font-bold min-w-[20px] text-center"
                        style={{ background: `${item.color}15`, color: item.color, border: `1px solid ${item.color}25` }}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight size={14} className="text-white/15 group-hover:text-white/40 transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout */}
        {user && (
          <div className="pt-2">
            <button
              onClick={handleSignOut}
              className="menu-glow w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group"
              style={{ border: '1px solid rgba(239,68,68,0.07)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.1)' }}>
                <LogOut size={16} className="text-red-400" />
              </div>
              <span className="text-sm text-red-400 font-medium flex-1 text-left">Logout</span>
            </button>
          </div>
        )}

        {/* Member since */}
        {user && profile?.created_at && (
          <div className="flex items-center gap-2 justify-center py-2">
            <Star size={10} className="text-white/15" />
            <p className="text-[10px] text-white/20">
              Member since {new Date(profile.created_at).toLocaleDateString('en', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
