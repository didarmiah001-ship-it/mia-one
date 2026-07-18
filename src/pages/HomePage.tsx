import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, ChevronRight, Bell, Zap, TrendingUp, Sparkles, Megaphone } from 'lucide-react';
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

  return (
    <div className="page-transition pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 glass px-4 py-3">
         {/* তোমার আগের হেডার কোড */}
         <div className="max-w-lg mx-auto flex items-center justify-between mb-3">
             <h1 className="text-lg font-black">{appConfig.name}</h1>
             <LanguageSwitcher variant="icon" />
         </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* ১. হিরো ব্যানার */}
        <section className="px-4 mt-4">
           <div className="relative overflow-hidden rounded-3xl" style={{ height: '150px' }}>
              {banners.length > 0 && <img src={ikBanner(banners[0].image_url)} className="w-full h-full object-cover" />}
           </div>
        </section>

        {/* ২. ক্যাটাগরি (যা চইলা গেছিল তা ফেরত আনা হলো) */}
        <section className="px-4 mt-7">
          <div className="grid grid-cols-5 gap-3">
            {categories.slice(0, 5).map(cat => (
              <button key={cat.id} onClick={() => navigate(`/categories?selected=${cat.name}`)} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
                  <CategoryIcon name={cat.icon} size={20} />
                </div>
                <span className="text-[10px] text-white/50">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ৩. প্রোডাক্ট সেকশন (যেমন: Flash Sale) */}
        <section className="px-4 mt-9">
            <h2 className="text-lg font-black mb-4">Flash Sale</h2>
            <div className="grid grid-cols-2 gap-3">
                {flashSale.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
        </section>

        {/* ৪. প্রমো ব্যানার (যা প্রোডাক্টের নিচে থাকবে) */}
        <section className="px-4 mt-9">
          {promoBanners.map(b => (
            <div key={b.id} className="rounded-3xl p-8 flex flex-col justify-center cursor-pointer"
              style={{ background: '#111', height: '140px' }}
              onClick={() => { if (b.button_link) navigate(b.button_link); }}>
              <h3 className="text-5xl font-black uppercase tracking-tighter">{b.title}</h3>
              <p className="text-3xl font-black">{b.subtitle}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
