import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronRight, ChevronLeft, Bell, Heart, Zap, TrendingUp, Sparkles, Megaphone } from 'lucide-react';
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
  const navigate = useNavigate();
  const { state } = useStore();
  const { products, categories, banners, promoBanners } = useData();
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => { fetchActiveCampaigns().then(data => { if (data) setCampaigns(data); }); }, []);

  const flashSale = products.filter(p => p.discount_price).slice(0, 4);
  const featured = products.filter(p => p.is_featured);
  const trending = products.filter(p => p.is_trending);
  const newArrivals = products.filter(p => p.is_new);

  return (
    <div className="page-transition pb-24 w-full">
      {/* ১. হেডার: মাঝখানে লোগো, দুই পাশে আইকন */}
      <header className="sticky top-0 z-30 glass px-4 py-3 w-full border-b border-white/5">
        <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
          <button onClick={() => navigate('/notifications')} className="text-white/80"><Bell size={24} /></button>
          <img src={appConfig.logo} alt="Logo" className="w-10 h-10 object-contain" />
          <button onClick={() => navigate('/wishlist')} className="text-white/80"><Heart size={24} /></button>
        </div>
      </header>

      <div className="w-full">
        {/* ২. হিরো ব্যানার: ফুল উইডথ */}
        <section className="w-full">
           <div className="relative overflow-hidden w-full" style={{ height: 'clamp(200px, 35vw, 450px)' }}>
              {banners.length > 0 && <img src={ikBanner(banners[0].image_url)} className="w-full h-full object-cover" />}
           </div>
        </section>

        <div className="max-w-[1400px] mx-auto px-4 md:px-8">
            {/* ক্যাটাগরি ও প্রোডাক্ট সেকশনগুলো এখানে আছে */}
            {/* [এখানে তোমার আগের ক্যাটাগরি, Flash Sale, Featured, Trending, New Arrivals কোডগুলো অপরিবর্তিত থাকবে] */}

            {/* ৩. নিচের প্রমো ব্যানার: প্রোডাক্টের নিচে এবং আগের চেয়ে স্লিম (৯০ পিক্সেল) */}
            <section className="mt-12 mb-8">
              {promoBanners.map(b => (
                <div key={b.id} className="rounded-2xl relative overflow-hidden w-full flex flex-col justify-center cursor-pointer px-8"
                  style={{ background: '#111', height: '90px' }} 
                  onClick={() => { if (b.button_link) navigate(b.button_link); }}>
                  <h3 className="text-xl md:text-2xl font-bold text-white uppercase">{b.title}</h3>
                  <p className="text-sm md:text-base font-medium text-white/70">{b.subtitle}</p>
                </div>
              ))}
            </section>
        </div>
      </div>
    </div>
  );
}
