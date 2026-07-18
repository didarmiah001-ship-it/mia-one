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

  return (
    <div className="page-transition pb-24 w-full">
      {/* হেডার: ডেস্কটপে ফুল স্ক্রিন, লোগো মাঝখানে */}
      <header className="sticky top-0 z-30 glass px-4 py-3 w-full">
        <div className="flex items-center justify-between w-full max-w-[1400px] mx-auto">
          <button onClick={() => navigate('/notifications')} className="text-white/70"><Bell size={24} /></button>
          <img src={appConfig.logo} alt="Logo" className="w-10 h-10 object-contain" />
          <button onClick={() => navigate('/wishlist')} className="text-white/70"><Heart size={24} /></button>
        </div>
      </header>

      {/* মেইন কন্টেন্ট */}
      <div className="w-full px-4 md:px-8 lg:px-12 mx-auto">
        
        {/* হিরো ব্যানার */}
        <section className="mt-4">
           <div className="relative overflow-hidden rounded-3xl w-full" style={{ height: 'clamp(180px, 30vw, 400px)' }}>
              {banners.length > 0 && <img src={ikBanner(banners[0].image_url)} className="w-full h-full object-cover" />}
           </div>
        </section>

        {/* এখানে তোমার ক্যাটাগরি এবং প্রোডাক্ট সেকশনগুলো থাকবে */}
        
        {/* নিচের ব্যানার: প্রোডাক্টের নিচে, স্লিম সাইজ */}
        <section className="mt-12 mb-8">
          {promoBanners.map(b => (
            <div key={b.id} className="rounded-3xl relative overflow-hidden w-full flex flex-col justify-center cursor-pointer p-8"
              style={{ background: '#111', height: '120px' }} 
              onClick={() => { if (b.button_link) navigate(b.button_link); }}>
              <h3 className="text-3xl font-black text-white uppercase">{b.title}</h3>
              <p className="text-lg font-bold text-white/80">{b.subtitle}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
