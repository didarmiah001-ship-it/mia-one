import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { uploadToImageKit } from './imagekit-upload';
import { Product, Category } from './types';

type AnyRecord = Record<string, any> & { id: string };

export interface SearchFilters {
  query?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sortBy?: 'newest' | 'best_selling' | 'price_asc' | 'price_desc' | 'discount';
}

async function getCategoriesMap(): Promise<Record<string, { name: string }>> {
  const snap = await getDocs(collection(db, 'categories'));
  const map: Record<string, { name: string }> = {};
  snap.forEach(d => { map[d.id] = { name: d.data().name || '' }; });
  return map;
}

async function getBrandsMap(): Promise<Record<string, { name: string }>> {
  const snap = await getDocs(collection(db, 'brands'));
  const map: Record<string, { name: string }> = {};
  snap.forEach(d => { map[d.id] = { name: d.data().name || '' }; });
  return map;
}

function mapProduct(id: string, p: any, catMap: Record<string, { name: string }>, brandMap: Record<string, { name: string }>): Product {
  return {
    id,
    name: p.name,
    price: Number(p.price) || 0,
    cost_price: Number(p.cost_price) || 0,
    discount_price: p.discount_price != null ? Number(p.discount_price) : null,
    wholesale_price: p.wholesale_price != null ? Number(p.wholesale_price) : null,
    image: p.image || '',
    images: p.images || [],
    category: catMap[p.category_id]?.name || '',
    category_id: p.category_id || '',
    brand: brandMap[p.brand_id]?.name || '',
    brand_id: p.brand_id || '',
    description: p.description || '',
    short_description: p.short_description || '',
    long_description: p.long_description || '',
    specifications: p.specifications || {},
    sku: p.sku || '',
    barcode: p.barcode || '',
    weight: p.weight != null ? Number(p.weight) : null,
    colors: p.colors || [],
    sizes: p.sizes || [],
    tags: p.tags || [],
    subcategory: p.subcategory || '',
    primary_image_index: p.primary_image_index || 0,
    rating: Number(p.rating) || 0,
    reviews_count: p.reviews_count || 0,
    stock: p.stock || 0,
    low_stock_threshold: p.low_stock_threshold != null ? Number(p.low_stock_threshold) : 5,
    is_featured: p.is_featured || false,
    is_trending: p.is_trending || false,
    is_new: p.is_new || false,
    is_best_selling: p.is_best_selling || false,
    is_active: p.is_active !== false,
    created_at: p.created_at || new Date().toISOString(),
  };
}

export async function searchProducts(filters: SearchFilters): Promise<Product[]> {
  const q = query(collection(db, 'products'), where('is_active', '!=', false));
  const snap = await getDocs(q);
  const [catMap, brandMap] = await Promise.all([getCategoriesMap(), getBrandsMap()]);

  let results: Product[] = snap.docs.map(d => mapProduct(d.id, d.data(), catMap, brandMap));

  if (filters.query && filters.query.trim().length > 0) {
    const qStr = filters.query.trim().toLowerCase();
    results = results.filter(p =>
      p.name.toLowerCase().includes(qStr) ||
      (p.description || '').toLowerCase().includes(qStr) ||
      (p.short_description || '').toLowerCase().includes(qStr) ||
      (p.sku || '').toLowerCase().includes(qStr) ||
      (p.tags || []).some(t => t.toLowerCase().includes(qStr))
    );
  }

  if (filters.category) results = results.filter(p => p.category_id === filters.category);
  if (filters.brand) results = results.filter(p => p.brand_id === filters.brand);
  if (filters.minPrice !== undefined) results = results.filter(p => p.price >= filters.minPrice!);
  if (filters.maxPrice !== undefined) results = results.filter(p => p.price <= filters.maxPrice!);
  if (filters.minRating !== undefined) results = results.filter(p => p.rating >= filters.minRating!);
  if (filters.inStock) results = results.filter(p => p.stock > 0);

  switch (filters.sortBy) {
    case 'newest':
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    case 'best_selling':
      results.sort((a, b) => (Number(b.is_best_selling) - Number(a.is_best_selling)) || (b.reviews_count - a.reviews_count));
      break;
    case 'price_asc':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'discount':
      results = results.filter(p => p.discount_price != null);
      results.sort((a, b) => (a.discount_price || 0) - (b.discount_price || 0));
      break;
    default:
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return results.slice(0, 100);
}

export async function fetchCategories(): Promise<Category[]> {
  const snap = await getDocs(collection(db, 'categories'));
  const results: AnyRecord[] = snap.docs.map(d => ({
    id: d.id,
    name: d.data().name || '',
    icon: d.data().icon || '',
    color: d.data().color || '',
  }));
  results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return results as unknown as Category[];
}

export async function fetchProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, 'products'), where('is_active', '!=', false)));
  const [catMap, brandMap] = await Promise.all([getCategoriesMap(), getBrandsMap()]);
  const results = snap.docs.map(d => mapProduct(d.id, d.data(), catMap, brandMap));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function adminFetchAllProducts() {
  const snap = await getDocs(collection(db, 'products'));
  const [catMap, brandMap] = await Promise.all([getCategoriesMap(), getBrandsMap()]);
  const results = snap.docs.map(d => mapProduct(d.id, d.data(), catMap, brandMap));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function fetchBanners() {
  const snap = await getDocs(collection(db, 'banners'));
  const now = new Date();
  let results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results = results.filter(b => {
    if (b.is_active === false) return false;
    if (b.starts_at && new Date(b.starts_at) > now) return false;
    if (b.ends_at && new Date(b.ends_at) < now) return false;
    return true;
  });
  results.sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

export async function adminFetchBanners() {
  const snap = await getDocs(collection(db, 'banners'));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

export async function fetchOrders(userId: string) {
  const snap = await getDocs(query(collection(db, 'orders'), where('user_id', '==', userId)));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function createOrder(order: {
  user_id: string;
  items: any[];
  subtotal: number;
  delivery_charge: number;
  discount: number;
  total: number;
  status: string;
  payment_method: string;
  address: any;
  coupon_code?: string | null;
  city?: string;
}) {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...order,
      order_number: `ORD-${Date.now().toString().slice(-8)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function validateCoupon(code: string, subtotal: number): Promise<{ discount: number; type: string; value: number; error: string | null }> {
  const snap = await getDocs(query(collection(db, 'coupons'), where('code', '==', code.toUpperCase())));
  if (snap.empty) return { discount: 0, type: '', value: 0, error: 'Invalid coupon code' };

  const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
  if (!data.is_active) return { discount: 0, type: '', value: 0, error: 'Coupon is not active' };

  const now = new Date();
  if (data.expires_at && new Date(data.expires_at) < now) return { discount: 0, type: '', value: 0, error: 'Coupon has expired' };
  if (data.max_uses && (data.used_count || 0) >= data.max_uses) return { discount: 0, type: '', value: 0, error: 'Coupon usage limit reached' };
  if (data.min_order && subtotal < data.min_order) return { discount: 0, type: '', value: 0, error: `Minimum order ৳${data.min_order} required` };

  const discount = data.type === 'percentage'
    ? Math.round((subtotal * data.value) / 100)
    : Math.min(data.value, subtotal);

  return { discount, type: data.type, value: data.value, error: null };
}

export async function incrementCouponUsage(code: string) {
  const snap = await getDocs(query(collection(db, 'coupons'), where('code', '==', code.toUpperCase())));
  if (snap.empty) return;
  const couponRef = snap.docs[0].ref;
  const data = snap.docs[0].data();
  await updateDoc(couponRef, { used_count: (data.used_count || 0) + 1 });
}

export async function fetchAddresses(userId: string) {
  const snap = await getDocs(query(collection(db, 'addresses'), where('user_id', '==', userId)));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => Number(b.is_default || 0) - Number(a.is_default || 0));
  return results;
}

export async function createAddress(address: {
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  area: string;
  city: string;
  notes?: string;
  is_default?: boolean;
}) {
  try {
    const docRef = await addDoc(collection(db, 'addresses'), {
      ...address,
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function updateAddress(id: string, updates: any) {
  try {
    await updateDoc(doc(db, 'addresses', id), updates);
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function deleteAddress(id: string) {
  try {
    await deleteDoc(doc(db, 'addresses', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function fetchWishlist(userId: string) {
  const snap = await getDocs(query(collection(db, 'wishlist'), where('user_id', '==', userId)));
  const catMap = await getCategoriesMap();
  const productSnaps = await Promise.all(
    snap.docs.map(async w => {
      const wd = w.data();
      const pSnap = await getDoc(doc(db, 'products', wd.product_id));
      const p = pSnap.exists() ? pSnap.data() : null;
      return { id: w.id, ...wd, products: p ? { id: pSnap.id, ...p, category: catMap[p.category_id]?.name || '' } : null };
    })
  );
  return productSnaps.filter(w => w.products);
}

export async function toggleWishlist(userId: string, productId: string) {
  const snap = await getDocs(query(
    collection(db, 'wishlist'),
    where('user_id', '==', userId),
    where('product_id', '==', productId),
  ));
  if (!snap.empty) {
    await deleteDoc(snap.docs[0].ref);
    return { added: false };
  }
  await addDoc(collection(db, 'wishlist'), { user_id: userId, product_id: productId, created_at: new Date().toISOString() });
  return { added: true };
}

// ── Admin: Orders ────────────────────────────────────────────────────────────

export async function adminFetchAllOrders(filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }) {
  const snap = await getDocs(collection(db, 'orders'));
  let results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (filters?.status && filters.status !== 'all') {
    results = results.filter(o => o.status === filters.status);
  }
  if (filters?.dateFrom) {
    results = results.filter(o => new Date(o.created_at) >= new Date(filters.dateFrom!));
  }
  if (filters?.dateTo) {
    results = results.filter(o => new Date(o.created_at) <= new Date(filters.dateTo! + 'T23:59:59Z'));
  }
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    results = results.filter(o =>
      (o.order_number || '').toLowerCase().includes(s) ||
      o.id.toLowerCase().includes(s) ||
      (o.address?.full_name || '').toLowerCase().includes(s) ||
      (o.address?.phone || '').includes(s)
    );
  }
  return results;
}

export async function adminUpdateOrderStatus(orderId: string, status: string, note?: string) {
  try {
    await updateDoc(doc(db, 'orders', orderId), { status, updated_at: new Date().toISOString() });
    if (note) {
      await addDoc(collection(db, 'order_timeline'), {
        order_id: orderId, status, note, created_by: 'admin', created_at: new Date().toISOString(),
      });
    }
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function fetchOrderTimeline(orderId: string) {
  const snap = await getDocs(query(collection(db, 'order_timeline'), where('order_id', '==', orderId)));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return results;
}

export async function cancelOrder(orderId: string, userId: string) {
  const orderSnap = await getDoc(doc(db, 'orders', orderId));
  if (!orderSnap.exists()) return { error: 'Order not found' };
  const order = orderSnap.data();
  if (order.user_id !== userId) return { error: 'Unauthorized' };
  if (!['placed', 'pending', 'confirmed'].includes(order.status)) return { error: 'Order cannot be cancelled at this stage' };
  try {
    await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled', updated_at: new Date().toISOString() });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminFetchAllCustomers() {
  const snap = await getDocs(query(collection(db, 'profiles'), where('role', '==', 'customer')));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

// ── Admin: Products ────────────────────────────────────────────────────────────

export async function adminCreateProduct(product: any) {
  try {
    const docRef = await addDoc(collection(db, 'products'), {
      ...product,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function adminUpdateProduct(id: string, updates: any) {
  try {
    await updateDoc(doc(db, 'products', id), { ...updates, updated_at: new Date().toISOString() });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminDeleteProduct(id: string) {
  try {
    await updateDoc(doc(db, 'products', id), { is_active: false, updated_at: new Date().toISOString() });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Admin: Categories ────────────────────────────────────────────────────────────

export async function adminCreateCategory(category: { name: string; icon: string; color: string }) {
  try {
    const docRef = await addDoc(collection(db, 'categories'), {
      ...category,
      sort_order: 0,
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function adminUpdateCategory(id: string, updates: any) {
  try {
    await updateDoc(doc(db, 'categories', id), updates);
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminDeleteCategory(id: string) {
  try {
    await deleteDoc(doc(db, 'categories', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Admin: Banners ────────────────────────────────────────────────────────────────

export async function adminCreateBanner(banner: any) {
  try {
    const docRef = await addDoc(collection(db, 'banners'), {
      ...banner,
      is_active: banner.is_active !== false,
      priority: banner.priority || 0,
      sort_order: banner.sort_order || 0,
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function adminUploadBannerImage(
  file: File,
  slot: 'desktop' | 'mobile'
): Promise<{ url: string | null; error: string | null }> {
  try {
    const { url } = await uploadToImageKit(file, `banner-${slot}-${Date.now()}`);
    return { url, error: null };
  } catch (e: any) {
    return { url: null, error: e.message };
  }
}

export async function adminUpdateBanner(id: string, updates: any) {
  try {
    await updateDoc(doc(db, 'banners', id), updates);
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminDeleteBanner(id: string) {
  try {
    await deleteDoc(doc(db, 'banners', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Admin: Dashboard Stats ────────────────────────────────────────────────────────

export async function adminGetStats() {
  const [prodSnap, orderSnap, custSnap] = await Promise.all([
    getDocs(query(collection(db, 'products'), where('is_active', '!=', false))),
    getDocs(collection(db, 'orders')),
    getDocs(query(collection(db, 'profiles'), where('role', '==', 'customer'))),
  ]);

  const products: AnyRecord[] = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const orderData: AnyRecord[] = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const revenue = orderData.reduce((sum, o) => sum + Number(o.total || 0), 0);

  // Net Profit = Revenue - Total Product Cost - Delivery Cost
  const productCostMap: Record<string, number> = {};
  products.forEach(p => { productCostMap[p.id] = Number(p.cost_price) || 0; });
  let totalProductCost = 0;
  orderData.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item: any) => {
      const pid = item.product_id || item.id || '';
      const cost = productCostMap[pid] || 0;
      totalProductCost += cost * Number(item.quantity || 1);
    });
  });
  const totalDeliveryCost = orderData.reduce((sum, o) => sum + Number(o.delivery_charge || 0), 0);
  const netProfit = revenue - totalProductCost - totalDeliveryCost;

  const pendingOrders = orderData.filter(o =>
    ['placed', 'pending', 'received', 'confirmed', 'processing', 'packed', 'ready_for_delivery', 'shipped', 'out_for_delivery', 'dispatched'].includes(o.status)
  ).length;
  const deliveredOrders = orderData.filter(o => o.status === 'delivered').length;

  const today = new Date().toDateString();
  const todaysOrders = orderData.filter(o => new Date(o.created_at).toDateString() === today);
  const todaysSales = todaysOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });
  const revenueChart = last7.map(day => ({
    day: new Date(day).toLocaleDateString('en', { weekday: 'short' }),
    revenue: orderData.filter(o => new Date(o.created_at).toDateString() === day)
      .reduce((s, o) => s + Number(o.total || 0), 0),
  }));

  // Top Selling Products
  const productSalesMap: Record<string, { name: string; qty: number; revenue: number; image?: string }> = {};
  orderData.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item: any) => {
      const id = item.product_id || item.id || 'unknown';
      if (!productSalesMap[id]) productSalesMap[id] = { name: item.name || 'Unknown', qty: 0, revenue: 0, image: item.image };
      productSalesMap[id].qty += Number(item.quantity || 1);
      productSalesMap[id].revenue += Number(item.price || 0) * Number(item.quantity || 1);
    });
  });
  const topSellingProducts = Object.entries(productSalesMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Low Stock Alerts
  const lowStockProducts = products
    .filter(p => Number(p.stock) <= Number(p.low_stock_threshold || 5))
    .map(p => ({ id: p.id, name: p.name, stock: Number(p.stock) || 0, threshold: Number(p.low_stock_threshold) || 5, image: p.image || '' }));

  // Sales Target (from settings/targets)
  let salesTarget = 100000;
  let monthlyRevenue = 0;
  try {
    const settingsSnap = await getDoc(doc(db, 'settings', 'targets'));
    if (settingsSnap.exists() && settingsSnap.data()) {
      const data = settingsSnap.data();
      salesTarget = Number(data.monthly_sales_target) || 100000;
    }
  } catch {}
  const now = new Date();
  monthlyRevenue = orderData.filter(o => {
    const d = new Date(o.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, o) => s + Number(o.total || 0), 0);

  return {
    totalProducts: prodSnap.size,
    totalOrders: orderSnap.size,
    totalCustomers: custSnap.size,
    totalRevenue: revenue,
    netProfit,
    totalProductCost,
    totalDeliveryCost,
    pendingOrders,
    deliveredOrders,
    todaysSales,
    revenueChart,
    topSellingProducts,
    lowStockProducts,
    salesTarget,
    monthlyRevenue,
  };
}

// ── Brands ────────────────────────────────────────────────────────────────────

export async function fetchBrands() {
  const snap = await getDocs(query(collection(db, 'brands'), where('is_active', '!=', false)));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

export async function adminFetchBrands() {
  const snap = await getDocs(collection(db, 'brands'));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function adminCreateBrand(brand: { name: string; logo_url?: string }) {
  try {
    const docRef = await addDoc(collection(db, 'brands'), {
      ...brand,
      is_active: true,
      sort_order: 0,
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function adminUpdateBrand(id: string, updates: any) {
  try {
    await updateDoc(doc(db, 'brands', id), { ...updates, updated_at: new Date().toISOString() });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminDeleteBrand(id: string) {
  try {
    await updateDoc(doc(db, 'brands', id), { is_active: false, updated_at: new Date().toISOString() });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function adminFetchReviews() {
  const snap = await getDocs(collection(db, 'reviews'));
  const results: AnyRecord[] = await Promise.all(snap.docs.map(async d => {
    const data = d.data();
    const pSnap = data.product_id ? await getDoc(doc(db, 'products', data.product_id)) : null;
    const uSnap = data.user_id ? await getDoc(doc(db, 'profiles', data.user_id)) : null;
    return {
      id: d.id,
      ...data,
      products: pSnap?.exists() ? { name: pSnap.data().name } : null,
      profiles: uSnap?.exists() ? { full_name: uSnap.data().full_name } : null,
    };
  }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function adminUpdateReview(id: string, is_approved: boolean) {
  try {
    await updateDoc(doc(db, 'reviews', id), { is_approved });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminDeleteReview(id: string) {
  try {
    await deleteDoc(doc(db, 'reviews', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Coupons ───────────────────────────────────────────────────────────────────

export async function adminFetchCoupons() {
  const snap = await getDocs(collection(db, 'coupons'));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function adminCreateCoupon(coupon: any) {
  try {
    const docRef = await addDoc(collection(db, 'coupons'), {
      ...coupon,
      used_count: 0,
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function adminUpdateCoupon(id: string, updates: any) {
  try {
    await updateDoc(doc(db, 'coupons', id), { ...updates, updated_at: new Date().toISOString() });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminDeleteCoupon(id: string) {
  try {
    await deleteDoc(doc(db, 'coupons', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function adminFetchNotifications() {
  const snap = await getDocs(collection(db, 'notifications'));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function adminCreateNotification(notif: any) {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notif,
      is_sent: false,
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

// ── Notification Campaigns ─────────────────────────────────────────────────────

export async function adminFetchCampaigns() {
  const snap = await getDocs(collection(db, 'notification_campaigns'));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function adminCreateCampaign(campaign: {
  title: string;
  message: string;
  type: string;
  category: string;
  channel: string;
  target: string;
  link?: string;
  image_url?: string;
}) {
  try {
    const docRef = await addDoc(collection(db, 'notification_campaigns'), {
      ...campaign,
      status: 'draft',
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function adminDeleteCampaign(id: string) {
  try {
    await deleteDoc(doc(db, 'notification_campaigns', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminSendCampaign(_campaignId: string, _payload: {
  title: string;
  message: string;
  type: string;
  category: string;
  channel: string;
  target: string;
  link?: string;
}): Promise<{ error: string | null; data: { total: number } | null }> {
  return { error: 'Push notifications require a server function. Campaign saved to Firestore.', data: null };
}

export async function adminDeleteNotification(id: string) {
  try {
    await deleteDoc(doc(db, 'notifications', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminMarkNotificationSent(id: string) {
  try {
    await updateDoc(doc(db, 'notifications', id), { is_sent: true, sent_at: new Date().toISOString() });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Flash Sales ────────────────────────────────────────────────────────────────

export async function adminFetchFlashSales() {
  const snap = await getDocs(collection(db, 'flash_sales'));
  const results: AnyRecord[] = await Promise.all(snap.docs.map(async d => {
    const data = d.data();
    const pSnap = data.product_id ? await getDoc(doc(db, 'products', data.product_id)) : null;
    return {
      id: d.id,
      ...data,
      products: pSnap?.exists() ? { name: pSnap.data().name, image: pSnap.data().image } : null,
    };
  }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function adminCreateFlashSale(sale: any) {
  try {
    const docRef = await addDoc(collection(db, 'flash_sales'), {
      ...sale,
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function adminUpdateFlashSale(id: string, updates: any) {
  try {
    await updateDoc(doc(db, 'flash_sales', id), updates);
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminDeleteFlashSale(id: string) {
  try {
    await deleteDoc(doc(db, 'flash_sales', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Marketing Campaigns ───────────────────────────────────────────────────────

export async function adminFetchMarketingCampaigns() {
  const snap = await getDocs(collection(db, 'campaigns'));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

export async function adminCreateMarketingCampaign(campaign: any) {
  try {
    const docRef = await addDoc(collection(db, 'campaigns'), {
      ...campaign,
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function adminUpdateMarketingCampaign(id: string, updates: any) {
  try {
    await updateDoc(doc(db, 'campaigns', id), { ...updates, updated_at: new Date().toISOString() });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminDeleteMarketingCampaign(id: string) {
  try {
    await deleteDoc(doc(db, 'campaigns', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminUploadCampaignBanner(file: File): Promise<{ url: string | null; error: string | null }> {
  try {
    const { url } = await uploadToImageKit(file, `campaign-${Date.now()}`);
    return { url, error: null };
  } catch (e: any) {
    return { url: null, error: e.message };
  }
}

// ── Admin: Payment Methods ────────────────────────────────────────────────────

export async function adminFetchPaymentMethods() {
  const snap = await getDocs(collection(db, 'payment_methods'));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

export async function adminCreatePaymentMethod(method: any) {
  try {
    const docRef = await addDoc(collection(db, 'payment_methods'), {
      ...method,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function adminUpdatePaymentMethod(id: string, updates: any) {
  try {
    await updateDoc(doc(db, 'payment_methods', id), { ...updates, updated_at: new Date().toISOString() });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminDeletePaymentMethod(id: string) {
  try {
    await deleteDoc(doc(db, 'payment_methods', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Admin: Orders (extended) ──────────────────────────────────────────────────

export async function adminUpdateOrderDeliveryCharge(orderId: string, deliveryCharge: number, newTotal: number) {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      delivery_charge: deliveryCharge,
      total: newTotal,
      updated_at: new Date().toISOString(),
    });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminFetchOrderWithProfile(orderId: string) {
  const oSnap = await getDoc(doc(db, 'orders', orderId));
  if (!oSnap.exists()) return null;
  const order: AnyRecord = { id: oSnap.id, ...oSnap.data() };
  if (order.user_id) {
    const pSnap = await getDoc(doc(db, 'profiles', order.user_id));
    if (pSnap.exists()) {
      order.profiles = { full_name: pSnap.data().full_name, phone: pSnap.data().phone, id: pSnap.id };
    }
  }
  return order;
}

// ── Admin: Customers (with stats) ─────────────────────────────────────────────

export async function adminFetchCustomersWithStats() {
  const [custSnap, orderSnap] = await Promise.all([
    getDocs(query(collection(db, 'profiles'), where('role', '==', 'customer'))),
    getDocs(collection(db, 'orders')),
  ]);
  const orders: AnyRecord[] = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const customers: AnyRecord[] = custSnap.docs.map(d => {
    const p: AnyRecord = { id: d.id, ...d.data() };
    const custOrders = orders.filter(o => o.user_id === p.id);
    const completedOrders = custOrders.filter(o => o.status === 'delivered');
    const ltv = completedOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0);
    return {
      ...p,
      totalOrders: custOrders.length,
      totalSpent: custOrders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
      ltv,
      is_blacklisted: p.is_blacklisted || false,
      blacklist_reason: p.blacklist_reason || '',
      lastOrderDate: custOrders.length > 0
        ? custOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null,
    };
  });
  customers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return customers;
}

export async function adminUpdateCustomerBlacklist(customerId: string, isBlacklisted: boolean, reason?: string) {
  try {
    await updateDoc(doc(db, 'profiles', customerId), {
      is_blacklisted: isBlacklisted,
      blacklist_reason: reason || '',
      updated_at: new Date().toISOString(),
    });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminUpdateOrderCourier(orderId: string, courierPartner: string, trackingId: string) {
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      courier_partner: courierPartner || null,
      courier_tracking_id: trackingId || null,
      updated_at: new Date().toISOString(),
    });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function adminFetchCustomerOrders(customerId: string) {
  const snap = await getDocs(query(collection(db, 'orders'), where('user_id', '==', customerId)));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results.slice(0, 50);
}

// ── Admin: Dashboard (delivery & coupon stats) ────────────────────────────────

export async function adminFetchDeliveryStats() {
  const snap = await getDocs(collection(db, 'orders'));
  const orders: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const paid = orders.filter(o => Number(o.delivery_charge) > 0);
  const free = orders.filter(o => Number(o.delivery_charge) === 0);
  const totalIncome = paid.reduce((s, o) => s + Number(o.delivery_charge), 0);
  return { totalIncome, freeCount: free.length, paidCount: paid.length, totalOrders: orders.length };
}

export async function adminFetchCouponStats() {
  const [couponSnap, orderSnap] = await Promise.all([
    getDocs(collection(db, 'coupons')),
    getDocs(collection(db, 'orders')),
  ]);
  const coupons: AnyRecord[] = couponSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const orders: AnyRecord[] = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const couponUsage = orders.filter(o => o.coupon_code);
  const totalDiscount = orders.reduce((s, o) => s + Number(o.coupon_discount || o.discount || 0), 0);
  const deliveryDiscount = orders.reduce((s, o) => s + Number(o.delivery_discount || 0), 0);
  return {
    totalCoupons: coupons.length,
    activeCoupons: coupons.filter(c => c.is_active).length,
    totalUsage: couponUsage.length,
    totalDiscount,
    deliveryDiscount,
    totalOrders: orders.length,
    coupons,
    couponUsage: couponUsage.map(o => ({ coupon_code: o.coupon_code, created_at: o.created_at })),
  };
}

// ── Settings ───────────────────────────────────────────────────────────────────

export async function adminFetchSettings(key: string) {
  const snap = await getDoc(doc(db, 'settings', key));
  return snap.exists() ? snap.data().value : null;
}

export async function adminUpsertSettings(key: string, value: any) {
  try {
    await setDoc(doc(db, 'settings', key), { value, updated_at: new Date().toISOString() });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── User Notifications ────────────────────────────────────────────────────────

export async function fetchUserNotifications(userId: string) {
  const snap = await getDocs(query(collection(db, 'user_notifications'), where('user_id', '==', userId)));
  const results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results.slice(0, 50);
}

export async function markNotificationRead(id: string) {
  try {
    await updateDoc(doc(db, 'user_notifications', id), { is_read: true });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function markAllNotificationsRead(userId: string) {
  const snap = await getDocs(query(
    collection(db, 'user_notifications'),
    where('user_id', '==', userId),
    where('is_read', '==', false),
  ));
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { is_read: true })));
  return { error: null };
}

export async function deleteUserNotification(id: string) {
  try {
    await deleteDoc(doc(db, 'user_notifications', id));
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function fetchUserCoupons() {
  const snap = await getDocs(query(collection(db, 'coupons'), where('is_active', '==', true)));
  const now = new Date();
  let results: AnyRecord[] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  results = results.filter(c => !c.expires_at || new Date(c.expires_at) >= now);
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function createPayment(payment: {
  order_id: string;
  user_id: string;
  method: string;
  amount: number;
  currency?: string;
  gateway_ref?: string;
  gateway_session?: string;
}) {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...payment,
      currency: payment.currency || 'BDT',
      status: 'pending',
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) {
    return { data: null, error: e.message };
  }
}

export async function submitManualPayment(paymentId: string, txId: string, senderNumber: string) {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      transaction_id: txId,
      sender_number: senderNumber,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    });
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function fetchPayment(orderId: string) {
  const snap = await getDocs(query(collection(db, 'payments'), where('order_id', '==', orderId)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function fetchUserPayments(userId: string) {
  const snap = await getDocs(query(collection(db, 'payments'), where('user_id', '==', userId)));
  const results: AnyRecord[] = await Promise.all(snap.docs.map(async d => {
    const data = d.data();
    const oSnap = data.order_id ? await getDoc(doc(db, 'orders', data.order_id)) : null;
    return {
      id: d.id,
      ...data,
      orders: oSnap?.exists() ? { order_number: oSnap.data().order_number, total: oSnap.data().total, status: oSnap.data().status, created_at: oSnap.data().created_at, items: oSnap.data().items } : null,
    };
  }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function initiateStripePayment(_orderId: string, _amount: number) {
  return { error: 'Stripe requires a server function. Configure Firebase Cloud Functions for Stripe payments.', client_secret: null, payment_intent_id: null };
}

export async function initiateSSLCommerzPayment(_payload: {
  order_id: string;
  amount: number;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_address: string;
}) {
  return { error: 'SSLCommerz requires a server function. Configure Firebase Cloud Functions for SSLCommerz payments.', gateway_url: null, session_key: null };
}

export async function adminFetchAllPayments(filters?: { status?: string; method?: string; search?: string }) {
  const snap = await getDocs(collection(db, 'payments'));
  let results: AnyRecord[] = await Promise.all(snap.docs.map(async d => {
    const data = d.data();
    const oSnap = data.order_id ? await getDoc(doc(db, 'orders', data.order_id)) : null;
    return { id: d.id, ...data, orders: oSnap?.exists() ? { order_number: oSnap.data().order_number, total: oSnap.data().total, status: oSnap.data().status, address: oSnap.data().address } : null };
  }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  if (filters?.status && filters.status !== 'all') results = results.filter(p => p.status === filters.status);
  if (filters?.method && filters.method !== 'all') results = results.filter(p => p.method === filters.method);
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    results = results.filter(p =>
      (p.transaction_id || '').toLowerCase().includes(s) ||
      (p.orders?.order_number || '').toLowerCase().includes(s) ||
      (p.gateway_ref || '').toLowerCase().includes(s)
    );
  }
  return results.slice(0, 200);
}

export async function adminUpdatePaymentStatus(paymentId: string, status: string, notes?: string) {
  const updates: any = { status };
  if (notes) updates.notes = notes;
  if (status === 'verified') updates.verified_at = new Date().toISOString();
  if (status === 'refunded') updates.refunded_at = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'payments', paymentId), updates);
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Reports & Analytics ────────────────────────────────────────────────────────

export type AnalyticsPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

function getAnalyticsDateRange(period: AnalyticsPeriod): { start: Date; prevStart: Date } {
  const now = new Date();
  const D = 86400000;
  switch (period) {
    case 'daily':
      return { start: new Date(now.getTime() - 30 * D), prevStart: new Date(now.getTime() - 60 * D) };
    case 'weekly':
      return { start: new Date(now.getTime() - 84 * D), prevStart: new Date(now.getTime() - 168 * D) };
    case 'monthly':
      return { start: new Date(now.getTime() - 365 * D), prevStart: new Date(now.getTime() - 730 * D) };
    case 'yearly':
      return { start: new Date('2020-01-01T00:00:00Z'), prevStart: new Date('2015-01-01T00:00:00Z') };
  }
}

function buildTimeBuckets(period: AnalyticsPeriod) {
  const now = new Date();
  const buckets: { label: string; start: Date; end: Date }[] = [];
  if (period === 'daily') {
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({
        label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        start: d,
        end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      });
    }
  } else if (period === 'weekly') {
    for (let i = 11; i >= 0; i--) {
      const s = new Date(now.getTime() - i * 7 * 86400000);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s.getTime() + 7 * 86400000);
      buckets.push({ label: s.toLocaleDateString('en', { month: 'short', day: 'numeric' }), start: s, end: e });
    }
  } else if (period === 'monthly') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        label: d.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        start: d,
        end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      });
    }
  } else {
    const y = now.getFullYear();
    for (let yr = y - 4; yr <= y; yr++) {
      buckets.push({ label: String(yr), start: new Date(yr, 0, 1), end: new Date(yr + 1, 0, 1) });
    }
  }
  return buckets;
}

export async function adminGetAnalytics(period: AnalyticsPeriod) {
  const { start, prevStart } = getAnalyticsDateRange(period);

  const [ordersSnap, customersSnap, productsSnap] = await Promise.all([
    getDocs(collection(db, 'orders')),
    getDocs(query(collection(db, 'profiles'), where('role', '==', 'customer'))),
    getDocs(query(collection(db, 'products'), where('is_active', '!=', false))),
  ]);

  const allOrders: AnyRecord[] = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const orders = allOrders.filter(o => new Date(o.created_at) >= start);
  const prevOrders = allOrders.filter(o => {
    const d = new Date(o.created_at);
    return d >= prevStart && d < start;
  });
  const customers: AnyRecord[] = customersSnap.docs.map(d => ({ id: d.id, ...d.data() } as AnyRecord))
    .filter((c: AnyRecord) => new Date(c.created_at) >= start);
  const prevCusts: AnyRecord[] = customersSnap.docs.map(d => ({ id: d.id, ...d.data() } as AnyRecord))
    .filter((c: AnyRecord) => {
      const d = new Date(c.created_at);
      return d >= prevStart && d < start;
    });
  const products: AnyRecord[] = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const avgOrder = orders.length > 0 ? revenue / orders.length : 0;
  const prevAvgOrder = prevOrders.length > 0 ? prevRevenue / prevOrders.length : 0;

  const pct = (cur: number, prev: number) =>
    prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

  const buckets = buildTimeBuckets(period);
  const timeSeries = buckets.map(b => {
    const bOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= b.start && d < b.end;
    });
    const bCusts = customers.filter(c => {
      const d = new Date(c.created_at);
      return d >= b.start && d < b.end;
    });
    return {
      label: b.label,
      revenue: bOrders.reduce((s, o) => s + Number(o.total || 0), 0),
      orders: bOrders.length,
      customers: bCusts.length,
    };
  });

  const paymentMethods = ['cash_on_delivery', 'bkash', 'nagad', 'stripe', 'sslcommerz', 'bank_transfer']
    .map(m => ({
      method: m,
      count: orders.filter(o => o.payment_method === m).length,
      revenue: orders.filter(o => o.payment_method === m).reduce((s, o) => s + Number(o.total || 0), 0),
    }))
    .filter(m => m.count > 0)
    .sort((a, b) => b.revenue - a.revenue);

  const statuses = ['placed', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled']
    .map(s => ({ status: s, count: orders.filter(o => o.status === s).length }));

  const productMap: Record<string, { name: string; qty: number; revenue: number; image?: string }> = {};
  orders.forEach(o => {
    const items = Array.isArray(o.items) ? o.items : [];
    items.forEach((item: any) => {
      const id = item.product_id || item.id || 'unknown';
      if (!productMap[id]) productMap[id] = { name: item.name || 'Unknown', qty: 0, revenue: 0, image: item.image };
      productMap[id].qty += Number(item.quantity || 1);
      productMap[id].revenue += Number(item.price || 0) * Number(item.quantity || 1);
    });
  });
  const topProducts = Object.entries(productMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    kpis: {
      revenue, revenueChange: pct(revenue, prevRevenue),
      orders: orders.length, ordersChange: pct(orders.length, prevOrders.length),
      customers: customers.length, customersChange: pct(customers.length, prevCusts.length),
      avgOrder, avgOrderChange: pct(avgOrder, prevAvgOrder),
    },
    timeSeries,
    paymentMethods,
    statuses,
    topProducts,
    lowStock: products.filter(p => p.stock < 5),
    rawOrders: orders,
    rawCustomers: customers,
  };
}

export async function adminGetReports() {
  const [ordersSnap, productsSnap, customersSnap] = await Promise.all([
    getDocs(collection(db, 'orders')),
    getDocs(query(collection(db, 'products'), where('is_active', '!=', false))),
    getDocs(query(collection(db, 'profiles'), where('role', '==', 'customer'))),
  ]);

  const orderData: AnyRecord[] = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const productData: AnyRecord[] = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const customerData: AnyRecord[] = customersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en', { month: 'short' }) };
  });

  const revenueByMonth = months.map(m => ({
    label: m.label,
    revenue: orderData.filter(o => {
      const d = new Date(o.created_at);
      return `${d.getFullYear()}-${d.getMonth()}` === m.key;
    }).reduce((s, o) => s + Number(o.total || 0), 0),
  }));

  const byStatus = ['placed', 'processing', 'packed', 'out_for_delivery', 'delivered', 'cancelled'].map(s => ({
    status: s,
    count: orderData.filter(o => o.status === s).length,
  }));

  const byPayment = ['cash_on_delivery', 'bkash', 'nagad', 'card'].map(p => ({
    method: p,
    count: orderData.filter(o => o.payment_method === p).length,
    revenue: orderData.filter(o => o.payment_method === p).reduce((s, o) => s + Number(o.total || 0), 0),
  }));

  const lowStock = productData.filter(p => p.stock < 5);

  return { revenueByMonth, byStatus, byPayment, lowStock, totalCustomers: customerData.length };
}
