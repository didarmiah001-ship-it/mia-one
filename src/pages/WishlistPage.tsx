import { useState, useEffect } from 'react';
import { useNavigate } from '../lib/router';
import { Trash2, Loader2 } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../lib/auth';
import { fetchWishlist, toggleWishlist } from '../lib/api';
import { appConfig } from '../lib/config';
import { Product } from '../lib/types';
import { useTranslation } from 'react-i18next';

interface WishlistEntry {
  id: string;
  product: Product;
}

export function WishlistPage() {
  const { t } = useTranslation();
  const { state, dispatch } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dbWishlist, setDbWishlist] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlist() {
      if (user) {
        const data = await fetchWishlist(user.id);
        const items = data.map((w: any) => ({
          id: w.id,
          product: {
            id: w.products.id,
            name: w.products.name,
            price: Number(w.products.price),
            discount_price: w.products.discount_price ? Number(w.products.discount_price) : null,
            image: w.products.image,
            images: w.products.images || [],
            category: w.products.categories?.name || '',
            description: w.products.description,
            specifications: w.products.specifications || {},
            rating: Number(w.products.rating),
            reviews_count: w.products.reviews_count,
            stock: w.products.stock,
            is_featured: w.products.is_featured,
            is_trending: w.products.is_trending,
            is_new: w.products.is_new,
            created_at: w.products.created_at,
          },
        }));
        setDbWishlist(items);
      }
      setLoading(false);
    }
    loadWishlist();
  }, [user]);

  const wishlistItems: WishlistEntry[] = user
    ? dbWishlist
    : state.wishlist.map(i => ({ id: i.product.id, product: i.product }));

  const handleRemove = async (product: Product) => {
    if (user) {
      await toggleWishlist(user.id, product.id);
      setDbWishlist(prev => prev.filter(w => w.product.id !== product.id));
    }
    dispatch({ type: 'TOGGLE_WISHLIST', product });
  };

  if (loading) {
    return (
      <div className="page-transition min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="text-mia-orange animate-spin" />
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="page-transition pb-24 flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="relative w-28 h-28 mb-6 float-premium">
          <img src={appConfig.logo} alt="MIA ONE" className="w-full h-full object-contain opacity-60" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{t('wishlist.empty')}</h2>
        <p className="text-sm text-white/40 mb-6 text-center">{t('wishlist.emptyDesc')}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white glow-btn"
          style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
        >
          {t('wishlist.browseProducts')}
        </button>
      </div>
    );
  }

  return (
    <div className="page-transition pb-24">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto">
          <h1 className="text-lg font-bold text-white">{t('wishlist.title')}</h1>
          <p className="text-xs text-white/40">{wishlistItems.length} {wishlistItems.length !== 1 ? t('common.items') : t('common.item')}</p>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4 space-y-3">
        {wishlistItems.map(item => (
          <div
            key={item.id}
            className="glow-card p-3 flex gap-3 cursor-pointer"
            onClick={() => navigate(`/product/${item.product.id}`)}
          >
            <img
              src={item.product.image}
              alt={item.product.name}
              className="w-20 h-20 rounded-xl object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-white/90 line-clamp-1">{item.product.name}</h3>
              <p className="text-sm font-bold text-mia-orange mt-1">
                ৳{item.product.discount_price || item.product.price}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'ADD_TO_CART', product: item.product });
                  }}
                  className="text-[11px] px-3 py-1 rounded-full bg-mia-orange/10 text-mia-orange hover:bg-mia-orange/20 transition-colors"
                >
                  {t('wishlist.addToCart')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.product);
                  }}
                  className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                >
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
