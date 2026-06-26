import { Home, Search, ShoppingCart, Package, User } from 'lucide-react';
import { useLocation, useNavigate } from '../lib/router';
import { useStore } from '../store/StoreContext';

const navItems = [
  { path: '/', icon: Home, label: 'Home', color: '#FF8A00' },
  { path: '/search', icon: Search, label: 'Search', color: '#00D1FF' },
  { path: '/cart', icon: ShoppingCart, label: 'Cart', color: '#FF2EC9' },
  { path: '/orders', icon: Package, label: 'Orders', color: '#7B2CFF' },
  { path: '/profile', icon: User, label: 'Profile', color: '#FF8A00' },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useStore();
  const cartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(180deg, rgba(10, 10, 15, 0.8) 0%, rgba(13, 17, 23, 0.95) 100%)',
        backdropFilter: 'blur(24px) saturate(1.5)',
        borderTop: '1px solid rgba(255, 138, 0, 0.06)',
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      }}
    >
      <div
        className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-around py-2 px-4"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
      >
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.path === '/cart' && cartCount > 0 ? `${item.label} (${cartCount} items)` : item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center gap-0.5 py-1 px-3 transition-all duration-400"
            >
              <div
                className={`relative p-2.5 rounded-2xl transition-all duration-400 ${
                  isActive ? 'scale-110' : 'hover:scale-105'
                }`}
                style={isActive ? {
                  background: `linear-gradient(135deg, ${item.color}20, ${item.color}08)`,
                  boxShadow: `0 4px 16px ${item.color}20, 0 0 24px ${item.color}10`,
                  border: `1px solid ${item.color}30`,
                } : {}}
              >
                <Icon
                  size={22}
                  aria-hidden="true"
                  className="transition-all duration-300"
                  style={isActive ? {
                    color: item.color,
                    filter: `drop-shadow(0 0 8px ${item.color})`,
                  } : { color: 'rgba(255,255,255,0.35)' }}
                />
                {item.path === '/cart' && cartCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 text-white text-[9px] font-bold rounded-full flex items-center justify-center neon-pulse"
                    style={{
                      background: 'linear-gradient(135deg, #FF2EC9, #FF8A00)',
                      width: '18px',
                      height: '18px',
                      boxShadow: '0 0 8px rgba(255, 46, 201, 0.5)',
                    }}
                  >
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] font-medium transition-all duration-300"
                aria-hidden="true"
                style={{ color: isActive ? item.color : 'rgba(255,255,255,0.25)' }}
              >
                {item.label}
              </span>
              {isActive && (
                <div
                  aria-hidden="true"
                  className="absolute -bottom-2 w-6 h-0.5 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${item.color}, transparent)`,
                    boxShadow: `0 0 8px ${item.color}`,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
