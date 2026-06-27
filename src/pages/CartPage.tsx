import { useMemo } from 'react';
import { Trash2, Heart, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Truck, Tag } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useNavigate } from '../lib/router';
import { appConfig } from '../lib/config';
import { useAuth } from '../lib/auth';
import { toggleWishlist } from '../lib/api';
import { useTranslation } from 'react-i18next';

export function CartPage() {
  const { t } = useTranslation();
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { user } = useAuth();

  const totals = useMemo(() => {
    const subtotal = Math.round(
      state.cart.reduce((sum, item) => sum + (item.product.discount_price ?? item.product.price) * item.quantity, 0)
    );
    const originalTotal = Math.round(
      state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    );
    const discount = originalTotal - subtotal;
    const deliveryCharge = subtotal >= appConfig.delivery.freeDeliveryThreshold ? 0 : appConfig.delivery.deliveryCharge;
    const total = subtotal + deliveryCharge;
    return { subtotal, discount, total, deliveryCharge };
  }, [state.cart]);

  const totalItems = state.cart.reduce((s, i) => s + i.quantity, 0);

  const handleSaveForLater = async (productId: string) => {
    const product = state.cart.find(i => i.product.id === productId)?.product;
    if (!product) return;
    if (user) {
      await toggleWishlist(user.id, product.id);
    }
    dispatch({ type: 'TOGGLE_WISHLIST', product });
    dispatch({ type: 'REMOVE_FROM_CART', productId });
  };

  if (state.cart.length === 0) {
    return (
      <div className="page-transition pb-24 flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="relative w-28 h-28 mb-6 float-premium">
          <img src={appConfig.logo} alt="MIA ONE" className="w-full h-full object-contain opacity-60" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{t('cart.empty')}</h2>
        <p className="text-sm text-white/40 mb-6 text-center">{t('cart.emptyDesc')}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white glow-btn flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
        >
          {t('cart.startShopping')} <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mia-black">
      {/* Scrollable Content Area */}
      <div className="pb-[160px]">
        {/* Header */}
        <header className="sticky top-0 z-30 glass px-4 py-3">
          <div className="max-w-lg md:max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag size={18} className="text-mia-orange" /> {t('cart.title')}
              </h1>
              <p className="text-xs text-white/40">{totalItems} {totalItems !== 1 ? t('common.items') : t('common.item')}</p>
            </div>
            <button
              onClick={() => dispatch({ type: 'CLEAR_CART' })}
              className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10"
            >
              {t('cart.clearAll')}
            </button>
          </div>
        </header>

        <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4 space-y-3 page-transition">
          {/* Cart Items */}
          {state.cart.map(item => {
            const price = item.product.discount_price ?? item.product.price;
            const hasDiscount = item.product.discount_price !== null && item.product.discount_price < item.product.price;
            const discountPercent = hasDiscount
              ? Math.round(((item.product.price - item.product.discount_price!) / item.product.price) * 100)
              : 0;
            const lineTotal = Math.round(price * item.quantity);

            return (
              <div key={item.product.id} className="glow-card p-3 flex gap-3">
                {/* Image */}
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5 relative cursor-pointer"
                  onClick={() => navigate(`/product/${item.product.id}`)}
                >
                  <img
                    src={item.product.image || item.product.images?.[0] || appConfig.logo}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                  {hasDiscount && (
                    <span className="absolute top-1.5 left-1.5 text-[9px] font-bold px-1 py-0.5 rounded text-white"
                      style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
                      -{discountPercent}%
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-sm font-medium text-white/90 line-clamp-2 leading-snug cursor-pointer hover:text-mia-orange transition-colors"
                    onClick={() => navigate(`/product/${item.product.id}`)}
                  >
                    {item.product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-mia-orange">৳{price.toLocaleString()}</span>
                    {hasDiscount && (
                      <span className="text-xs text-white/30 line-through">৳{item.product.price.toLocaleString()}</span>
                    )}
                  </div>

                  {/* Qty + actions */}
                  <div className="flex items-center justify-between mt-2.5">
                    {/* Wishlist + Delete */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSaveForLater(item.product.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
                        title={t('cart.saveForLater')}
                      >
                        <Heart size={12} className="text-white/40 hover:text-mia-pink transition-colors" />
                      </button>
                      <button
                        onClick={() => dispatch({ type: 'REMOVE_FROM_CART', productId: item.product.id })}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20"
                        style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}
                        title={t('cart.remove')}
                      >
                        <Trash2 size={11} className="text-red-400" />
                      </button>
                    </div>

                    {/* Qty controls + line total */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white/60">৳{lineTotal.toLocaleString()}</span>
                      <div className="flex items-center gap-0.5" style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '2px' }}>
                        <button
                          onClick={() => dispatch({ type: 'UPDATE_CART_QTY', productId: item.product.id, quantity: item.quantity - 1 })}
                          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/10"
                        >
                          <Minus size={10} className="text-white/60" />
                        </button>
                        <span className="text-xs font-semibold text-white w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => dispatch({ type: 'UPDATE_CART_QTY', productId: item.product.id, quantity: item.quantity + 1 })}
                          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-lg transition-colors"
                          style={{ background: 'rgba(255,138,0,0.08)' }}
                        >
                          <Plus size={10} className="text-mia-orange" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Delivery notice */}
          {totals.deliveryCharge > 0 ? (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(255,138,0,0.05)', border: '1px solid rgba(255,138,0,0.12)' }}>
              <Tag size={12} className="text-mia-orange shrink-0" />
              <span className="text-[11px] text-white/30 leading-none">
                {t('cart.moreForFree')} <span className="text-mia-orange font-semibold">{appConfig.delivery.currency}{(appConfig.delivery.freeDeliveryThreshold - totals.subtotal).toLocaleString()}</span> {t('cart.addMore')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
              style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
              <Tag size={12} className="text-green-400 shrink-0" />
              <span className="text-green-400 font-medium text-[11px]">{t('cart.freeDeliveryQualified')}</span>
            </div>
          )}

          {/* Order Summary */}
          <div className="glow-card p-4 space-y-2.5">
            <h3 className="text-sm font-semibold text-white mb-3">{t('cart.orderSummary')}</h3>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">{t('cart.subtotal')} ({totalItems} {totalItems !== 1 ? t('common.items') : t('common.item')})</span>
              <span className="text-white">৳{totals.subtotal.toLocaleString()}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-400">{t('cart.discountSavings')}</span>
                <span className="text-green-400 font-medium">-৳{totals.discount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-white/50">{t('cart.deliveryCharge')}</span>
              <span className={totals.deliveryCharge === 0 ? 'text-green-400 font-medium' : 'text-white'}>
                {totals.deliveryCharge === 0 ? t('common.free') : `${appConfig.delivery.currency}${totals.deliveryCharge}`}
              </span>
            </div>
            <div className="border-t border-white/5 pt-3 flex justify-between">
              <span className="text-sm font-semibold text-white">{t('cart.total')}</span>
              <span className="text-xl font-bold text-mia-orange">{appConfig.delivery.currency}{totals.total.toLocaleString()}</span>
            </div>

            {/* Trust badges */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-white/30">
                <ShieldCheck size={13} className="text-white/40 shrink-0" />
                <span>{t('cart.secureCheckout')}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/30">
                <Truck size={13} className="text-white/40 shrink-0" />
                <span>{t('cart.fastDelivery')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Proceed to Checkout Button — above BottomNav */}
      <div
        className="fixed left-0 right-0 z-40 px-4"
        style={{
          bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: '12px',
          paddingTop: '12px',
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg-base) 85%, transparent) 0%, var(--bg-base) 100%)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div className="max-w-lg md:max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-4 rounded-2xl text-sm font-semibold text-white glow-btn flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 8px 32px rgba(255,138,0,0.3)' }}
          >
            {t('cart.proceedToCheckout')} — {appConfig.delivery.currency}{totals.total.toLocaleString()} <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
