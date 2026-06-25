import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronRight, ChevronLeft, Bell, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { ProductCard } from '../components/ProductCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { useData } from '../lib/data';
import { useStore } from '../store/StoreContext';
import { appConfig } from '../lib/config';

export function HomePage() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { state } = useStore();
  const { products, categories, banners } = useData();

  const goTo = useCallback((idx: number) => {
    setFadingOut(true);
    setTimeout(() => {
      setCurrentBanner(idx);
      setFadingOut(false);
    }, 320);
  }, []);

  const goNext = useCallback(() => {
    if (banners.length === 0) return;
    setCurrentBanner(prev => {
      const next = (prev + 1) % banners.length;
      goTo(next);
      return prev;
    });
  }, [banners.length, goTo]);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setFadingOut(true);
      setTimeout(() => {
        setCurrentBanner(prev => (prev + 1) % Math.max(banners.length, 1));
        setFadingOut(false);
      }, 320);
    }, 4500);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length > 1) startAutoplay();
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current); };
  }, [banners.length, startAutoplay]);

  const handleManualNav = (idx: number) => {
    if (idx === currentBanner) return;
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    goTo(idx);
    startAutoplay();
  };

  const handlePrev = () => {
    if (banners.length === 0) return;
    const idx = (currentBanner - 1 + banners.length) % banners.length;
    handleManualNav(idx);
  };

  const handleNext = () => {
    if (banners.length === 0) return;
    const idx = (currentBanner + 1) % banners.length;
    handleManualNav(idx);
  };

  const featured = products.filter(p => p.is_featured);
  const trending = products.filter(p => p.is_trending);
  const newArrivals = products.filter(p => p.is_new);
  const flashSale = products.filter(p => p.discount_price).slice(0, 4);

  return (
    <div className="page-transition pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <img src={appConfig.logo} alt="MIA ONE" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold neon-text">{appConfig.name}</h1>
              <p className="text-[9px] text-white/35 tracking-[0.2em] font-medium">EVERYTHING YOU NEED</p>
            </div>
          </div>
          <button className="relative w-10 h-10 rounded-2xl flex items-center justify-center glow-hover"
            style={{
              background: 'linear-gradient(135deg, rgba(255,138,0,0.08), rgba(255,46,201,0.08))',
              border: '1px solid rgba(255,138,0,0.12)',
            }}>
            <Bell size={18} className="text-white/60" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-mia-pink neon-pulse" />
          </button>
        </div>
        {/* Search bar — taps into full search page */}
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto relative">
          <button
            onClick={() => navigate('/search')}
            className="w-full flex items-center gap-3 pl-4 pr-4 py-3 rounded-2xl text-sm text-white/30 text-left transition-all hover:border-mia-orange/30"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Search size={16} className="text-white/25 shrink-0" />
            <span>Search products, brands...</span>
          </button>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        {/* Hero Banner Slider */}
          <section className="px-4 mt-4">
            <div className="banner-slider relative overflow-hidden rounded-3xl banner-glass" style={{ height: 'clamp(160px, 25vw, 220px)' }}>
              {banners.length === 0 ? (
                /* Fallback when no DB banners */
                <div className="absolute inset-0 flex flex-col justify-center px-6">
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #FF8A00, transparent)', animation: 'breathe-neon 4s ease-in-out infinite' }} />
                  <span className="text-2xl font-extrabold mb-1.5" style={{ color: '#FF8A00', textShadow: '0 0 20px #FF8A0040' }}>Flash Sale</span>
                  <p className="text-sm text-white/60 mb-4">Up to 50% Off on Top Products</p>
                  <button className="text-xs font-semibold px-5 py-2 rounded-xl w-fit transition-all hover:scale-105" style={{ backgroundColor: 'rgba(255,138,0,0.12)', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.3)' }}>
                    Shop Now
                  </button>
                </div>
              ) : (
                <>
                  {/* Slides — fade transition */}
                  {banners.map((banner, idx) => {
                    const isActive = idx === currentBanner;
                    const bgImage = banner.mobile_image || banner.desktop_image || banner.image_url || '';
                    const desktopImage = banner.desktop_image || banner.image_url || '';
                    return (
                      <div
                        key={banner.id}
                        className="absolute inset-0 transition-opacity duration-500"
                        style={{ opacity: isActive ? (fadingOut ? 0 : 1) : 0, pointerEvents: isActive ? 'auto' : 'none' }}
                      >
                        {/* Responsive background image */}
                        {(bgImage || desktopImage) && (
                          <>
                            {/* Mobile image */}
                            {bgImage && (
                              <img src={bgImage} alt={banner.title} className="absolute inset-0 w-full h-full object-cover md:hidden" />
                            )}
                            {/* Desktop image */}
                            {desktopImage && (
                              <img src={desktopImage} alt={banner.title} className="absolute inset-0 w-full h-full object-cover hidden md:block" />
                            )}
                            {/* Gradient overlay for text readability */}
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(9,11,20,0.75) 0%, rgba(9,11,20,0.3) 60%, transparent 100%)' }} />
                          </>
                        )}

                        {/* Ambient orbs when no image */}
                        {!bgImage && !desktopImage && (
                          <>
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl" style={{ background: `radial-gradient(circle, ${banner.color}, transparent)`, animation: 'breathe-neon 4s ease-in-out infinite' }} />
                            <div className="absolute bottom-0 left-1/3 w-20 h-20 rounded-full opacity-10 blur-2xl" style={{ background: `radial-gradient(circle, #00D1FF, transparent)`, animation: 'breathe-neon 5s ease-in-out infinite reverse' }} />
                          </>
                        )}

                        {/* Text content */}
                        <div className="absolute inset-0 flex flex-col justify-center px-6">
                          <span className="text-xl md:text-2xl font-extrabold mb-1.5 leading-tight" style={{ color: banner.color, textShadow: `0 0 24px ${banner.color}50` }}>
                            {banner.title}
                          </span>
                          {banner.subtitle && <p className="text-xs md:text-sm text-white/65 mb-4 max-w-xs">{banner.subtitle}</p>}
                          {banner.button_text && (
                            <button
                              onClick={() => { if (banner.button_link) window.open(banner.button_link, '_blank'); }}
                              className="text-xs font-semibold px-5 py-2 rounded-xl w-fit transition-all duration-300 hover:scale-105 active:scale-95"
                              style={{ backgroundColor: `${banner.color}18`, color: banner.color, border: `1px solid ${banner.color}35`, boxShadow: `0 4px 16px ${banner.color}20` }}
                            >
                              {banner.button_text}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Prev / Next arrows — visible on hover */}
                  {banners.length > 1 && (
                    <>
                      <button
                        onClick={handlePrev}
                        className="banner-nav-btn absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10"
                        style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
                        aria-label="Previous banner"
                      >
                        <ChevronLeft size={16} className="text-white/80" />
                      </button>
                      <button
                        onClick={handleNext}
                        className="banner-nav-btn absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10"
                        style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}
                        aria-label="Next banner"
                      >
                        <ChevronRight size={16} className="text-white/80" />
                      </button>
                    </>
                  )}

                  {/* Indicator dots */}
                  {banners.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {banners.map((banner, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleManualNav(idx)}
                          className="h-1.5 rounded-full transition-all duration-400"
                          style={{
                            width: idx === currentBanner ? '20px' : '6px',
                            background: idx === currentBanner ? `linear-gradient(90deg, ${banner.color}, ${banner.color}80)` : 'rgba(255,255,255,0.2)',
                            boxShadow: idx === currentBanner ? `0 0 8px ${banner.color}60` : 'none',
                          }}
                          aria-label={`Go to banner ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* Categories */}
          <section className="px-4 mt-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white/90 tracking-wide">Categories</h2>
              <button onClick={() => navigate('/categories')} className="text-xs text-mia-orange flex items-center gap-0.5 glow-hover font-medium">
                See All <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {categories.slice(0, 5).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/categories?selected=${cat.name}`)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className="w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-400 group-hover:scale-115 border"
                    style={{
                      width: '52px',
                      height: '52px',
                      backgroundColor: `${cat.color}08`,
                      borderColor: `${cat.color}15`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget;
                      el.style.boxShadow = `0 4px 20px ${cat.color}30, 0 0 30px ${cat.color}15`;
                      el.style.borderColor = `${cat.color}40`;
                      el.style.backgroundColor = `${cat.color}15`;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget;
                      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                      el.style.borderColor = `${cat.color}15`;
                      el.style.backgroundColor = `${cat.color}08`;
                    }}
                  >
                    <CategoryIcon name={cat.icon} size={22} style={{ color: cat.color }} />
                  </div>
                  <span className="text-[10px] text-white/50 text-center leading-tight font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Flash Sale */}
          <section className="px-4 mt-9">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.2)' }}>
                  <Zap size={14} className="text-mia-orange" />
                </div>
                <h2 className="text-sm font-bold text-white/90">Flash Sale</h2>
              </div>
              <span className="text-[10px] px-3 py-1 rounded-lg font-semibold neon-pulse"
                style={{ background: 'rgba(255,138,0,0.1)', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.2)' }}>
                Limited Time
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {flashSale.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>

          {/* Featured */}
          <section className="px-4 mt-9">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white/90">Featured Products</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {featured.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>

          {/* Offer Banner */}
          <section className="px-4 mt-9">
            <div className="rounded-3xl p-6 relative overflow-hidden banner-glass"
              style={{ border: '1px solid rgba(0,209,255,0.12)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 blur-3xl"
                style={{ background: 'radial-gradient(circle, #00D1FF, transparent)' }} />
              <h3 className="text-lg font-bold text-white mb-1.5">Free Delivery</h3>
              <p className="text-xs text-white/50 mb-4">On all orders above {appConfig.delivery.currency}{appConfig.delivery.freeDeliveryThreshold}</p>
              <button className="text-xs px-5 py-2 rounded-xl font-semibold transition-all hover:scale-105"
                style={{
                  background: 'rgba(0,209,255,0.1)',
                  color: '#00D1FF',
                  border: '1px solid rgba(0,209,255,0.25)',
                  boxShadow: '0 4px 12px rgba(0,209,255,0.1)',
                }}>
                Shop Now
              </button>
            </div>
          </section>

          {/* Trending */}
          <section className="px-4 mt-9">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,46,201,0.1)', border: '1px solid rgba(255,46,201,0.2)' }}>
                  <TrendingUp size={14} className="text-mia-pink" />
                </div>
                <h2 className="text-sm font-bold text-white/90">Trending Now</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {trending.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>

          {/* New Arrivals */}
          <section className="px-4 mt-9">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(123,44,255,0.1)', border: '1px solid rgba(123,44,255,0.2)' }}>
                  <Sparkles size={14} className="text-mia-purple" />
                </div>
                <h2 className="text-sm font-bold text-white/90">New Arrivals</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>

          {/* Recently Viewed */}
          {state.recentlyViewed.length > 0 && (
            <section className="px-4 mt-9">
              <h2 className="text-sm font-bold text-white/90 mb-4">Recently Viewed</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {state.recentlyViewed.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}
        </div>
    </div>
  );
}
