import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CartItem, WishlistItem, Order, Product } from '../lib/types';

interface StoreState {
  cart: CartItem[];
  wishlist: WishlistItem[];
  orders: Order[];
  recentlyViewed: Product[];
}

type StoreAction =
  | { type: 'ADD_TO_CART'; product: Product; quantity?: number }
  | { type: 'REMOVE_FROM_CART'; productId: string }
  | { type: 'UPDATE_CART_QTY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_WISHLIST'; product: Product }
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'ADD_RECENTLY_VIEWED'; product: Product }
  | { type: 'HYDRATE'; state: Partial<StoreState> };

const STORAGE_KEY = 'mia-one-store';

function loadPersistedState(): Partial<StoreState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);

    // Sanitize cart: merge duplicate product IDs, ensure quantity >= 1
    if (Array.isArray(parsed.cart)) {
      const merged: CartItem[] = [];
      for (const item of parsed.cart) {
        if (!item?.product?.id) continue;
        const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
        const existing = merged.find(m => m.product.id === item.product.id);
        if (existing) {
          existing.quantity += qty;
        } else {
          merged.push({ product: item.product, quantity: qty });
        }
      }
      parsed.cart = merged;
    }

    return parsed;
  } catch {
    return {};
  }
}

function persistState(state: StoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cart: state.cart,
      wishlist: state.wishlist,
      recentlyViewed: state.recentlyViewed,
    }));
  } catch {
    // Storage may be full — silently ignore
  }
}

const initialState: StoreState = {
  cart: [],
  wishlist: [],
  orders: [],
  recentlyViewed: [],
};

function storeReducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.state };

    case 'ADD_TO_CART': {
      const addQty = action.quantity ?? 1;
      const existing = state.cart.find(i => i.product.id === action.product.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map(i =>
            i.product.id === action.product.id
              ? { ...i, quantity: i.quantity + addQty }
              : i
          ),
        };
      }
      return { ...state, cart: [...state.cart, { product: action.product, quantity: addQty }] };
    }

    case 'REMOVE_FROM_CART':
      return { ...state, cart: state.cart.filter(i => i.product.id !== action.productId) };

    case 'UPDATE_CART_QTY':
      if (action.quantity <= 0) {
        return { ...state, cart: state.cart.filter(i => i.product.id !== action.productId) };
      }
      return {
        ...state,
        cart: state.cart.map(i =>
          i.product.id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };

    case 'CLEAR_CART':
      return { ...state, cart: [] };

    case 'TOGGLE_WISHLIST': {
      const exists = state.wishlist.find(i => i.product.id === action.product.id);
      if (exists) {
        return { ...state, wishlist: state.wishlist.filter(i => i.product.id !== action.product.id) };
      }
      return { ...state, wishlist: [...state.wishlist, { product: action.product }] };
    }

    case 'ADD_ORDER':
      return { ...state, orders: [action.order, ...state.orders] };

    case 'ADD_RECENTLY_VIEWED': {
      const filtered = state.recentlyViewed.filter(p => p.id !== action.product.id);
      return { ...state, recentlyViewed: [action.product, ...filtered].slice(0, 10) };
    }

    default:
      return state;
  }
}

const StoreContext = createContext<{
  state: StoreState;
  dispatch: React.Dispatch<StoreAction>;
} | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(storeReducer, initialState);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const persisted = loadPersistedState();
    if (Object.keys(persisted).length > 0) {
      dispatch({ type: 'HYDRATE', state: persisted });
    }
  }, []);

  // Persist to localStorage on every state change
  useEffect(() => {
    persistState(state);
  }, [state]);

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}
