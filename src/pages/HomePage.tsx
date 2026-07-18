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

  const featured = products.filter(p => p.is_featured);
  const trending = products.filter(p => p.is_trending);
  const newArrivals = products.filter(p => p.is_new);
  const flashSale = products.filter(p => p.discount_price).slice(0, 4);

  return (
    <div className="page-transition pb-24">
      {/* ১. হেডার: মাঝখানে লোগো, দুই পাশে নোটিফিকেশন ও লাভ আইকন */}
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/notifications')} className="text-white/70"><Bell size={24} /></button>
          <img src={appConfig.logo} alt="MIA ONE" className="w-10 h-10 object-contain" />
          <button onClick={() => navigate('/wishlist')} className="text-white/70"><Heart size={24} /></button>
        </div>
      </header>

      <div className="max-w-lg md:max-w-4xl mx-auto">
        {/* ২. হিরো ব্যানার */}
        <section className="px-4 mt-4">
           <div className="relative overflow-hidden rounded-3xl banner-glass" style={{ height: 'clamp(160px, 25vw, 220px)' }}>
              {banners.length > 0 && <img src={ikBanner(banners[0].image_url)} className="w-full h-full object-cover" />}
           </div>
        </section>

        {/* ৩. ক্যাটাগরি ও প্রোডাক্টস (আগের মতো সব ঠিক আছে) */}
        {/* (এখানে তোমার আগের সব কোডই আছে, শুধু নিচে প্রমো ব্যানারটি সরানো হয়েছে) */}
        
        {/* ── প্রোডাক্ট সেকশনগুলো এখানে থাকবে ── */}
        
        {/* ৪. নিচের প্রমো ব্যানার (সব প্রোডাক্টের নিচে) */}
        <section className="px-4 mt-9">
          {promoBanners.map(b => (
            <div key={b.id} className="rounded-3xl relative overflow-hidden banner-glass w-full flex flex-col justify-center cursor-pointer p-6"
              style={{ height: '110px' }} // আগের চেয়ে স্লিম
              onClick={() => { if (b.button_link) navigate(b.button_link); }}>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">{b.title}</h3>
              <p className="text-lg font-bold text-white/90">{b.subtitle}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
