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
  const [isScrolled, setIsScrolled] = useState(false);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { state } = useStore();
  const { products, categories, banners, promoBanners } = useData();
  const [campaigns, setCampaigns] = useState<any[]>([]);

  // মেসেঞ্জার স্টাইল স্ক্রোল ইফেক্ট হ্যান্ডল করার জন্য লিসেনার
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className="page-transition pb-32 bg-gray-50/50 dark:bg-zinc-950 min-h-screen text-gray-900 dark:text-zinc-50 antialiased w-full">
      
      {/* 1. Messenger Style Sticky Header (লোগো নিজের জায়গায় লকড থাকে, স্ক্রোল করলে সার্চবার উপরে উঠে যায়) */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 dark:bg-zinc-950/95 border-b border-gray-100 dark:border-zinc-900 transition-all duration-300">
        <div className={`w-full px-4 mx-auto flex flex-col justify-center transition-all duration-300 ${isScrolled ? 'h-14' : 'h-28'}`}>
          
          {/* Top Bar: লোগো এবং মেইন অ্যাকশন বাটন যা সবসময় স্ক্রিনে নিজস্ব জায়গায় দৃশ্যমান থাকে */}
          <div className="flex items-center justify-between w-full relative z-10">
            {/* Logo বামে */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="relative w-8 h-8 shrink-0">
                <img src={appConfig.logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-base font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {appConfig.name}
              </h1>
            </div>

            {/* Action Icons ডানে - স্ক্রোল করলে লোগোর লাইনে সিঙ্কড হয়ে যাবে */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800/80 hover:opacity-80 transition-opacity cursor-pointer">
                <LanguageSwitcher variant="icon" />
              </div>
              
              <button 
                onClick={() => navigate('/notifications')} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800/80 relative transition-colors"
              >
                <Bell size={14} className="text-gray-600 dark:text-white/70" />
                <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              </button>
            </div>
          </div>

          {/* Bottom Bar: Search বার যা স্ক্রোল করলে উপরের দিকে ঠেলে উঠে অদৃশ্য হয়ে যাবে */}
          <div className={`w-full transition-all duration-300 origin-top overflow-hidden ${isScrolled ? 'h-0 opacity-0 mt-0 pointer-events-none' : 'h-10 opacity-100 mt-2'}`}>
            <div className="w-full relative">
              <button
                onClick={() => navigate('/search')}
                className="w-full flex items-center gap-3 pl-11 pr-4 py-2 rounded-full text-xs text-gray-400 dark:text-white/30 text-left bg-gray-100 dark:bg-zinc-900 border border-transparent hover:border-gray-200 dark:hover:border-white/5 transition-all duration-200"
              >
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25" />
                <span className="truncate">{t('home.searchPlaceholder')}</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* Main Content Layout - ডেস্কটপে ফুল স্ক্রিন এবং মোবাইলে হাফ/মিডিয়াম বাউন্ডিং */}
      <div className="w-full lg:max-w-none md:max-w-none max-w-lg mx-auto pt-32 md:pt-36 space-y-10">
        
        {/* 2. Hero Banner Slider */}
        <section className="w-full px-4 lg:px-8">
          <div className="banner-slider relative overflow-hidden rounded-3xl border border-white/5 shadow-md bg-zinc-900" style={{ height: 'clamp(180px, 28vw, 360px)' }}>
            {banners.length === 0 ? (
              <div className="absolute inset-0 flex flex-col justify-center px-8">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl bg-orange-500" />
                <span className="text-3xl font-extrabold mb-2 text-orange-500">{t('home.flashSaleTitle')}</span>
                <p className="text-sm text-white/60 mb-5">{t('home.flashSaleDesc')}</p>
                <button className="text-xs font-semibold px-6 py-2.5 rounded-xl w-fit bg-orange-500/10 text-orange-500 border border-orange-500/30">
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
                      <div className="absolute inset-0 flex flex-col justify-center px-8">
                        <span className="text-2xl md:text-4xl font-extrabold mb-2 leading-tight" style={{ color: banner.color, textShadow: `0 0 24px ${banner.color}50` }}>
                          {banner.title}
                        </span>
                        {banner.subtitle && <p className="text-xs md:text-base text-white/75 mb-5 max-w-md">{banner.subtitle}</p>}
                        {banner.button_text && (
                          <button
                            onClick={() => { if (banner.button_link) window.open(banner.button_link, '_blank'); }}
                            className="text-xs md:text-sm font-semibold px-6 py-2.5 rounded-xl w-fit transition-all duration-300 hover:scale-105 active:scale-95"
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
                    <button onClick={handlePrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center z-10 bg-black/40 border border-white/10 backdrop-blur-sm">
                      <ChevronLeft size={18} className="text-white/80" />
                    </button>
                    <button onClick={handleNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center z-10 bg-black/40 border border-white/10 backdrop-blur-sm">
                      <ChevronRight size={18} className="text-white/80" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* 3. Categories */}
        <section className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">{t('home.categories')}</h2>
            <button onClick={() => navigate('/categories')} className="text-xs text-orange-500 flex items-center gap-0.5 font-semibold">
              {t('common.seeAll')} <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {categories.slice(0, 10).map(cat => (
              <button key={cat.id} onClick={() => navigate(`/categories?selected=${cat.name}`)} className="flex flex-col items-center gap-2 group">
                <div className="rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 border"
                  style={{
                    width: '56px', height: '56px',
                    backgroundColor: `${cat.color}08`, borderColor: `${cat.color}15`,
                  }}
                >
                  <CategoryIcon name={cat.icon} size={24} style={{ color: cat.color }} />
                </div>
                <span className="text-[11px] text-gray-600 dark:text-white/50 text-center leading-tight font-medium max-w-full truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 4. Flash Sale */}
        <section className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-500/10 border border-orange-500/20">
                <Zap size={14} className="text-orange-500" />
              </div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white/90">{t('home.flashSale')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {flashSale.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* 5. Featured Products */}
        <section className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-800 dark:text-white/90">{t('home.featured')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featured.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* 6. Trending Products */}
        <section className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-pink-500/10 border border-pink-500/20">
                <TrendingUp size={14} className="text-pink-500" />
              </div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white/90">{t('home.trending')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {trending.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* 7. New Arrivals */}
        <section className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/10 border border-purple-500/20">
                <Sparkles size={14} className="text-purple-500" />
              </div>
              <h2 className="text-base font-bold text-gray-800 dark:text-white/90">{t('home.newArrivals')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* 8. Recently Viewed */}
        {state.recentlyViewed.length > 0 && (
          <section className="w-full px-4 lg:px-8">
            <h2 className="text-base font-bold text-gray-800 dark:text-white/90 mb-4">{t('home.recentlyViewed')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {state.recentlyViewed.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* 9. Promo Banner (সাইজ ২-৩ গুণ বাড়িয়ে হিরো ব্যানারের ঠিক সামঞ্জস্যপূর্ণ করা হয়েছে) */}
        <section className="w-full px-4 lg:px-8 pt-4 pb-6">
          {promoBanners && promoBanners.length > 0 ? (
            <div className="flex flex-col gap-6">
              {promoBanners.map(b => {
                const pImg = b.mobile_image || b.desktop_image || b.image_url || '';
                return (
                  <div key={b.id} className="rounded-[32px] relative overflow-hidden backdrop-blur-md bg-white/5 dark:bg-black/30 border border-white/10 dark:border-zinc-800/60 shadow-xl aspect-[1200/260] w-full flex flex-col justify-center cursor-pointer group transition-transform duration-300 active:scale-[0.99]"
                    onClick={() => { if (b.button_link) navigate(b.button_link); }}>
                    {pImg && (
                      <>
                        <img src={ikBanner(pImg)} alt="" className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-500 group-hover:scale-102" />
                        <div className="absolute inset-0 z-5 bg-gradient-to-r from-black/85 via-black/40 to-transparent" />
                      </>
                    )}
                    <div className="relative z-10 px-8 md:px-12 flex items-center justify-between gap-6">
                      <div className="max-w-[75%]">
                        <h3 className="text-base sm:text-xl md:text-2xl font-black text-white mb-1.5 truncate tracking-wide">{b.title}</h3>
                        {b.subtitle && <p className="text-xs sm:text-sm text-white/80 mb-0 truncate font-medium">{b.subtitle}</p>}
                      </div>
                      {b.button_text && (
                        <button className="text-xs md:text-sm px-6 py-2.5 rounded-full font-bold shrink-0 transition-all shadow-md group-hover:brightness-110"
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
            /* Fallback Dynamic Size Premium Glass Banner */
            <div className="rounded-[32px] p-8 md:p-12 relative overflow-hidden backdrop-blur-md bg-white/40 dark:bg-zinc-900/40 border border-white/20 dark:border-zinc-800/40 shadow-sm transition-all duration-300 aspect-[1200/260] flex items-center">
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-15 blur-2xl bg-cyan-500" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 w-full">
                <div>
                  <h3 className="text-lg md:text-2xl font-black text-slate-800 dark:text-white mb-1">{t('home.freeDelivery')}</h3>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-white/70 font-medium">{t('home.freeDeliveryDesc')} {appConfig.delivery.currency}{appConfig.delivery.freeDeliveryThreshold}</p>
                </div>
                <button className="text-xs md:text-sm px-6 py-2.5 rounded-full font-bold transition-all bg-cyan-500/10 text-cyan-500 border border-cyan-500/25 shadow-sm hover:bg-cyan-500/20 w-fit">
                  {t('home.shopNow')}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 10. Special Campaigns Section */}
        {campaigns.length > 0 && (
          <section className="w-full px-4 lg:px-8 pb-16">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={16} className="text-orange-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">Special Campaigns</h3>
            </div>
            <div className="space-y-4">
              {campaigns.map(c => (
                <div key={c.id} className="rounded-3xl overflow-hidden relative group cursor-pointer border border-orange-500/15"
                  onClick={() => navigate('/')}>
                  {c.banner_url ? (
                    <img src={ikBanner(c.banner_url)} alt={c.name} className="w-full h-36 sm:h-48 object-cover transition-transform duration-500 group-hover:scale-101" />
                  ) : (
                    <div className="w-full h-36 flex items-center justify-center p-6 bg-gradient-to-r from-orange-500/5 to-pink-500/5">
                      <div className="text-center">
                        <h4 className="text-lg font-bold text-gray-800 dark:text-white">{c.name}</h4>
                        {c.discount_value > 0 && (
                          <p className="text-2xl font-black text-orange-500 mt-1">
                            {c.discount_type === 'percentage' ? `${c.discount_value}% OFF` : `৳${c.discount_value} OFF`}
                          </p>
                        )}
                      </div>
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
