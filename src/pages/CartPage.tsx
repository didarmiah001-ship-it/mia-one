import { useNavigate } from '../lib/router';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Tag } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { appConfig } from '../lib/config';

export function CartPage() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  const subtotal = Math.round(state.cart.reduce(
    (sum, item) => sum + (item.product.discount_price || item.product.price) * item.quantity,
    0
  ));
  const deliveryCharge = subtotal >= appConfig.delivery.freeDeliveryThreshold ? 0 : appConfig.delivery.deliveryCharge;
  const total = subtotal + deliveryCharge;
  const totalItems = state.cart.reduce((s, i) => s + i.quantity, 0);

  if (state.cart.length === 0) {
    return (
      <div className="page-transition pb-24 flex flex-col items-center justify-center min-h-[80vh] px-4">
        <div className="relative w-28 h-28 mb-6 float-premium">
          <img src={appConfig.logo} alt="MIA ONE" className="w-full h-full object-contain opacity-60" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Your Cart is Empty</h2>
        <p className="text-sm text-white/40 mb-6 text-center">Discover amazing products and add them to your cart</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white glow-btn flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
        >
          Start Shopping <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="page-transition pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <ShoppingBag size={18} className="text-mia-orange" /> My Cart
            </h1>
            <p className="text-xs text-white/40">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => dispatch({ type: 'CLEAR_CART' })}
            className="text-xs text-red-400/60 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10"
          >
            Clear All
          </button>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4 space-y-3">
        {/* Cart Items */}
        {state.cart.map(item => {
          const price = item.product.discount_price || item.product.price;
          const lineTotal = Math.round(price * item.quantity);
          return (
            <div key={item.product.id} className="glow-card p-3 flex gap-3 group">
              {/* Image */}
              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-white/5">
                <img src={item.product.image || item.product.images?.[0] || appConfig.logo} alt={item.product.name} className="w-full h-full object-cover" />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-white/90 line-clamp-2 leading-snug">{item.product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-bold text-mia-orange">৳{price}</span>
                  {item.product.discount_price && (
                    <span className="text-xs text-white/30 line-through">৳{item.product.price}</span>
                  )}
                </div>

                {/* Qty controls + delete */}
                <div className="flex items-center justify-between mt-2.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_CART_QTY', productId: item.product.id, quantity: item.quantity - 1 })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <Minus size={11} className="text-white/60" />
                    </button>
                    <span className="text-sm font-semibold text-white w-7 text-center">{item.quantity}</span>
                    <button
                      onClick={() => dispatch({ type: 'UPDATE_CART_QTY', productId: item.product.id, quantity: item.quantity + 1 })}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }}
                    >
                      <Plus size={11} className="text-mia-orange" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/70">৳{lineTotal}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: 'REMOVE_FROM_CART', productId: item.product.id });
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/20 active:bg-red-500/30"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
                    >
                      <Trash2 size={11} className="text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Free delivery notice */}
        {deliveryCharge > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(255,138,0,0.05)', border: '1px solid rgba(255,138,0,0.12)' }}>
            <Tag size={12} className="text-mia-orange shrink-0" />
          <span className="text-[11px] text-white/30 leading-none">Add <span className="text-mia-orange font-semibold">৳{appConfig.delivery.freeDeliveryThreshold - subtotal}</span> more for free delivery</span>
          </div>
        )}
        {deliveryCharge === 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)' }}>
            <Tag size={12} className="text-green-400 shrink-0" />
            <span className="text-green-400 font-medium">You qualify for free delivery!</span>
          </div>
        )}

        {/* Order Summary */}
        <div className="glow-card p-4 space-y-2.5">
          <h3 className="text-sm font-semibold text-white mb-3">Order Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Subtotal ({totalItems} items)</span>
            <span className="text-white">৳{subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Delivery Charge</span>
            <span className={deliveryCharge === 0 ? 'text-green-400 font-medium' : 'text-white'}>
              {deliveryCharge === 0 ? 'Free' : `৳${deliveryCharge}`}
            </span>
          </div>
          <div className="border-t border-white/5 pt-3 flex justify-between">
            <span className="text-sm font-semibold text-white">Total</span>
            <span className="text-xl font-bold text-mia-orange">৳{total}</span>
          </div>
        </div>
      </div>

      {/* Sticky checkout button */}
      <div
        className="fixed left-0 right-0 px-4 z-20"
        style={{ bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))', paddingBottom: '8px' }}
      >
        <div className="max-w-lg md:max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 8px 32px rgba(255,138,0,0.3)' }}
          >
            Proceed to Checkout — ৳{total} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
