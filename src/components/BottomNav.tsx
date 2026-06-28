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
const NAV_PADDING = 20;

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
  const [dimensions, setDimensions] = useState({ bubbleSize: 68, navHeight: 60 });

  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const bubbleSize = width < 640 ? 68 : width < 1024 ? 72 : 74;
    const navHeight = width < 640 ? 60 : width < 1024 ? 64 : 68;
    setDimensions({ bubbleSize, navHeight });
  }, []);

  const updateBubblePosition = useCallback(() => {
    const container = containerRef.current;
    const activeItem = itemRefs.current[safeActive];
    if (container && activeItem) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const containerCenter = containerRect.left + containerRect.width / 2 - NAV_PADDING;
      const itemCenter = itemRect.left + itemRect.width / 2;
      setBubbleOffset(itemCenter - containerCenter);
    }
  }, [safeActive]);

  useEffect(() => {
    updateDimensions();
    updateBubblePosition();
    const handleResize = () => {
      updateDimensions();
      updateBubblePosition();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions, updateBubblePosition]);

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

  const { bubbleSize, navHeight } = dimensions;

  return (
    <>
      <div aria-hidden="true" style={{ height: `calc(${navHeight + 48}px + env(safe-area-inset-bottom, 0px))` }} />

      <nav
        aria-label="Main navigation"
        className="fixed left-0 right-0 z-50 flex justify-center"
        style={{
          bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none',
        }}
      >
        <div
          ref={containerRef}
          className="relative flex items-center"
          style={{
            height: `${navHeight}px`,
            padding: `0 ${NAV_PADDING}px`,
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.78)',
            backdropFilter: 'blur(30px) saturate(2.2)',
            WebkitBackdropFilter: 'blur(30px) saturate(2.2)',
            border: '1.5px solid rgba(255, 255, 255, 0.9)',
            boxShadow: `
              0 8px 32px rgba(37, 99, 235, 0.12),
              0 3px 12px rgba(0, 0, 0, 0.06),
              0 0 0 1px rgba(255, 255, 255, 0.25),
              inset 0 2px 0 rgba(255, 255, 255, 0.95),
              inset 0 -1px 0 rgba(0, 0, 0, 0.02)
            `,
            pointerEvents: 'auto',
          }}
        >
          {/* Sliding active bubble with reduced glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: `${bubbleSize}px`,
              height: `${bubbleSize}px`,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #ffffff 0%, #f5f9ff 40%, #e8f0ff 70%, #dbe7ff 100%)',
              top: '50%',
              left: '50%',
              transform: `translate(calc(-50% + ${bubbleOffset}px), -50%)`,
              transition: 'transform 250ms cubic-bezier(0.34, 1.2, 0.64, 1)',
              zIndex: 0,
              willChange: 'transform',
              boxShadow: `
                0 0 14px rgba(37, 99, 235, 0.22),
                0 0 28px rgba(37, 99, 235, 0.12),
                0 3px 8px rgba(37, 99, 235, 0.18),
                inset 0 2px 3px rgba(255, 255, 255, 0.95),
                inset 0 -1px 3px rgba(37, 99, 235, 0.06)
              `,
            }}
          />

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
                  width: `${bubbleSize - 6}px`,
                  height: `${bubbleSize - 6}px`,
                  zIndex: 1,
                  transition: 'transform 200ms ease',
                  transform: clickAnim === index ? 'scale(0.9)' : 'scale(1)',
                }}
              >
                <Icon
                  size={isActive ? 28 : 24}
                  strokeWidth={isActive ? 2.5 : 2}
                  aria-hidden="true"
                  style={{
                    color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                    filter: isActive
                      ? 'drop-shadow(0 1px 6px rgba(37, 99, 235, 0.35))'
                      : 'none',
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
                      background: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
                      color: '#fff',
                      fontSize: '9px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 6px rgba(37, 99, 235, 0.45), 0 0 0 1.5px rgba(255,255,255,0.95)',
                      zIndex: 2,
                      transform: badgePop ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 180ms ease',
                    }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
