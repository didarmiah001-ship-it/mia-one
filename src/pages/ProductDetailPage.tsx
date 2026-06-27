import { useParams, useNavigate } from '../lib/router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Star, Minus, Plus, ShoppingCart, Truck, CheckCircle2 } from 'lucide-react';
import { useData } from '../lib/data';
import { useStore } from '../store/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { appConfig } from '../lib/config';
import { useToast } from '../components/Toast';
import { useTranslation } from 'react-i18next';

export function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { products } = useData();
  const { showToast } = useToast();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  const product = products.find(p => p.id === id);
  const isWishlisted = product ? state.wishlist.some(i => i.product.id === product.id) : false;

  useEffect(() => {
    if (product) {
      dispatch({ type: 'ADD_RECENTLY_VIEWED', product });
    }
  }, [product, dispatch]);

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white/40">{t('product.notFound')}</p>
      </div>
    );
  }

  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const discount = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  const totalPrice = product.discount_price
    ? product.discount_price * quantity
    : product.price * quantity;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      {/* Scrollable Content Area */}
      <div className="pb-[200px]">
        {/* Header */}
        <header className="sticky top-0 z-30 glass px-4 py-3">
          <div className="max-w-lg md:max-w-2xl mx-auto flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center">
              <ArrowLeft size={18} className="text-white/70" />
            </button>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_WISHLIST', product })}
              className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center"
            >
              <Heart size={18} className={isWishlisted ? 'fill-mia-pink text-mia-pink' : 'text-white/70'} />
            </button>
          </div>
        </header>

        <div className="max-w-lg md:max-w-2xl mx-auto page-transition">
          {/* Gallery */}
          <div className="px-4 mt-2">
            <div className="aspect-square rounded-2xl overflow-hidden mb-3 flex items-center justify-center" style={{ background: "var(--bg-surface)" }}>
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.onerror = null;
                  img.style.display = 'none';
                  const parent = img.parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;color:rgba(255,255,255,0.2)';
                    fallback.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/><path d='m21 15-5-5L5 21'/></svg><span style='font-size:12px'>${t('product.imageUnavailable')}</span>`;
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === selectedImage ? 'border-mia-orange' : 'border-transparent opacity-50'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="px-4 mt-5">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-bold text-white leading-tight">{product.name}</h1>
              {discount > 0 && (
                <span className="shrink-0 px-2 py-0.5 bg-mia-pink/20 text-mia-pink text-xs font-bold rounded-full">
                  -{discount}%
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-mia-orange text-mia-orange" />
                <span className="text-sm font-medium text-white">{product.rating}</span>
              </div>
              <span className="text-xs text-white/30">({product.reviews_count} {t('product.reviews')})</span>
              <span className="text-xs text-white/20">|</span>
              <span className={`text-xs ${product.stock > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {product.stock > 0 ? `${product.stock} ${t('product.inStock')}` : t('product.outOfStock')}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-4">
              {product.discount_price ? (
                <>
                  <span className="text-2xl font-bold text-mia-orange">৳{product.discount_price}</span>
                  <span className="text-base text-white/30 line-through">৳{product.price}</span>
                </>
              ) : (
                <span className="text-2xl font-bold text-white">৳{product.price}</span>
              )}
            </div>

            {/* Delivery */}
            <div className="flex items-center gap-3 mt-5 p-3 rounded-xl bg-white/5">
              <Truck size={18} className="text-mia-blue shrink-0" />
              <div>
                <p className="text-xs font-medium text-white/80">{t('product.freeDeliveryNote')} {appConfig.delivery.currency}{appConfig.delivery.freeDeliveryThreshold}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{t('product.estimatedDelivery')} {appConfig.delivery.estimatedDays}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white/90 mb-2">{t('product.description')}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{product.description}</p>
            </div>

            {/* Specifications */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white/90 mb-2">{t('product.specifications')}</h3>
              <div className="space-y-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-xs text-white/40">{key}</span>
                    <span className="text-xs text-white/70">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="px-4 mt-8">
              <h3 className="text-sm font-semibold text-white/90 mb-3">{t('product.relatedProducts')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Fixed Checkout Bar — above BottomNav */}
      <div
        className="fixed left-0 right-0 z-40"
        style={{
          bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {/* White background bar */}
        <div
          className="w-full"
          style={{
            background: 'var(--bg-nav)',
            borderTop: '1px solid var(--border-normal)',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.10)',
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: '16px',
            paddingRight: '16px',
          }}
        >
          <div className="max-w-lg md:max-w-2xl mx-auto">
            {/* Top row: Total Price */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/60">{t('product.total')}</span>
              <span className="text-xl font-bold text-white">৳{totalPrice.toLocaleString()}</span>
            </div>

            {/* Bottom row: QTY, Buy Now, Add to Cart */}
            <div className="flex gap-3 items-center">
              {/* Quantity Selector */}
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 shrink-0 overflow-hidden" style={{ height: '52px' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  disabled={product.stock === 0}
                >
                  <Minus size={16} className="text-white/60" />
                </button>
                <div className="px-3 min-w-[40px] text-center flex flex-col items-center justify-center border-x border-gray-200 h-full bg-white">
                  <span className="text-xs text-white/50">{t('common.qty')}</span>
                  <span className="text-sm font-bold text-white">{quantity}</span>
                </div>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  disabled={product.stock === 0}
                >
                  <Plus size={16} className="text-white/60" />
                </button>
              </div>

              {/* Proceed to Checkout / Buy Now */}
              <button
                onClick={() => {
                  if (product.stock === 0) return;
                  dispatch({ type: 'ADD_TO_CART', product, quantity });
                  navigate('/cart');
                }}
                disabled={product.stock === 0}
                className="flex-1 rounded-xl text-sm font-semibold text-white flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  height: '52px',
                  background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)',
                  boxShadow: '0 4px 16px rgba(255, 138, 0, 0.4)',
                }}
              >
                <span>{t('product.proceedToCheckout')}</span>
              </button>

              {/* Add to Cart */}
              <button
                onClick={() => {
                  if (product.stock === 0) return;
                  dispatch({ type: 'ADD_TO_CART', product, quantity });
                  setAddedToCart(true);
                  showToast(t('product.addedToCart'), 'success');
                  setTimeout(() => setAddedToCart(false), 2000);
                }}
                disabled={product.stock === 0}
                className="rounded-xl border-2 text-sm font-semibold flex items-center justify-center active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                style={{
                  height: '52px',
                  width: '52px',
                  borderColor: addedToCart ? '#22c55e' : '#FF8A00',
                  color: addedToCart ? '#22c55e' : '#FF8A00',
                  background: addedToCart ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 138, 0, 0.08)',
                }}
              >
                {addedToCart ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <ShoppingCart size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
