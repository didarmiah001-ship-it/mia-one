import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, Category } from './types';
import { fetchProducts, fetchCategories, fetchBanners } from './api';

interface DataState {
  products: Product[];
  categories: Category[];
  banners: any[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [p, c, b] = await Promise.all([fetchProducts(), fetchCategories(), fetchBanners()]);
    setProducts(p);
    setCategories(c);
    setBanners(b);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <DataContext.Provider value={{ products, categories, banners, loading, refresh }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be within DataProvider');
  return ctx;
}
