import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category } from './types';
import { db } from './firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  onSnapshot as onDocSnapshot,
} from 'firebase/firestore';

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  image?: string;
  is_active?: boolean;
  priority?: number;
  sort_order?: number;
  [key: string]: any;
}

export interface Settings {
  [key: string]: any;
}

interface DataState {
  products: Product[];
  categories: Category[];
  banners: Banner[];
  promoBanners: Banner[]; // 🆕 Isolated Dynamic Promo Banners Type Support
  settings: Settings;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

function mapProduct(id: string, p: any): Product {
  return {
    id,
    name: p.name ?? '',
    price: Number(p.price ?? 0),
    discount_price: p.discount_price != null ? Number(p.discount_price) : null,
    wholesale_price: p.wholesale_price != null ? Number(p.wholesale_price) : null,
    image: p.image ?? '',
    images: p.images ?? [],
    category: p.category ?? '',
    category_id: p.category_id ?? '',
    brand: p.brand ?? '',
    brand_id: p.brand_id ?? '',
    subcategory: p.subcategory ?? '',
    description: p.description ?? '',
    short_description: p.short_description ?? '',
    long_description: p.long_description ?? '',
    specifications: p.specifications ?? {},
    sku: p.sku ?? '',
    barcode: p.barcode ?? '',
    weight: p.weight != null ? Number(p.weight) : null,
    colors: p.colors ?? [],
    sizes: p.sizes ?? [],
    tags: p.tags ?? [],
    primary_image_index: p.primary_image_index ?? 0,
    rating: Number(p.rating ?? 0),
    reviews_count: Number(p.reviews_count ?? 0),
    stock: Number(p.stock ?? 0),
    is_featured: Boolean(p.is_featured),
    is_trending: Boolean(p.is_trending),
    is_new: Boolean(p.is_new),
    is_best_selling: Boolean(p.is_best_selling),
    is_active: p.is_active !== false,
    created_at: p.created_at ?? '',
  };
}

function mapCategory(id: string, c: any): Category {
  return {
    id,
    name: c.name ?? '',
    icon: c.icon ?? '',
    color: c.color ?? '',
  };
}

function mapBanner(id: string, b: any): Banner {
  return {
    id,
    title: b.title ?? '',
    subtitle: b.subtitle ?? '',
    color: b.color ?? '',
    image: b.image,
    is_active: b.is_active,
    priority: b.priority,
    sort_order: b.sort_order,
    ...b,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [promoBanners, setPromoBanners] = useState<Banner[]>([]); // 🆕 Dynamic Bottom Banners Local State
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingsUnsub, setSettingsUnsub] = useState<(() => void) | null>(null);

  useEffect(() => {
    let activeCount = 0;
    let completedCount = 0;
    const checkAllLoaded = () => {
      completedCount++;
      if (completedCount >= activeCount) setLoading(false);
    };
    activeCount = 5; // 🆕 Increased to 5 to handle the new promo banners sync securely

    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        const data = snap.docs
          .map(d => mapProduct(d.id, d.data()))
          .filter(p => p.is_active);
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setProducts(data);
        checkAllLoaded();
      },
      (err) => { setError(err.message); checkAllLoaded(); }
    );

    const unsubCategories = onSnapshot(
      collection(db, 'categories'),
      (snap) => {
        const data = snap.docs.map(d => mapCategory(d.id, d.data()));
        setCategories(data);
        checkAllLoaded();
      },
      (err) => { setError(err.message); checkAllLoaded(); }
    );

    const unsubBanners = onSnapshot(
      collection(db, 'banners'),
      (snap) => {
        const now = new Date();
        const data = snap.docs
          .map(d => mapBanner(d.id, d.data()))
          .filter(b => {
            if (b.is_active === false) return false;
            if ((b as any).starts_at && new Date((b as any).starts_at) > now) return false;
            if ((b as any).ends_at && new Date((b as any).ends_at) < now) return false;
            return true;
          })
          .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
        setBanners(data);
        checkAllLoaded();
      },
      (err) => { setError(err.message); checkAllLoaded(); }
    );

    // 🆕 New Isolated Realtime Listener for Bottom Promo Banners Engine
    const unsubPromoBanners = onSnapshot(
      collection(db, 'promo_banners'),
      (snap) => {
        const now = new Date();
        const data = snap.docs
          .map(d => mapBanner(d.id, d.data()))
          .filter(b => {
            if (b.is_active === false) return false;
            if ((b as any).starts_at && new Date((b as any).starts_at) > now) return false;
            if ((b as any).ends_at && new Date((b as any).ends_at) < now) return false;
            return true;
          })
          .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
        setPromoBanners(data);
        checkAllLoaded();
      },
      (err) => { setError(err.message); checkAllLoaded(); }
    );

    const unsubSettings = onSnapshot(
      collection(db, 'settings'),
      (snap) => {
        const data: Settings = {};
        snap.forEach(d => { data[d.id] = d.data(); });
        setSettings(data);
        checkAllLoaded();
      },
      (err) => { setError(err.message); checkAllLoaded(); }
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubBanners();
      unsubPromoBanners(); // 🆕 Securely clean up listener to prevent memory leaks
      unsubSettings();
      if (settingsUnsub) settingsUnsub();
    };
  }, []);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsSnap, categoriesSnap, bannersSnap, promoBannersSnap, settingsSnap] = await Promise.all([
        new Promise<any[]>((resolve) => {
          const unsub = onSnapshot(collection(db, 'products'), (snap) => {
            const data = snap.docs.map(d => mapProduct(d.id, d.data())).filter(p => p.is_active);
            data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            resolve(data);
            unsub();
          });
        }),
        new Promise<any[]>((resolve) => {
          const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
            resolve(snap.docs.map(d => mapCategory(d.id, d.data())));
            unsub();
          });
        }),
        new Promise<any[]>((resolve) => {
          const unsub = onSnapshot(collection(db, 'banners'), (snap) => {
            const now = new Date();
            const data = snap.docs
              .map(d => mapBanner(d.id, d.data()))
              .filter(b => {
                if (b.is_active === false) return false;
                if ((b as any).starts_at && new Date((b as any).starts_at) > now) return false;
                if ((b as any).ends_at && new Date((b as any).ends_at) < now) return false;
                return true;
              })
              .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
            resolve(data);
            unsub();
          });
        }),
        // 🆕 Dynamic Static Refresh Sync for Promo Banners
        new Promise<any[]>((resolve) => {
          const unsub = onSnapshot(collection(db, 'promo_banners'), (snap) => {
            const now = new Date();
            const data = snap.docs
              .map(d => mapBanner(d.id, d.data()))
              .filter(b => {
                if (b.is_active === false) return false;
                if ((b as any).starts_at && new Date((b as any).starts_at) > now) return false;
                if ((b as any).ends_at && new Date((b as any).ends_at) < now) return false;
                return true;
              })
              .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
            resolve(data);
            unsub();
          });
        }),
        new Promise<Settings>((resolve) => {
          const unsub = onSnapshot(collection(db, 'settings'), (snap) => {
            const data: Settings = {};
            snap.forEach(d => { data[d.id] = d.data(); });
            resolve(data);
            unsub();
          });
        }),
      ]);

      setProducts(productsSnap as Product[]);
      setCategories(categoriesSnap as Category[]);
      setBanners(bannersSnap as Banner[]);
      setPromoBanners(promoBannersSnap as Banner[]); // 🆕 Hydrate state safely
      setSettings(settingsSnap);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider value={{ products, categories, banners, promoBanners, settings, loading, error, refresh }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be within DataProvider');
  return ctx;
}
