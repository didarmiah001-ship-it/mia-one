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
const INACTIVE_ICON = '#1e293b';
const NAV_PADDING = 24;

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
  const [bubbleLeft, setBubbleLeft] = useState(0);

  const bubbleSize = typeof window !== 'undefined'
    ? window.innerWidth < 640 ? 74
    : window.innerWidth < 1024 ? 78
    : 82
    : 74;

  const updateBubblePosition = useCallback(() => {
    const container = containerRef.current;
    const activeItem = itemRefs.current[safeActive];
    if (container && activeItem) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      const itemCenter = itemRect.left - containerRect.left + itemRect.width / 2;
      setBubbleLeft(itemCenter);
    }
  }, [safeActive]);

  useEffect(() => {
    updateBubblePosition();
    window.addEventListener('resize', updateBubblePosition);
    return () => window.removeEventListener('resize', updateBubblePosition);
  }, [updateBubblePosition]);

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
      <div aria-hidden="true" style={{ height: 'calc(120px + env(safe-area-inset-bottom, 0px))' }} />

      <nav
        aria-label="Main navigation"
        className="fixed left-0 right-0 z-50 flex justify-center"
        style={{
          bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
          pointerEvents: 'none',
        }}
      >
        <div
          ref={containerRef}
          className="relative flex items-center"
          style={{
            width: '92%',
            maxWidth: '1100px',
            height: 'clamp(78px, 5vw + 70px, 90px)',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.72)',
            backdropFilter: 'blur(24px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.8)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
            boxShadow: `
              0 12px 40px rgba(37, 99, 235, 0.12),
              0 4px 16px rgba(0, 0, 0, 0.08),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.8),
              inset 0 -1px 0 rgba(0, 0, 0, 0.03)
            `,
            pointerEvents: 'auto',
            paddingLeft: `${NAV_PADDING}px`,
            paddingRight: `${NAV_PADDING}px`,
          }}
        >
          {/* Sliding active bubble */}
          <div
            aria-hidden="true"
            className="nav-bubble-active"
            style={{
              position: 'absolute',
              width: `${bubbleSize}px`,
              height: `${bubbleSize}px`,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #ffffff 0%, #f0f6ff 50%, #e0ecff 100%)',
              top: '50%',
              left: bubbleLeft,
              transform: 'translate(-50%, -50%)',
              transition: 'left 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
              zIndex: 0,
              willChange: 'left, transform',
              marginLeft: `-${NAV_PADDING}px`,
            }}
          />

          {/* Nav items */}
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
                className="relative flex flex-col items-center justify-center gap-1 bg-transparent border-0 cursor-pointer outline-none"
                style={{
                  flex: '1 1 0',
                  height: '100%',
                  zIndex: 1,
                  transition: 'transform 250ms ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                onFocus={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
                onBlur={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div
                  className="flex items-center justify-center relative"
                  style={{
                    width: 'clamp(40px, 4vw + 32px, 48px)',
                    height: 'clamp(40px, 4vw + 32px, 48px)',
                    transition: 'all 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: clickAnim === index ? 'scale(1.15)' : isActive ? 'scale(1)' : 'scale(1)',
                  }}
                >
                  <Icon
                    size={isActive ? 34 : 24}
                    strokeWidth={isActive ? 2.5 : 2}
                    aria-hidden="true"
                    className={clickAnim === index ? 'nav-click-anim' : ''}
                    style={{
                      color: isActive ? ACTIVE_COLOR : INACTIVE_ICON,
                      filter: isActive
                        ? 'drop-shadow(0 2px 8px rgba(37, 99, 235, 0.4))'
                        : 'none',
                      transition: 'all 320ms ease',
                    }}
                  />

                  {/* Cart badge */}
                  {isCart && cartCount > 0 && (
                    <span
                      aria-hidden="true"
                      className={badgePop ? 'nav-badge-anim' : ''}
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-8px',
                        minWidth: '20px',
                        height: '20px',
                        padding: '0 5px',
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.5), 0 0 0 2px rgba(255,255,255,0.9)',
                        zIndex: 2,
                      }}
                    >
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  aria-hidden="true"
                  style={{
                    fontSize: 'clamp(9px, 1vw + 7px, 11px)',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? ACTIVE_COLOR : '#94a3b8',
                    transition: 'all 320ms ease',
                    whiteSpace: 'nowrap',
                    textShadow: isActive ? '0 0 12px rgba(37, 99, 235, 0.3)' : 'none',
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
