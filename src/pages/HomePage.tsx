import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronRight, ChevronLeft, Bell, Zap, TrendingUp, Sparkles, Megaphone, Globe } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../components/ProductCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useData } from '../lib/data';
import { useStore } from '../store/StoreContext';
import { appConfig } from '../lib/config';
import { ikThumb, ikBanner } from '../lib/imagekit';
import { fetchActiveCampaigns } from '../lib/api';

export function HomePage() {
  const { t } = useTranslation();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { state } = useStore();
  const { products, categories, banners, promoBanners } = useData();
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveCampaigns().then(data => { if (data) setCampaigns(data); });
  }, []);

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
    <div className="page-transition pb-32 bg-gray-50/50 dark:bg-zinc-950 min-h-screen text-gray-900 dark:text-zinc-50 antialiased">
      
      {/* 1. Floating Capsule Header (Messenger/Facebook Style) */}
      <header className="fixed top-4 left-0 right-0 z-50 px-4 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        <div className="backdrop-blur-md bg-white/70 dark:bg-black/70 border border-white/20 dark:border-zinc-800/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.08)] rounded-full px-4 py-2 flex items-center justify-between gap-4 transition-all duration-300">
          
          {/* Logo বামে */}
          <div className="flex items-center gap-2 pl-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="relative w-8 h-8 shrink-0">
              <img src={appConfig.logo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-base font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:block">
              {appConfig.name}
            </h1>
          </div>

          {/* বড় গোলাকার Pill-shaped Search Bar মাঝখানে */}
          <div className="flex-1 relative">
            <button
              onClick={() => navigate('/search')}
              className="w-full flex items-center gap-3 pl-11 pr-4 py-2 rounded-full text-xs text-gray-400 dark:text-white/30 text-left bg-gray-100/80 dark:bg-zinc-800/60 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all duration-200"
            >
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25" />
              <span className="truncate">{t('home.searchPlaceholder')}</span>
            </button>
          </div>

          {/* Action Icons ডানে (Circular Buttons) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100/80 hover:bg-gray-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer">
              <LanguageSwitcher variant="icon" />
            </div>
            
            <button 
              onClick={() => navigate('/notifications')} 
              className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100/80 hover:bg-gray-200/80 dark:bg-zinc-800/60 dark:hover:bg-zinc-700/60 relative transition-colors"
            >
              <Bell size={15} className="text-gray-600 dark:text-white/60" />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Body - Added padding-top to compensate for Floating Header */}
      <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto pt-24 space-y-9">
        
        {/* 2. Hero Banner Slider */}
        <section className="px-4">
          <div className="banner-slider relative overflow-hidden rounded-3xl border border-white/10 shadow-lg bg-zinc-900" style={{ height: 'clamp(160px, 25vw, 220px)' }}>
            {banners.length === 0 ? (
              <div className="absolute inset-0 flex flex-col justify-center px-6">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-3xl bg-orange-500" />
                <span className="text-2xl font-extrabold mb-1.5 text-orange-500">{t('home.flashSaleTitle')}</span>
                <p className="text-sm text-white/60 mb-4">{t('home.flashSaleDesc')}</p>
                <button className="text-xs font-semibold px-5 py-2 rounded-xl w-fit bg-orange-500/10 text-orange-500 border border-orange-500/30">
                  {t('home.shopNow')}
                </button>
              </div>
            ) : (
              <>
                {banners.map((banner, idx) => {
                  const isActive = idx === currentBanner;
                  const bgImage = ikBanner(banner.mobile_image || banner.desktop_image || banner.image_url || '');
                  const desktopImage = ikBanner(banner.desktop_image || banner.image_url || '');
                  return (
                    <div
                      key={banner.id}
                      className="absolute inset-0 transition-opacity duration-500"
                      style={{ opacity: isActive ? (fadingOut ? 0 : 1) : 0, pointerEvents: isActive ? 'auto' : 'none' }}
                    >
                      {bgImage && (
                        <img src={bgImage} alt={banner.title} className="absolute inset-0 w-full h-full object-cover md:hidden" />
                      )}
                      {desktopImage && (
                        <img src={desktopImage} alt={banner.title} className="absolute inset-0 w-full h-full object-cover hidden md:block" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                      <div className="absolute inset-0 flex flex-col justify-center px-6">
                        <span className="text-xl md:text-2xl font-extrabold mb-1.5 leading-tight" style={{ color: banner.color, textShadow: `0 0 24px ${banner.color}50` }}>
                          {banner.title}
                        </span>
                        {banner.subtitle && <p className="text-xs md:text-sm text-white/75 mb-4 max-w-xs">{banner.subtitle}</p>}
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

                {banners.length > 1 && (
                  <>
                    <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 bg-black/40 border border-white/10 backdrop-blur-sm" aria-label="Previous banner">
                      <ChevronLeft size={16} className="text-white/80" />
                    </button>
                    <button onClick={handleNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 bg-black/40 border border-white/10 backdrop-blur-sm" aria-label="Next banner">
                      <ChevronRight size={16} className="text-white/80" />
                    </button>
                  </>
                )}

                {banners.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {banners.map((banner, idx) => (
                      <button key={idx} onClick={() => handleManualNav(idx)} className="h-1.5 rounded-full transition-all duration-400"
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

        {/* 3. Categories */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">{t('home.categories')}</h2>
            <button onClick={() => navigate('/categories')} className="text-xs text-orange-500 flex items-center gap-0.5 font-semibold hover:opacity-80 transition-opacity">
              {t('common.seeAll')} <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {categories.slice(0, 5).map(cat => (
              <button key={cat.id} onClick={() => navigate(`/categories?selected=${cat.name}`)} className="flex flex-col items-center gap-2 group">
                <div className="w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 border"
                  style={{
                    width: '52px', height: '52px',
                    backgroundColor: `${cat.color}08`, borderColor: `${cat.color}15`,
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget;
                    el.style.boxShadow = `0 4px 20px ${cat.color}25`;
                    el.style.borderColor = `${cat.color}35`; el.style.backgroundColor = `${cat.color}12`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget;
                    el.style.boxShadow = 'none';
                    el.style.borderColor = `${cat.color}15`; el.style.backgroundColor = `${cat.color}08`;
                  }}
                >
                  <CategoryIcon name={cat.icon} size={22} style={{ color: cat.color }} />
                </div>
                <span className="text-[10px] text-gray-600 dark:text-white/50 text-center leading-tight font-medium max-w-full truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 4. Flash Sale */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-500/10 border border-orange-500/20">
                <Zap size={14} className="text-orange-500" />
              </div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-white/90">{t('home.flashSale')}</h2>
            </div>
            <span className="text-[10px] px-3 py-1 rounded-full font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20 animate-pulse">
              {t('home.limitedTime')}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {flashSale.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* 5. Featured Products */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white/90">{t('home.featured')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {featured.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* 6. Trending Products */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-pink-500/10 border border-pink-500/20">
                <TrendingUp size={14} className="text-pink-500" />
              </div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-white/90">{t('home.trending')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {trending.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* 7. New Arrivals */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/10 border border-purple-500/20">
                <Sparkles size={14} className="text-purple-500" />
              </div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-white/90">{t('home.newArrivals')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* 8. Recently Viewed */}
        {state.recentlyViewed.length > 0 && (
          <section className="px-4">
            <h2 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-4">{t('home.recentlyViewed')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {state.recentlyViewed.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* 9. Promo Banner (সব Product Section-এর শেষে এবং Footer-এর ঠিক আগে পর্যাপ্ত মার্জিনসহ) */}
        <section className="px-4 pt-4 pb-12">
          {promoBanners && promoBanners.length > 0 ? (
            <div className="flex flex-col gap-4">
              {promoBanners.map(b => {
                const pImg = b.mobile_image || b.desktop_image || b.image_url || '';
                return (
                  <div key={b.id} className="rounded-[28px] md:rounded-[32px] relative overflow-hidden backdrop-blur-md bg-white/5 dark:bg-black/30 border border-white/20 dark:border-zinc-800/60 shadow-lg aspect-[1200/140] w-full flex flex-col justify-center cursor-pointer group transition-transform duration-300 active:scale-[0.99]"
                    onClick={() => { if (b.button_link) navigate(b.button_link); }}>
                    {pImg && (
                      <>
                        <img src={ikBanner(pImg)} alt="" className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-102" />
                        <div className="absolute inset-0 z-5 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
                      </>
                    )}
                    <div className="relative z-10 px-6 md:px-8 flex items-center justify-between gap-4">
                      <div className="max-w-[70%]">
                        <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-white mb-0.5 truncate tracking-wide">{b.title}</h3>
                        {b.subtitle && <p className="text-[10px] md:text-xs text-white/80 mb-0 truncate font-medium">{b.subtitle}</p>}
                      </div>
                      {b.button_text && (
                        <button className="text-[9px] md:text-[11px] px-4 py-1.5 rounded-full font-bold shrink-0 transition-all shadow-sm group-hover:brightness-110"
                          style={{
                            background: b.color ? `${b.color}22` : 'rgba(0,209,255,0.15)',
                            color: b.color || '#00D1FF',
                            border: `1px solid ${b.color ? b.color + '55' : 'rgba(0,209,255,0.4)'}`,
                          }}>
                          {b.button_text}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Fallback Static Slim Premium Glass Banner */
            <div className="rounded-[28px] md:rounded-[32px] p-5 md:p-6 relative overflow-hidden backdrop-blur-md bg-white/40 dark:bg-zinc-900/40 border border-white/20 dark:border-zinc-800/40 shadow-sm transition-all duration-300">
              <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full opacity-15 blur-2xl bg-cyan-500" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <h3 className="text-sm md:text-base font-extrabold text-slate-800 dark:text-white mb-0.5">{t('home.freeDelivery')}</h3>
                  <p className="text-xs text-slate-600 dark:text-white/70 font-medium">{t('home.freeDeliveryDesc')} {appConfig.delivery.currency}{appConfig.delivery.freeDeliveryThreshold}</p>
                </div>
                <button className="text-xs px-5 py-2 rounded-full font-bold transition-all bg-cyan-500/10 text-cyan-500 border border-cyan-500/25 shadow-sm hover:bg-cyan-500/20 w-fit">
                  {t('home.shopNow')}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 10. Special Campaigns Section (এটিও প্রোডাক্টের নিচে প্রোমো ব্যানারের ঠিক সাথে মানানসইভাবে সাজানো) */}
        {campaigns.length > 0 && (
          <section className="px-4 pb-12 -mt-4">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={16} className="text-orange-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">Special Campaigns</h3>
            </div>
            <div className="space-y-3">
              {campaigns.map(c => (
                <div key={c.id} className="rounded-3xl overflow-hidden relative group cursor-pointer border border-orange-500/15"
                  onClick={() => navigate('/')}>
                  {c.banner_url ? (
                    <img src={ikBanner(c.banner_url)} alt={c.name} className="w-full h-32 sm:h-40 object-cover transition-transform duration-500 group-hover:scale-101" />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center p-4 bg-gradient-to-r from-orange-500/5 to-pink-500/5">
                      <div className="text-center">
                        <h4 className="text-base font-bold text-gray-800 dark:text-white">{c.name}</h4>
                        {c.discount_value > 0 && (
                          <p className="text-xl font-black text-orange-500 mt-1">
                            {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `৳${c.discount_value} OFF`}
                          </p>
                        )}
                        {c.coupon_code && (
                          <p className="text-[11px] text-gray-400 dark:text-white/40 mt-1.5 font-mono bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md inline-block">Code: {c.coupon_code}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {c.banner_url && c.discount_value > 0 && (
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-md">
                      {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `৳${c.discount_value} OFF`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
