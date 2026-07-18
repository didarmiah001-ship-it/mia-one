import { Search, Bell, ChevronRight, Zap, TrendingUp, Sparkles, Megaphone } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../components/ProductCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useData } from '../lib/data';
import { useStore } from '../store/StoreContext';
import { appConfig } from '../lib/config';
import { ikBanner } from '../lib/imagekit';

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useStore();
  const { products, categories, banners, promoBanners } = useData();

  const flashSale = products.filter(p => p.discount_price).slice(0, 4);
  const featured = products.filter(p => p.is_featured);
  const trending = products.filter(p => p.is_trending);
  const newArrivals = products.filter(p => p.is_new);

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
           <div className="flex items-center gap-2">
             <img src={appConfig.logo} alt="Logo" className="w-8 h-8 object-contain" />
             <h1 className="text-lg font-bold">{appConfig.name}</h1>
           </div>
           <LanguageSwitcher variant="icon" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        {/* ১. হিরো ব্যানার */}
        <section className="px-4 mt-4">
           <div className="relative overflow-hidden rounded-3xl" style={{ height: '150px' }}>
              {banners.length > 0 && <img src={ikBanner(banners[0].image_url)} className="w-full h-full object-cover" />}
           </div>
        </section>

        {/* ২. ক্যাটাগরি */}
        <section className="px-4 mt-6 grid grid-cols-5 gap-3">
            {categories.slice(0, 5).map(cat => (
              <button key={cat.id} onClick={() => navigate(`/categories?selected=${cat.name}`)} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
                  <CategoryIcon name={cat.icon} size={20} />
                </div>
                <span className="text-[10px] text-white/50">{cat.name}</span>
              </button>
            ))}
        </section>

        {/* ৩. Flash Sale */}
        <section className="px-4 mt-8">
            <h2 className="text-lg font-bold mb-4">Flash Sale</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {flashSale.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
        </section>

        {/* ৪. প্রমো ব্যানার (নিচে এবং লেখা একটু বড়) */}
        <section className="px-4 mt-8">
          {promoBanners.map(b => (
            <div key={b.id} className="relative rounded-3xl overflow-hidden p-6 cursor-pointer"
              style={{ background: '#111', height: '140px' }}
              onClick={() => { if (b.button_link) navigate(b.button_link); }}>
              {b.desktop_image && <img src={ikBanner(b.desktop_image)} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
              <div className="relative z-10">
                <h3 className="text-2xl md:text-4xl font-bold uppercase">{b.title}</h3>
                <p className="text-xl md:text-2xl font-semibold">{b.subtitle}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
