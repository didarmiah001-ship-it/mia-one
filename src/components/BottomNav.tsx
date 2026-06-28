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
  const [dimensions, setDimensions] = useState({ bubbleSize: 70, navHeight: 62 });

  const updateDimensions = useCallback(() => {
    const width = window.innerWidth;
    const bubbleSize = width < 640 ? 70 : width < 1024 ? 74 : 78;
    const navHeight = width < 640 ? 62 : width < 1024 ? 66 : 70;
    setDimensions({ bubbleSize, navHeight });
  }, []);

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
      <div aria-hidden="true" style={{ height: `calc(${navHeight + 50}px + env(safe-area-inset-bottom, 0px))` }} />

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
          className="relative flex items-center justify-around"
          style={{
            width: 'auto',
            minWidth: '280px',
            maxWidth: '420px',
            height: `${navHeight}px`,
            padding: `0 ${NAV_PADDING}px`,
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(28px) saturate(2)',
            WebkitBackdropFilter: 'blur(28px) saturate(2)',
            border: '1.5px solid rgba(255, 255, 255, 0.85)',
            boxShadow: `
              0 10px 40px rgba(37, 99, 235, 0.15),
              0 4px 20px rgba(0, 0, 0, 0.08),
              0 0 0 1px rgba(255, 255, 255, 0.2),
              inset 0 2px 0 rgba(255, 255, 255, 0.9),
              inset 0 -2px 0 rgba(0, 0, 0, 0.02)
            `,
            pointerEvents: 'auto',
          }}
        >
          {/* Sliding active bubble with blue neon glow */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              width: `${bubbleSize}px`,
              height: `${bubbleSize}px`,
              borderRadius: '50%',
              background: 'linear-gradient(145deg, #ffffff 0%, #f0f6ff 30%, #e0ecff 70%, #d4e4ff 100%)',
              top: '50%',
              left: bubbleLeft,
              transform: 'translate(-50%, -50%)',
              transition: 'left 250ms cubic-bezier(0.34, 1.2, 0.64, 1)',
              zIndex: 0,
              willChange: 'left',
              marginLeft: `-${NAV_PADDING}px`,
              boxShadow: `
                0 0 20px rgba(37, 99, 235, 0.35),
                0 0 40px rgba(37, 99, 235, 0.2),
                0 4px 12px rgba(37, 99, 235, 0.25),
                inset 0 2px 4px rgba(255, 255, 255, 0.95),
                inset 0 -2px 4px rgba(37, 99, 235, 0.08)
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
                  width: `${bubbleSize - 8}px`,
                  height: `${bubbleSize - 8}px`,
                  zIndex: 1,
                  transition: 'transform 250ms cubic-bezier(0.34, 1.2, 0.64, 1)',
                  transform: clickAnim === index ? 'scale(0.92)' : 'scale(1)',
                }}
              >
                <div
                  className="flex items-center justify-center relative"
                  style={{
                    transition: 'all 250ms cubic-bezier(0.34, 1.2, 0.64, 1)',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <Icon
                    size={isActive ? 30 : 24}
                    strokeWidth={isActive ? 2.5 : 2}
                    aria-hidden="true"
                    style={{
                      color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                      filter: isActive
                        ? 'drop-shadow(0 2px 10px rgba(37, 99, 235, 0.5))'
                        : 'none',
                      transition: 'all 250ms ease',
                    }}
                  />

                  {/* Cart badge */}
                  {isCart && cartCount > 0 && (
                    <span
                      aria-hidden="true"
                      className={badgePop ? 'nav-badge-anim' : ''}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-10px',
                        minWidth: '18px',
                        height: '18px',
                        padding: '0 5px',
                        borderRadius: '999px',
                        background: 'linear-gradient(135deg, #2563EB, #1d4ed8)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(37, 99, 235, 0.5), 0 0 0 2px rgba(255,255,255,0.95)',
                        zIndex: 2,
                        transform: badgePop ? 'scale(1.2)' : 'scale(1)',
                        transition: 'transform 200ms ease',
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
