import { Search, Bell, ChevronRight } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../components/ProductCard';
import { CategoryIcon } from '../components/CategoryIcon';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useData } from '../lib/data';
import { appConfig } from '../lib/config';
import { ikBanner } from '../lib/imagekit';

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products, categories, banners, promoBanners } = useData();
  const flashSale = products.filter(p => p.discount_price).slice(0, 4);

  return (
    <div className="pb-24">
      {/* Header - লোগো এবং সার্চবার সহ */}
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
             <img src={appConfig.logo} alt="Logo" className="w-8 h-8 object-contain" />
             <h1 className="text-lg font-bold">{appConfig.name}</h1>
          </div>
          <LanguageSwitcher variant="icon" />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4">
        {/* ১. হিরো ব্যানার */}
        <section className="mt-2">
           <div className="relative overflow-hidden rounded-3xl" style={{ height: '150px' }}>
              {banners.length > 0 && <img src={ikBanner(banners[0].image_url)} className="w-full h-full object-cover" />}
           </div>
        </section>

        {/* ২. ক্যাটাগরি */}
        <section className="mt-6 grid grid-cols-5 gap-3">
            {categories.slice(0, 5).map(cat => (
              <button key={cat.id} onClick={() => navigate(`/categories?selected=${cat.name}`)} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10">
                  <CategoryIcon name={cat.icon} size={20} />
                </div>
                <span className="text-[10px] text-white/50">{cat.name}</span>
              </button>
            ))}
        </section>

        {/* ৩. ফ্ল্যাশ সেল প্রোডাক্ট */}
        <section className="mt-8">
            <h2 className="text-lg font-bold mb-4">Flash Sale</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {flashSale.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
        </section>

        {/* ৪. প্রমো ব্যানার (লেখা রেসপন্সিভ সাইজে) */}
        <section className="mt-8">
          {promoBanners.map(b => (
            <div key={b.id} className="relative rounded-3xl overflow-hidden p-6 cursor-pointer"
              style={{ background: '#111', height: '140px' }}
              onClick={() => { if (b.button_link) navigate(b.button_link); }}>
              {b.desktop_image && <img src={ikBanner(b.desktop_image)} className="absolute inset-0 w-full h-full object-cover opacity-30" />}
              <div className="relative z-10">
                <h3 className="text-xl md:text-3xl font-bold uppercase">{b.title}</h3>
                <p className="text-lg md:text-2xl font-medium">{b.subtitle}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
