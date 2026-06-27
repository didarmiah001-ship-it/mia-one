import { useSearchParams, useNavigate } from '../lib/router';
import { ArrowLeft, PackageOpen } from 'lucide-react';
import { CategoryIcon } from '../components/CategoryIcon';
import { useData } from '../lib/data';
import { ProductCard } from '../components/ProductCard';
import { useTranslation } from 'react-i18next';

export function CategoriesPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const selectedCategory = searchParams.get('selected');
  const navigate = useNavigate();
  const { products, categories } = useData();

  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : null;

  return (
    <div className="page-transition pb-24">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto flex items-center gap-3">
          {selectedCategory && (
            <button
              onClick={() => navigate('/categories')}
              className="w-9 h-9 rounded-xl flex items-center justify-center glow-hover"
              style={{ background: 'var(--bg-input)', border: '1px solid var(--input-border)' }}
            >
              <ArrowLeft size={16} className="text-white/60" />
            </button>
          )}
          <h1 className="text-lg font-bold text-white">{selectedCategory || t('categories.title')}</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto px-4 mt-4">
        {!selectedCategory ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => navigate(`/categories?selected=${cat.name}`)}
                className="glow-card p-5 flex flex-col items-center gap-3 group relative overflow-hidden"
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 50% 30%, ${cat.color}08, transparent 70%)` }} />

                <div
                  className="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-400 group-hover:scale-110"
                  style={{
                    backgroundColor: `${cat.color}10`,
                    border: `1px solid ${cat.color}20`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = `0 4px 20px ${cat.color}30, 0 0 30px ${cat.color}10`;
                    e.currentTarget.style.borderColor = `${cat.color}50`;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                    e.currentTarget.style.borderColor = `${cat.color}20`;
                  }}
                >
                  <CategoryIcon name={cat.icon} size={26} style={{ color: cat.color }} />
                </div>
                <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{cat.name}</span>
                <span className="text-[10px] text-white/25 font-medium">
                  {products.filter(p => p.category === cat.name).length} {t('categories.items')}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {filteredProducts && filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 float-premium"
                  style={{ background: 'rgba(255,138,0,0.05)', border: '1px solid rgba(255,138,0,0.1)' }}>
                  <PackageOpen size={32} className="text-white/20" />
                </div>
                <p className="text-sm text-white/40">{t('categories.empty')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredProducts?.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
