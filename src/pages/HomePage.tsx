import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronRight, Zap, TrendingUp, Sparkles, Megaphone, Search, Bell, User } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../components/ProductCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { useData } from '../lib/data';
import { appConfig } from '../lib/config';
import { ikBanner } from '../lib/imagekit';
import { fetchActiveCampaigns } from '../lib/api';

export function HomePage() {
  const { t, i18n } = useTranslation();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  
  // টাচ স্ক্রোল (Swipe) ট্র্যাকিং স্টেট
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
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
    }, 250);
  }, []);

  const startAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    autoplayRef.current = setInterval(() => {
      setFadingOut(true);
      setTimeout(() => {
        setCurrentBanner(prev => (prev + 1) % Math.max(banners.length, 1));
        setFadingOut(false);
      }, 250);
    }, 5000);
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

  // হাত দিয়ে ব্যানার স্ক্রোল (Swipe) হ্যান্ডলার
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const featured = products.filter(p => p.is_featured);
  const trending = products.filter(p => p.is_trending);
  const newArrivals = products.filter(p => p.is_new);
  const flashSale = products.filter(p => p.discount_price).slice(0, 4);

  // কারেন্ট ল্যাঙ্গুয়েজ অনুযায়ী নাম নির্ধারণ (fallback সহ)
  const appName = i18n.language === 'bn' ? 'মিয়া ওয়ান' : 'Miya One';

  return (
    <div className="page-transition pb-32 bg-white dark:bg-zinc-950 min-h-screen text-slate-900 dark:text-zinc-50 antialiased w-full relative">
      
      {/* ১. ১০০% লকড ও ফিক্সড হেডার (যেকোনো স্ক্রোলেই এটি স্ক্রিনের ওপরে স্টপ হয়ে থাকবে) */}
      <header 
        className="fixed top-0 left-0 right-0 w-full bg-white dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-900 shadow-sm h-16"
        style={{ zIndex: 9999, position: 'fixed' }}
      >
        <div className="w-full h-full px-4 mx-auto flex items-center justify-between gap-3">
          
          {/* লোগো এবং ডাইনামিক নাম (ভাষা অনুযায়ী বাংলা/ইংলিশ পরিবর্তন হবে) */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => navigate('/')}>
            <img src={appConfig.logo} alt="Logo" className="w-7 h-7 object-contain" />
            <h1 className="text-sm font-black tracking-tight text-slate-950 dark:text-white block">
              {appName}
            </h1>
          </div>

          {/* সার্চ বার */}
          <div className="flex-1 max-w-md relative">
            <input 
              type="text" 
              placeholder={t('common.search', 'Search...')} 
              className="w-full h-9 pl-9 pr-3 rounded-full bg-slate-100 dark:bg-zinc-900 text-xs font-bold text-slate-950 dark:text-white focus:outline-none border border-transparent focus:border-slate-200"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* নোটিফিকেশন এবং প্রোফাইল আইকন */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-900 text-slate-950 dark:text-white">
              <Bell size={16} />
            </button>
            <button className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-zinc-900 text-slate-950 dark:text-white">
              <User size={16} />
            </button>
          </div>

        </div>
      </header>

      {/* মেইন কন্টেন্ট এরিয়া (লক হেডারের নিচে থাকার জন্য এবং কন্টেন্ট এর ওপর হেডার ফিক্সড রাখার জন্য প্যাডিং ও z-index সেট করা) */}
      <div className="w-full lg:max-w-none md:max-w-none max-w-lg mx-auto pt-20 space-y-10 relative z-10">
        
        {/* ২. হিরো ব্যানার স্লাইডার (কোনো চেঞ্জিং আইকন/বাটন নেই, সম্পূর্ণ টাচ সোয়াইপ এবং রিয়েল কালার) */}
        <section className="w-full px-4 lg:px-8">
          <div 
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            className="banner-slider relative overflow-hidden rounded-3xl border border-slate-100 dark:border-white/5 bg-slate-50 cursor-grab active:cursor-grabbing" 
            style={{ height: 'clamp(185px, 28vw, 360px)' }}
          >
            {banners.length === 0 ? (
              <div className="absolute inset-0 flex flex-col justify-center px-8">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-20 blur-3xl bg-orange-500" />
                <span className="text-3xl font-extrabold mb-2 text-orange-500">{t('home.flashSaleTitle')}</span>
                <p className="text-sm text-slate-700 mb-5 font-bold">{t('home.flashSaleDesc')}</p>
                <button className="text-xs font-bold px-6 py-2.5 rounded-xl w-fit bg-orange-500 text-white shadow-sm">
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
                      className="absolute inset-0 transition-opacity duration-300"
                      style={{ opacity: isActive ? (fadingOut ? 0 : 1) : 0, pointerEvents: isActive ? 'auto' : 'none' }}
                    >
                      {bgImage && (
                        <img src={bgImage} alt={banner.title} className="absolute inset-0 w-full h-full object-cover md:hidden" />
                      )}
                      {desktopImage && (
                        <img src={desktopImage} alt={banner.title} className="absolute inset-0 w-full h-full object-cover hidden md:block" />
                      )}
                      
                      {/* কোনো ডার্ক ওভারলে বা গ্রেডিয়েন্ট কালার নেই, টেক্সটগুলো সম্পূর্ণ হাই-কনট্রাস্ট ও স্পষ্ট */}
                      <div className="absolute inset-0 flex flex-col justify-center px-8 z-10">
                        <span className="text-2xl md:text-4xl font-black mb-2 leading-tight text-slate-950 dark:text-white">
                          {banner.title}
                        </span>
                        {banner.subtitle && <p className="text-xs md:text-base text-slate-800 dark:text-zinc-200 font-black max-w-md">{banner.subtitle}</p>}
                      </div>
                    </div>
                  );
                })}

                {/* ইন্ডিকেটর ডটস */}
                {banners.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {banners.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentBanner ? 'w-4 bg-slate-950 dark:bg-white' : 'w-1.5 bg-slate-300 dark:bg-white/30'}`} 
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ক্যাটাগরি সেকশন */}
        <section className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white/70">{t('home.categories')}</h2>
            <button onClick={() => navigate('/categories')} className="text-xs text-orange-600 dark:text-orange-500 flex items-center gap-0.5 font-black">
              {t('common.seeAll')} <ChevronRight size={12} />
            </button>
          </div>
          <div className="grid grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {categories.slice(0, 10).map(cat => (
              <button key={cat.id} onClick={() => navigate(`/categories?selected=${cat.name}`)} className="flex flex-col items-center gap-2 group">
                <div className="rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 border border-slate-200 dark:border-zinc-800"
                  style={{
                    width: '56px', height: '56px',
                    backgroundColor: `${cat.color}08`,
                  }}
                >
                  <CategoryIcon name={cat.icon} size={24} style={{ color: cat.color }} />
                </div>
                <span className="text-[11px] text-slate-950 dark:text-white text-center leading-tight font-black max-w-full truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ফ্ল্যাশ সেল */}
        <section className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-orange-500/10 border border-orange-500/20">
                <Zap size={14} className="text-orange-500" />
              </div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">{t('home.flashSale')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {flashSale.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* ফিচার্ড পণ্য */}
        <section className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-black text-slate-950 dark:text-white">{t('home.featured')}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {featured.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* ট্রেন্ডিং পণ্য */}
        <section className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-pink-500/10 border border-pink-500/20">
                <TrendingUp size={14} className="text-pink-500" />
              </div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">{t('home.trending')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {trending.slice(0, 6).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* নতুন আগমন */}
        <section className="w-full px-4 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-500/10 border border-purple-500/20">
                <Sparkles size={14} className="text-purple-500" />
              </div>
              <h2 className="text-base font-black text-slate-950 dark:text-white">{t('home.newArrivals')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* ৮. প্রোমো ব্যানার (মোবাইলে বড় সাইজ এবং ওপরে কোনো কালার ওভারলে বা চেঞ্জিং আইকন নেই) */}
        <section className="w-full px-4 lg:px-8 pt-4 pb-6">
          {promoBanners && promoBanners.length > 0 ? (
            <div className="flex flex-col gap-6">
              {promoBanners.map(b => {
                const pImg = b.mobile_image || b.desktop_image || b.image_url || '';
                return (
                  <div key={b.id} className="rounded-[32px] relative overflow-hidden bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/60 aspect-[1200/400] md:aspect-[1200/260] w-full flex flex-col justify-center cursor-pointer group"
                    onClick={() => { if (b.button_link) navigate(b.button_link); }}>
                    {pImg && (
                      <img src={ikBanner(pImg)} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
                    )}
                    
                    {/* কোনো ডার্ক ফিল্টার বা বাটন আইকন নেই - লেখা ও ছবি একদম ক্রিস্টাল ক্লিয়ার */}
                    <div className="relative z-10 px-6 md:px-12 flex items-center justify-between gap-6">
                      <div className="max-w-[70%]">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-950 dark:text-white mb-2 tracking-wide">{b.title}</h3>
                        {b.subtitle && <p className="text-base sm:text-lg md:text-xl font-black text-orange-600 dark:text-orange-400 mt-1 tracking-wider">{b.subtitle}</p>}
                      </div>
                      {b.button_text && (
                        <button className="text-xs md:text-sm px-6 py-2.5 rounded-full font-black shrink-0 bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm">
                          {b.button_text}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ফলব্যাক প্রিমিয়াম ব্যানার - টাকার টেক্সট ও ফন্ট সাইজ অনেক বড় ও স্পষ্ট */
            <div className="rounded-[32px] p-6 md:p-12 relative overflow-hidden bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/60 aspect-[1200/400] md:aspect-[1200/260] flex items-center">
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full opacity-20 blur-2xl bg-cyan-500" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10 w-full">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white mb-1.5">{t('home.freeDelivery')}</h3>
                  <p className="text-xl md:text-3xl text-orange-600 dark:text-orange-400 font-black tracking-wide">
                    {appConfig.delivery.currency}{appConfig.delivery.freeDeliveryThreshold}
                  </p>
                </div>
                <button className="text-xs md:text-sm px-6 py-3 rounded-full font-black bg-slate-950 text-white dark:bg-white dark:text-slate-950 shadow-sm w-fit">
                  {t('home.shopNow')}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ৯. স্পেশাল ক্যাম্পেইন সেকশন */}
        {campaigns.length > 0 && (
          <section className="w-full px-4 lg:px-8 pb-16">
            <div className="flex items-center gap-2 mb-4">
              <Megaphone size={16} className="text-orange-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 dark:text-white/70">Special Campaigns</h3>
            </div>
            <div className="space-y-4">
              {campaigns.map(c => (
                <div key={c.id} className="rounded-3xl overflow-hidden relative group cursor-pointer border border-slate-200 dark:border-orange-500/15" onClick={() => navigate('/')}>
                  {c.banner_url && (
                    <img src={ikBanner(c.banner_url)} alt={c.name} className="w-full h-36 sm:h-48 object-cover" />
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
