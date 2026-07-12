import { Home, Grid3x3, Search, ShoppingCart, User } from 'lucide-react';
import { useLocation, useNavigate } from '../lib/router';
import { useStore } from '../store/StoreContext';
import { useTranslation } from 'react-i18next';

const navItems = [
  { path: '/',           icon: Home,         labelKey: 'nav.home' },
  { path: '/categories', icon: Grid3x3,      labelKey: 'nav.category' },
  { path: '/search',     icon: Search,       labelKey: 'nav.search' },
  { path: '/cart',       icon: ShoppingCart, labelKey: 'nav.cart' },
  { path: '/profile',    icon: User,         labelKey: 'nav.account' },
];

const ACTIVE_COLOR = '#2563EB';
const INACTIVE_COLOR = '#64748B';

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useStore();
  const cartCount = state.cart.reduce((sum, i) => sum + i.quantity, 0);

  const activeIndex = navItems.findIndex(item =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );
  const safeActive = activeIndex >= 0 ? activeIndex : 0;

  const handleClick = (path: string) => {
    navigate(path);
  };

  return (
    <>
      <div aria-hidden="true" style={{ height: 'calc(60px + env(safe-area-inset-bottom, 0px))' }} />

      <nav
        aria-label="Main navigation"
        className="fixed left-0 right-0 z-50 flex"
        style={{
          bottom: 0,
          height: 'calc(60px + env(safe-area-inset-bottom, 0px))',
          background: '#ffffff',
          borderTop: '1px solid #e5e7eb',
          boxShadow: '0 -1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        {navItems.map((item, index) => {
          const isActive = index === safeActive;
          const Icon = item.icon;
          const label = t(item.labelKey);
          const isCart = item.path === '/cart';

          return (
            <button
              key={item.path}
              onClick={() => handleClick(item.path)}
              aria-label={isCart && cartCount > 0 ? `${label} (${cartCount} ${t('common.items') || 'items'})` : label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center bg-transparent border-0 cursor-pointer outline-none flex-1"
              style={{
                height: '60px',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                gap: '2px',
              }}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    width: '24px',
                    height: '3px',
                    borderRadius: '0 0 999px 999px',
                    background: ACTIVE_COLOR,
                  }}
                />
              )}

              <div style={{ position: 'relative' }}>
                <Icon
                  size={22}
                  strokeWidth={2}
                  aria-hidden="true"
                  style={{
                    color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                    transition: 'color 200ms ease',
                  }}
                />

                {isCart && cartCount > 0 && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      right: '-8px',
                      minWidth: '16px',
                      height: '16px',
                      padding: '0 4px',
                      borderRadius: '999px',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 0 1.5px #ffffff',
                      zIndex: 2,
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>

              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                  transition: 'color 200ms ease',
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
