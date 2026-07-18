import { useState, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../components/ProductCard';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useData } from '../lib/data';
import { appConfig } from '../lib/config';
import { ikBanner } from '../lib/imagekit';

export function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { products, categories, banners, promoBanners } = useData();

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
           <h1 className="text-xl font-black">{appConfig.name}</h1>
           <LanguageSwitcher variant="icon" />
        </div>
      </header>

      <div className="max-w-lg mx-auto">
        {/* ১. হিরো ব্যানার (স্লিম - হাইট ১৪০ পিক্সেল) */}
        <section className="px-4 mt-2">
          <div className="relative overflow-hidden rounded-3xl" style={{ height: '140px', background: '#000' }}>
            {banners.length > 0 ? (
              <img src={ikBanner(banners[0].desktop_image || banners[0].image_url)} className="w-full h-full object-cover" />
            ) : <div className="w-full h-full" />}
          </div>
        </section>

        {/* ২. নিচের প্রমো ব্যানার (বিশাল বোল্ড লেখা) */}
        <section className="px-4 mt-6">
          {promoBanners.map(b => (
            <div key={b.id} className="relative rounded-3xl overflow-hidden p-8 flex flex-col justify-center cursor-pointer mb-4"
              style={{ background: '#111', height: '160px' }}
              onClick={() => { if (b.button_link) navigate(b.button_link); }}>
              {b.desktop_image && <img src={ikBanner(b.desktop_image)} className="absolute inset-0 w-full h-full object-cover opacity-40" />}
              <div className="relative z-10">
                <h3 className="text-5xl font-black text-white uppercase tracking-tighter leading-none mb-2">{b.title}</h3>
                <p className="text-3xl font-black text-white">{b.subtitle}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ৩. সব সেকশন হেডিং বোল্ড */}
        <section className="px-4 mt-6">
          <h2 className="text-2xl font-black mb-4">Flash Sale</h2>
          <div className="grid grid-cols-2 gap-3">
            {products.filter(p => p.discount_price).slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      </div>
    </div>
  );
}
