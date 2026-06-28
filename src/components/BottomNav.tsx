import { useState, useEffect, useRef, useCallback } from 'react';
import { Home, Grid3x3, ShoppingCart, Heart, User } from 'lucide-react';
import { useLocation, useNavigate } from '../lib/router';
import { useStore } from '../store/StoreContext';
import { useTranslation } from 'react-i18next';

const navItems = [
  { path: '/',           icon: Home,         labelKey: 'nav.home' },
  { path: '/categories', icon: Grid3x3,      labelKey: 'nav.category' },
  { path: '/cart',       icon: ShoppingCart, labelKey: 'nav.cart' },
  { path: '/wishlist',   icon: Heart,        labelKey: 'nav.wishlist' },
  { path: '/profile',    icon: User,         labelKey: 'nav.account' },
];

const ACTIVE_COLOR = '#2563EB';
const INACTIVE_COLOR = '#1e293b';
const BUBBLE_SIZE = 76;

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

  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [bubbleOffset, setBubbleOffset] = useState(0);
  const [navHeight, setNavHeight] = useState(74);

  const updateNavHeight = useCallback(() => {
    const width = window.innerWidth;
    setNavHeight(width < 768 ? 74 : 78);
  }, []);

  const updateBubblePosition = useCallback(() => {
    const container = containerRef.current;
    const activeItem = itemRefs.current[safeActive];
    if (container && activeItem) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2;
      const itemCenter = itemRect.left + itemRect.width / 2;
      setBubbleOffset(itemCenter - containerCenter);
    }
  }, [safeActive]);

  useEffect(() => {
    updateNavHeight();
    updateBubblePosition();
    const handleResize = () => {
      updateNavHeight();
      updateBubblePosition();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateNavHeight, updateBubblePosition]);

  useEffect(() => {
    updateBubblePosition();
  }, [safeActive, updateBubblePosition]);

  const prevCartCount = useRef(cartCount);
  const [badgePop, setBadgePop] = useState(false);
  useEffect(() => {
    if (cartCount !== prevCartCount.current) {
      setBadgePop(true);
      const timer = setTimeout(() => setBadgePop(false), 300);
      prevCartCount.current = cartCount;
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const [clickAnim, setClickAnim] = useState<number | null>(null);

  const handleClick = (path: string, index: number) => {
    setClickAnim(index);
    setTimeout(() => setClickAnim(null), 250);
    navigate(path);
  };

  return (
    <>
      <div aria-hidden="true" style={{ height: `calc(${navHeight + 52}px + env(safe-area-inset-bottom, 0px))` }} />

      <nav
        aria-label="Main navigation"
        className="fixed left-0 right-0 z-50 flex justify-center"
        style={{
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none',
        }}
      >
        <div
          ref={containerRef}
          className="relative flex items-center justify-between"
          style={{
            width: '92%',
            maxWidth: '420px',
            height: `${navHeight}px`,
            padding: '0 24px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.42)',
            backdropFilter: 'blur(18px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(18px) saturate(1.8)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: `
              0 8px 32px rgba(31, 38, 135, 0.07),
              0 4px 16px rgba(0, 0, 0, 0.05),
              inset 0 2px 0 rgba(255, 255, 255, 0.6),
              inset 0 -1px 0 rgba(0, 0, 0, 0.02)
            `,
            pointerEvents: 'auto',
          }}
        >
          {/* Subtle outer blue glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: '-20px',
              borderRadius: '999px',
              background: 'rgba(59, 130, 246, 0.08)',
              filter: 'blur(24px)',
              pointerEvents: 'none',
              zIndex: -1,
            }}
          />

          {/* Sliding active bubble - overlaps above nav bar */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: `${BUBBLE_SIZE}px`,
              height: `${BUBBLE_SIZE}px`,
              borderRadius: '50%',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.85), rgba(255,255,255,0.55))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${bubbleOffset}px), calc(-50% - 4px))`,
              transition: 'transform 250ms cubic-bezier(0.34, 1.2, 0.64, 1)',
              zIndex: 10,
              willChange: 'transform',
              boxShadow: `
                0 4px 16px rgba(37, 99, 235, 0.18),
                0 2px 8px rgba(0, 0, 0, 0.08),
                inset 0 2px 4px rgba(255, 255, 255, 0.9),
                inset 0 -2px 4px rgba(0, 0, 0, 0.02)
              `,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {(() => {
              const activeItem = navItems[safeActive];
              const ActiveIcon = activeItem?.icon;
              return ActiveIcon ? (
                <ActiveIcon
                  size={28}
                  strokeWidth={2.5}
                  style={{
                    color: ACTIVE_COLOR,
                    filter: 'drop-shadow(0 2px 6px rgba(37, 99, 235, 0.4))',
                  }}
                />
              ) : null;
            })()}
          </div>

          {/* Nav items - icon only */}
          {navItems.map((item, index) => {
            const isActive = index === safeActive;
            const Icon = item.icon;
            const label = t(item.labelKey);
            const isCart = item.path === '/cart';

            return (
              <button
                key={item.path}
                ref={el => { itemRefs.current[index] = el; }}
                onClick={() => handleClick(item.path, index)}
                aria-label={isCart && cartCount > 0 ? `${label} (${cartCount} ${t('common.items') || 'items'})` : label}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex items-center justify-center bg-transparent border-0 cursor-pointer outline-none"
                style={{
                  width: `${BUBBLE_SIZE}px`,
                  height: `${navHeight}px`,
                  zIndex: isActive ? 11 : 5,
                  transition: 'transform 200ms ease',
                  transform: clickAnim === index ? 'scale(0.9)' : 'scale(1)',
                }}
              >
                {/* Icon container - hidden when active (shown in bubble) */}
                <div
                  style={{
                    opacity: isActive ? 0 : 1,
                    transition: 'opacity 200ms ease',
                    position: 'relative',
                  }}
                >
                  <Icon
                    size={24}
                    strokeWidth={2}
                    aria-hidden="true"
                    style={{
                      color: INACTIVE_COLOR,
                      transition: 'all 200ms ease',
                    }}
                  />

                  {/* Cart badge */}
                  {isCart && cartCount > 0 && (
                    <span
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-8px',
                        minWidth: '16px',
                        height: '16px',
                        padding: '0 4px',
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 1px 4px rgba(239, 68, 68, 0.4), 0 0 0 1.5px rgba(255,255,255,0.9)',
                        zIndex: 2,
                        transform: badgePop ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 180ms ease',
                      }}
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
