import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, X, Mic, MicOff, SlidersHorizontal, ChevronDown, Star,
  Package, TrendingUp, Clock, ArrowUpDown, ArrowLeft, Check,
  ShoppingCart, Heart, Filter,
} from 'lucide-react';
import { useNavigate, useSearchParams } from '../lib/router';
import { useData } from '../lib/data';
import { useStore } from '../store/StoreContext';
import { fetchBrands, searchProducts, SearchFilters } from '../lib/api';
import { Product } from '../lib/types';
import { useTranslation } from 'react-i18next';
import { ikThumb } from '../lib/imagekit';

const SORT_OPTIONS = [
  { key: 'newest', labelKey: 'search.sortNewest' },
  { key: 'best_selling', labelKey: 'search.sortBestSelling' },
  { key: 'price_asc', labelKey: 'search.sortPriceLow' },
  { key: 'price_desc', labelKey: 'search.sortPriceHigh' },
  { key: 'discount', labelKey: 'search.sortBiggestDiscount' },
] as const;

const RATING_OPTIONS = [4, 3, 2];
const HISTORY_KEY = 'mia-search-history';
const MAX_HISTORY = 8;

function loadHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(q: string, prev: string[]) {
  const next = [q, ...prev.filter(h => h !== q)].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

function PriceSlider({
  min, max, value, onChange,
}: {
  min: number; max: number; value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercent = (v: number) => ((v - min) / (max - min)) * 100;
  const lowPct = getPercent(value[0]);
  const highPct = getPercent(value[1]);

  return (
    <div className="px-1 py-2">
      <div className="flex justify-between mb-3">
        <div className="px-3 py-1.5 rounded-xl text-xs font-semibold text-mia-orange"
          style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
          ৳{value[0].toLocaleString()}
        </div>
        <div className="px-3 py-1.5 rounded-xl text-xs font-semibold text-mia-orange"
          style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
          ৳{value[1].toLocaleString()}
        </div>
      </div>
      <div ref={trackRef} className="relative h-5 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        {/* Active range */}
        <div className="absolute h-1.5 rounded-full"
          style={{
            left: `${lowPct}%`,
            right: `${100 - highPct}%`,
            background: 'linear-gradient(90deg, #FF8A00, #FF2EC9)',
            boxShadow: '0 0 8px rgba(255,138,0,0.4)',
          }} />
        {/* Low thumb */}
        <input
          type="range" min={min} max={max} step={10} value={value[0]}
          onChange={e => {
            const v = Math.min(Number(e.target.value), value[1] - 10);
            onChange([v, value[1]]);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
          style={{ zIndex: value[0] > max - 100 ? 5 : 3 }}
        />
        {/* High thumb */}
        <input
          type="range" min={min} max={max} step={10} value={value[1]}
          onChange={e => {
            const v = Math.max(Number(e.target.value), value[0] + 10);
            onChange([value[0], v]);
          }}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-5"
          style={{ zIndex: 4 }}
        />
        {/* Visual thumbs */}
        {[lowPct, highPct].map((pct, i) => (
          <div key={i}
            className="absolute w-5 h-5 rounded-full pointer-events-none transition-transform"
            style={{
              left: `calc(${pct}% - 10px)`,
              background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)',
              boxShadow: '0 0 10px rgba(255,138,0,0.5), 0 2px 6px rgba(0,0,0,0.4)',
              zIndex: 2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ResultCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const isWishlisted = state.wishlist.some(i => i.product.id === product.id);
  const effectivePrice = product.discount_price ?? product.price;
  const discount = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="glow-card p-3 flex gap-3 cursor-pointer group transition-all duration-200 hover:scale-[1.01]">
      <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        <img src={ikThumb(product.image)} alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        {discount > 0 && (
          <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white"
            style={{ background: 'linear-gradient(135deg, #FF2EC9, #7B2CFF)' }}>
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-[9px] text-white/60 font-medium">{t('common.outOfStock')}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <p className="text-[10px] text-white/30 font-medium mb-0.5">{product.category}</p>
          <h3 className="text-sm font-medium text-white/90 line-clamp-2 leading-snug group-hover:text-white">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <Star size={10} className="fill-mia-orange text-mia-orange" />
            <span className="text-[10px] text-white/50">{product.rating}</span>
            <span className="text-[10px] text-white/25">({product.reviews_count})</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <div>
            <span className="text-sm font-bold text-mia-orange">৳{effectivePrice}</span>
            {product.discount_price && (
              <span className="text-[11px] text-white/25 line-through ml-1.5">৳{product.price}</span>
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_WISHLIST', product }); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
              style={{ background: isWishlisted ? 'rgba(255,46,201,0.12)' : 'var(--bg-surface)' }}>
              <Heart size={13} className={isWishlisted ? 'fill-mia-pink text-mia-pink' : 'text-white/40'} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); if (product.stock > 0) dispatch({ type: 'ADD_TO_CART', product }); }}
              disabled={product.stock === 0}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 2px 8px rgba(255,138,0,0.25)' }}>
              <ShoppingCart size={12} className="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories, products: allProducts } = useData();
  const { dispatch } = useStore();

  // Query state
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SearchFilters['sortBy']>('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Results
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // UI state
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [brands, setBrands] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported] = useState(() => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Derived max price from products
  const maxPrice = useMemo(() => {
    const max = Math.max(...allProducts.map(p => p.price), 10000);
    return Math.ceil(max / 1000) * 1000;
  }, [allProducts]);

  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  useEffect(() => {
    fetchBrands().then(setBrands);
  }, []);

  // Debounce query
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Run search whenever any filter changes
  useEffect(() => {
    runSearch();
  }, [debouncedQuery, selectedCategory, selectedBrand, priceRange, minRating, inStockOnly, sortBy]);

  const runSearch = useCallback(async () => {
    const hasFilter = debouncedQuery.trim() || selectedCategory || selectedBrand
      || priceRange[0] > 0 || priceRange[1] < maxPrice
      || minRating > 0 || inStockOnly;

    if (!hasFilter) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    const data = await searchProducts({
      query: debouncedQuery.trim() || undefined,
      category: selectedCategory || undefined,
      brand: selectedBrand || undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < maxPrice ? priceRange[1] : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      inStock: inStockOnly || undefined,
      sortBy,
    });

    setResults(data);
    setLoading(false);
  }, [debouncedQuery, selectedCategory, selectedBrand, priceRange, minRating, inStockOnly, sortBy, maxPrice]);

  const handleSubmit = (q: string) => {
    if (!q.trim()) return;
    setHistory(prev => saveHistory(q.trim(), prev));
    setQuery(q.trim());
    inputRef.current?.blur();
  };

  const clearSearch = () => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setPriceRange([0, maxPrice]);
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('newest');
  };

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onstart = () => setIsListening(true);
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join('');
      setQuery(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        handleSubmit(transcript);
        setIsListening(false);
      }
    };
    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const activeFilterCount = [
    selectedCategory, selectedBrand,
    priceRange[0] > 0 || priceRange[1] < maxPrice ? 'price' : '',
    minRating > 0 ? 'rating' : '',
    inStockOnly ? 'stock' : '',
  ].filter(Boolean).length;

  const currentSortLabel = t(SORT_OPTIONS.find(s => s.key === sortBy)?.labelKey || 'search.sortNewest');

  const showSuggestions = !searched && query.length === 0;

  return (
    <div className="page-transition pb-28 min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto">
          {/* Search bar row */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1 as any)}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <ArrowLeft size={16} className="text-white/60" />
            </button>

            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit(query)}
                placeholder={t('search.placeholder')}
                autoFocus
                className="w-full pl-11 pr-10 py-2.5 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
                style={{
                  background: 'var(--bg-surface)',
                  border: query ? '1px solid rgba(255,138,0,0.3)' : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: query ? '0 0 0 3px rgba(255,138,0,0.06)' : 'none',
                }}
              />
              {query && (
                <button onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Voice */}
            {voiceSupported && (
              <button
                onClick={isListening ? stopVoice : startVoice}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all"
                style={isListening
                  ? { background: 'rgba(255,46,201,0.15)', border: '1px solid rgba(255,46,201,0.3)', boxShadow: '0 0 12px rgba(255,46,201,0.3)' }
                  : { background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {isListening
                  ? <MicOff size={15} className="text-mia-pink" style={{ filter: 'drop-shadow(0 0 6px #FF2EC9)' }} />
                  : <Mic size={15} className="text-white/50" />}
              </button>
            )}
          </div>

          {/* Voice listening indicator */}
          {isListening && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <div className="flex gap-0.5 items-center h-4">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className="w-0.5 rounded-full bg-mia-pink"
                    style={{
                      height: `${8 + Math.sin(Date.now() / 200 + i) * 6}px`,
                      animation: `breathe ${0.4 + i * 0.1}s ease-in-out infinite`,
                      opacity: 0.8,
                    }} />
                ))}
              </div>
              <span className="text-xs text-mia-pink/80 animate-pulse">{t('search.listening')}</span>
            </div>
          )}

          {/* Controls row: Filter + Sort */}
          {searched && (
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={showFilters || activeFilterCount > 0
                  ? { background: 'rgba(255,138,0,0.12)', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.25)' }
                  : { background: 'var(--bg-surface)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <SlidersHorizontal size={13} />
                {t('search.filters')}
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
                    style={{ background: '#FF8A00', color: '#000' }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={{ background: 'var(--bg-surface)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <ArrowUpDown size={12} />
                  {currentSortLabel}
                  <ChevronDown size={11} className={`transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                </button>
                {showSortMenu && (
                  <div
                    className="absolute top-full mt-1.5 left-0 z-50 rounded-2xl p-1.5 min-w-[180px]"
                    style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-normal)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)' }}>
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortBy(opt.key); setShowSortMenu(false); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all"
                        style={sortBy === opt.key
                          ? { background: 'rgba(255,138,0,0.1)', color: '#FF8A00' }
                          : { color: 'rgba(255,255,255,0.55)' }}>
                        {t(opt.labelKey)}
                        {sortBy === opt.key && <Check size={12} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {(activeFilterCount > 0) && (
                <button onClick={clearAllFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs text-red-400 transition-all ml-auto"
                  style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)' }}>
                  <X size={11} /> {t('search.clear')}
                </button>
              )}

              <span className="ml-auto text-[10px] text-white/25 font-medium shrink-0">
                {loading ? '...' : `${results.length} ${t('search.results')}`}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-3">

        {/* ── Filter Panel ── */}
        {showFilters && (
          <div
            className="mb-4 rounded-3xl p-5 space-y-5"
            style={{ background: 'var(--bg-card)', border: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Category */}
            <div>
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2.5">{t('search.category')}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={!selectedCategory
                    ? { background: 'rgba(255,138,0,0.12)', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.25)' }
                    : { background: 'var(--bg-surface)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {t('search.all')}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? '' : cat.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={selectedCategory === cat.id
                      ? { background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30` }
                      : { background: 'var(--bg-surface)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand */}
            {brands.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2.5">{t('search.brand')}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedBrand('')}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={!selectedBrand
                      ? { background: 'rgba(0,209,255,0.1)', color: '#00D1FF', border: '1px solid rgba(0,209,255,0.2)' }
                      : { background: 'var(--bg-surface)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {t('search.all')}
                  </button>
                  {brands.map((brand: any) => (
                    <button
                      key={brand.id}
                      onClick={() => setSelectedBrand(selectedBrand === brand.id ? '' : brand.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                      style={selectedBrand === brand.id
                        ? { background: 'rgba(0,209,255,0.1)', color: '#00D1FF', border: '1px solid rgba(0,209,255,0.2)' }
                        : { background: 'var(--bg-surface)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div>
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2.5">{t('search.priceRange')}</p>
              <PriceSlider min={0} max={maxPrice} value={priceRange} onChange={setPriceRange} />
            </div>

            {/* Rating */}
            <div>
              <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider mb-2.5">{t('search.minRating')}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMinRating(0)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                  style={minRating === 0
                    ? { background: 'rgba(255,138,0,0.12)', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.25)' }
                    : { background: 'var(--bg-surface)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {t('search.any')}
                </button>
                {RATING_OPTIONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setMinRating(minRating === r ? 0 : r)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                    style={minRating === r
                      ? { background: 'rgba(255,138,0,0.12)', color: '#FF8A00', border: '1px solid rgba(255,138,0,0.25)' }
                      : { background: 'var(--bg-surface)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Star size={10} className={minRating === r ? 'fill-mia-orange text-mia-orange' : 'text-white/30'} />
                    {r}+
                  </button>
                ))}
              </div>
            </div>

            {/* In Stock */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70 font-medium">{t('search.inStockOnly')}</p>
                <p className="text-[11px] text-white/30">{t('search.showAvailable')}</p>
              </div>
              <button
                onClick={() => setInStockOnly(v => !v)}
                className="relative w-11 h-6 rounded-full transition-all duration-300"
                style={{
                  background: inStockOnly ? 'linear-gradient(135deg, #FF8A00, #FF2EC9)' : 'rgba(255,255,255,0.08)',
                  boxShadow: inStockOnly ? '0 0 12px rgba(255,138,0,0.3)' : 'none',
                }}>
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300"
                  style={{ left: inStockOnly ? 'calc(100% - 22px)' : '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
              </button>
            </div>
          </div>
        )}

        {/* ── Suggestions / History ── */}
        {showSuggestions && (
          <div className="space-y-4">
            {history.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">{t('search.recentSearches')}</p>
                  <button
                    onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY); }}
                    className="text-[10px] text-white/25 hover:text-red-400 transition-colors">
                    {t('search.clear')}
                  </button>
                </div>
                <div className="space-y-1.5">
                  {history.map(h => (
                    <button
                      key={h}
                      onClick={() => { setQuery(h); handleSubmit(h); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-left transition-all hover:scale-[1.01]"
                      style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <Clock size={13} className="text-white/25 shrink-0" />
                      <span className="text-sm text-white/60 flex-1 truncate">{h}</span>
                      <button
                        onClick={e => { e.stopPropagation(); setHistory(prev => { const next = prev.filter(x => x !== h); localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); return next; }); }}
                        className="text-white/15 hover:text-white/50 transition-colors">
                        <X size={12} />
                      </button>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending categories */}
            <div>
              <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2.5">{t('search.browseCategories')}</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.slice(0, 6).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); setSearched(true); }}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-left transition-all hover:scale-[1.02]"
                    style={{ background: `${cat.color}08`, border: `1px solid ${cat.color}15` }}>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${cat.color}15` }}>
                      <Package size={13} style={{ color: cat.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: cat.color }}>{cat.name}</p>
                      <p className="text-[10px] text-white/25">
                        {allProducts.filter(p => p.category === cat.name).length} {t('categories.items')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending products */}
            {allProducts.filter(p => p.is_trending).length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2.5">
                  <TrendingUp size={13} className="text-mia-orange" />
                  <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">{t('search.trending')}</p>
                </div>
                <div className="space-y-2">
                  {allProducts.filter(p => p.is_trending).slice(0, 4).map(p => (
                    <ResultCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-2 mt-1">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 p-3 rounded-2xl"
                style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="w-20 h-20 rounded-xl shrink-0"
                  style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite' }} />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 rounded-full w-2/3" style={{ background: 'rgba(255,255,255,0.06)', animation: 'shimmer 2s infinite 0.1s' }} />
                  <div className="h-3 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.04)', animation: 'shimmer 2s infinite 0.2s' }} />
                  <div className="h-3 rounded-full w-1/2" style={{ background: 'rgba(255,255,255,0.04)', animation: 'shimmer 2s infinite 0.3s' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Results ── */}
        {!loading && searched && (
          <>
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center float-premium"
                  style={{ background: 'rgba(255,138,0,0.05)', border: '1px solid rgba(255,138,0,0.1)' }}>
                  <Search size={24} className="text-mia-orange/40" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white/60">{t('search.noResults')}</p>
                  <p className="text-xs text-white/30 mt-1">{t('search.noResultsDesc')}</p>
                </div>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-mia-orange"
                  style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}>
                  {t('search.clearAllFilters')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {results.map(product => (
                  <ResultCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Sort menu backdrop */}
      {showSortMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  );
}
