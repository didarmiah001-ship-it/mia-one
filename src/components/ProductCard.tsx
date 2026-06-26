import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { Product } from '../lib/types';
import { useStore } from '../store/StoreContext';

export function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const isWishlisted = state.wishlist.some(i => i.product.id === product.id);
  const discount = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  return (
    <div
      className="glow-card p-3 cursor-pointer group"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 bg-mia-navy/50">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
          onError={(e) => {
            const t = e.currentTarget;
            t.onerror = null;
            t.style.display = 'none';
            const parent = t.parentElement;
            if (parent && !parent.querySelector('.img-fallback')) {
              const fb = document.createElement('div');
              fb.className = 'img-fallback absolute inset-0 flex flex-col items-center justify-center gap-2';
              fb.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
              parent.appendChild(fb);
            }
          }}
        />
        {/* Image overlay glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: 'inset 0 0 30px rgba(255, 138, 0, 0.1)' }} />

        {discount > 0 && (
          <span className="absolute top-2 left-2 px-2.5 py-1 text-white text-[10px] font-bold rounded-lg neon-pulse"
            style={{ background: 'linear-gradient(135deg, #FF2EC9, #7B2CFF)', color: '#fff' }}>
            -{discount}%
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: 'TOGGLE_WISHLIST', product });
          }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-125 hover:bg-black/60"
          style={isWishlisted ? { boxShadow: '0 0 12px rgba(255, 46, 201, 0.5)' } : {}}
        >
          <Heart
            size={14}
            className={`transition-all duration-300 ${isWishlisted ? 'fill-mia-pink text-mia-pink drop-shadow-[0_0_6px_rgba(255,46,201,0.8)]' : 'text-white/80'}`}
          />
        </button>
        {product.stock < 10 && product.stock > 0 && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-mia-orange/90 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm"
            style={{ boxShadow: '0 0 8px rgba(255, 138, 0, 0.3)' }}>
            Only {product.stock} left
          </span>
        )}
      </div>
      <h3 className="text-sm font-medium text-white/90 line-clamp-2 mb-1.5 leading-tight group-hover:text-white transition-colors">
        {product.name}
      </h3>
      <div className="flex items-center gap-1.5 mb-2">
        <Star size={12} className="fill-mia-orange text-mia-orange drop-shadow-[0_0_4px_rgba(255,138,0,0.5)]" />
        <span className="text-[11px] text-white/60">{product.rating}</span>
        <span className="text-[11px] text-white/20">({product.reviews_count})</span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          {product.discount_price ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-mia-orange drop-shadow-[0_0_6px_rgba(255,138,0,0.3)]">
                ৳{product.discount_price}
              </span>
              <span className="text-[11px] text-white/25 line-through">৳{product.price}</span>
            </div>
          ) : (
            <span className="text-sm font-bold text-white">৳{product.price}</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            dispatch({ type: 'ADD_TO_CART', product });
          }}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)',
            boxShadow: '0 4px 12px rgba(255, 138, 0, 0.3), 0 0 20px rgba(255, 138, 0, 0.1)',
          }}
        >
          <ShoppingCart size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}
