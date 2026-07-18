import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Bell, Zap, TrendingUp, Sparkles, Megaphone, ChevronRight } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../components/ProductCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useData } from '../lib/data';
import { useStore } from '../store/StoreContext';
import { appConfig } from '../lib/config';
import { ikBanner } from '../lib/imagekit';
import { fetchActiveCampaigns } from '../lib/api';

export function HomePage() {
  const { t } = useTranslation();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);
  const navigate = useNavigate();
  const { state } = useStore();
  const { products, categories, banners, promoBanners } = useData();
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    fetchActiveCampaigns().then(data => { if (data) setCampaigns(data); });
  }, []);

  // Hero Slider logic...
  const goTo = useCallback((idx: number) => {
    setFadingOut(true);
    setTimeout(() => { setCurrentBanner(idx); setFadingOut(false); }, 320);
  }, []);

  const featured = products.filter(p => p.is_featured);
  const trending = products.filter(p => p.is_trending);
  const newArrivals = products.filter(p => p.is_new);
  const flashSale = products.filter(p => p.discount_price).slice(0, 4);

  return (
    <div className="page-transition pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 glass px-4 py-3">
        {/* ... Header content ... */}
      </header>

      <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto">
        
        {/* 1. উপরের ব্যানার (আগের থেকে দুই সাইজ ছোট) */}
        <section className="px-4 mt-4">
          <div className="banner-slider relative overflow-hidden rounded-3xl banner-glass" style={{ height: 'clamp(110px, 15vw, 150px)' }}>
             {/* Hero Banners Map... */}
          </div>
        </section>

        {/* 2. নিচের প্রমো ব্যানার (পুরো জায়গা ও বিশাল বোল্ড লেখা) */}
        <section className="px-4 mt-9">
          {promoBanners && promoBanners.length > 0 ? (
            <div className="flex flex-col gap-4">
              {promoBanners.map(b => (
                <div key={b.id} className="rounded-3xl relative overflow-hidden banner-glass aspect-[1200/140] w-full flex flex-col justify-center cursor-pointer p-8"
                  onClick={() => { if (b.button_link) navigate(b.button_link); }}>
                  <img src={ikBanner(b.mobile_image || b.desktop_image)} alt="" className="absolute inset-0 w-full h-full object-cover z-0" />
                  <div className="absolute inset-0 z-5" style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.85), transparent)' }} />
                  <div className="relative z-10">
                    <h3 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none mb-3">{b.title}</h3>
                    <p className="text-2xl md:text-4xl font-black text-white/95">{b.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl p-8 relative overflow-hidden banner-glass border border-[#00D1FF]/20">
              <h3 className="text-4xl font-black text-white uppercase mb-2">FREE DELIVERY</h3>
              <p className="text-2xl font-black text-white/90">On orders over ৳500</p>
            </div>
          )}
        </section>

        {/* 3. সব সেকশনের হেডিং বোল্ড করা */}
        <section className="px-4 mt-9">
          <h2 className="text-lg font-black text-white/90 mb-4 tracking-tight">{t('home.flashSale')}</h2>
          <div className="grid grid-cols-2 gap-3">
             {flashSale.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
        
      </div>
    </div>
  );
}
