import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, Category } from './types';
import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
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
  settings: Settings;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

function mapProduct(p: any): Product {
  return {
    id: p.id,
    name: p.name ?? '',
    price: Number(p.price ?? 0),
    discount_price: p.discount_price != null ? Number(p.discount_price) : null,
    image: p.image ?? '',
    images: p.images ?? [],
    category: p.category ?? '',
    description: p.description ?? '',
    specifications: p.specifications ?? {},
    rating: Number(p.rating ?? 0),
    reviews_count: Number(p.reviews_count ?? 0),
    stock: Number(p.stock ?? 0),
    is_featured: Boolean(p.is_featured),
    is_trending: Boolean(p.is_trending),
    is_new: Boolean(p.is_new),
    created_at: p.created_at ?? '',
  };
}

function mapCategory(c: any): Category {
  return {
    id: c.id,
    name: c.name ?? '',
    icon: c.icon ?? '',
    color: c.color ?? '',
  };
}

function mapBanner(b: any): Banner {
  return {
    id: b.id,
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
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsSnap, categoriesSnap, bannersSnap, settingsSnap] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories')),
        getDocs(query(collection(db, 'banners'), where('is_active', '==', true))),
        getDocs(collection(db, 'settings')),
      ]);

      const productsData: Product[] = productsSnap.empty
        ? []
        : productsSnap.docs.map(doc => mapProduct({ id: doc.id, ...doc.data() }));
      setProducts(productsData);

      const categoriesData: Category[] = categoriesSnap.empty
        ? []
        : categoriesSnap.docs.map(doc => mapCategory({ id: doc.id, ...doc.data() }));
      setCategories(categoriesData);

      const bannersData: Banner[] = bannersSnap.empty
        ? []
        : bannersSnap.docs
            .map(doc => mapBanner({ id: doc.id, ...doc.data() }))
            .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setBanners(bannersData);

      const settingsData: Settings = {};
      settingsSnap.forEach(doc => { settingsData[doc.id] = doc.data(); });
      setSettings(settingsData);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <DataContext.Provider value={{ products, categories, banners, settings, loading, error, refresh }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be within DataProvider');
  return ctx;
}
