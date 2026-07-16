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
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { Product, Category } from './types';

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
    is_featured: p.is_featured || false,
    is_trending: p.is_trending || false,
    is_new: p.is_new || false,
    is_best_selling: p.is_best_selling || false,
    is_active: p.is_active !== false,
    created_at: p.created_at || new Date().toISOString(),
  };
}

export async function searchProducts(filters: SearchFilters): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, 'products'), where('is_active', '!=', false)));
  const [catMap, brandMap] = await Promise.all([getCategoriesMap(), getBrandsMap()]);
  let results = snap.docs.map(d => mapProduct(d.id, d.data(), catMap, brandMap));

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
  const results = snap.docs.map(d => ({
    id: d.id,
    name: d.data().name || '',
    icon: d.data().icon || '',
    color: d.data().color || '',
  }));
  results.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

export async function fetchProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, 'products'), where('is_active', '!=', false)));
  const [catMap, brandMap] = await Promise.all([getCategoriesMap(), getBrandsMap()]);
  const results = snap.docs.map(d => mapProduct(d.id, d.data(), catMap, brandMap));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function fetchBanners() {
  const snap = await getDocs(collection(db, 'banners'));
  const now = new Date();
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  results = results.filter(b => {
    if (b.is_active === false) return false;
    if (b.starts_at && new Date(b.starts_at) > now) return false;
    if (b.ends_at && new Date(b.ends_at) < now) return false;
    return true;
  });
  results.sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function fetchOrders(userId: string) {
  const snap = await getDocs(query(collection(db, 'orders'), where('user_id', '==', userId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export function subscribeToOrders(
  userId: string,
  callback: (orders: any[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(collection(db, 'orders'), where('user_id', '==', userId));
  return onSnapshot(
    q,
    (snap) => {
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      callback(results);
    },
    (err) => onError?.(err)
  );
}

export async function createOrder(order: {
  user_id: string | null;
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

// ── Coupons ──────────────────────────────────────────────────────────────────

export async function validateCoupon(code: string, subtotal: number): Promise<{ discount: number; type: string; value: number; free_delivery: boolean; error: string | null }> {
  const snap = await getDocs(query(collection(db, 'coupons'), where('code', '==', code.toUpperCase())));
  if (snap.empty) return { discount: 0, type: '', value: 0, free_delivery: false, error: 'Invalid coupon code' };
  const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as any;
  if (!data.is_active) return { discount: 0, type: '', value: 0, free_delivery: false, error: 'Coupon is not active' };
  const now = new Date();
  if (data.expires_at && new Date(data.expires_at) < now) return { discount: 0, type: '', value: 0, free_delivery: false, error: 'Coupon has expired' };
  if (data.max_uses && (data.used_count || 0) >= data.max_uses) return { discount: 0, type: '', value: 0, free_delivery: false, error: 'Coupon usage limit reached' };
  if (data.min_order && subtotal < data.min_order) return { discount: 0, type: '', value: 0, free_delivery: false, error: `Minimum order ৳${data.min_order} required` };
  const discount = data.type === 'percentage' ? Math.round((subtotal * data.value) / 100) : Math.min(data.value, subtotal);
  return { discount, type: data.type, value: data.value, free_delivery: data.free_delivery || false, error: null };
}

export async function incrementCouponUsage(code: string) {
  const snap = await getDocs(query(collection(db, 'coupons'), where('code', '==', code.toUpperCase())));
  if (snap.empty) return;
  const data = snap.docs[0].data();
  await updateDoc(snap.docs[0].ref, { used_count: (data.used_count || 0) + 1 });
}

// ── Addresses ──────────────────────────────────────────────────────────────────

export async function fetchAddresses(userId: string) {
  const snap = await getDocs(query(collection(db, 'addresses'), where('user_id', '==', userId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  results.sort((a, b) => Number(b.is_default || 0) - Number(a.is_default || 0));
  return results;
}

export async function createAddress(address: {
  user_id: string; label: string; full_name: string; phone: string;
  address: string; area: string; city: string; notes?: string; is_default?: boolean;
}) {
  try {
    const docRef = await addDoc(collection(db, 'addresses'), { ...address, created_at: new Date().toISOString() });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) { return { data: null, error: e.message }; }
}

export async function updateAddress(id: string, updates: any) {
  try { await updateDoc(doc(db, 'addresses', id), updates); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

export async function deleteAddress(id: string) {
  try { await deleteDoc(doc(db, 'addresses', id)); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

// ── Wishlist ──────────────────────────────────────────────────────────────────

export async function fetchWishlist(userId: string) {
  const snap = await getDocs(query(collection(db, 'wishlist'), where('user_id', '==', userId)));
  const catMap = await getCategoriesMap();
  const results = await Promise.all(snap.docs.map(async w => {
    const wd = w.data();
    const pSnap = await getDoc(doc(db, 'products', wd.product_id));
    const p = pSnap.exists() ? pSnap.data() : null;
    return { id: w.id, ...wd, product: p ? { id: pSnap.id, ...p, category: catMap[p.category_id]?.name || '' } : null };
  }));
  return results.filter(w => w.product);
}

export async function toggleWishlist(userId: string, productId: string) {
  const snap = await getDocs(query(collection(db, 'wishlist'), where('user_id', '==', userId), where('product_id', '==', productId)));
  if (!snap.empty) { await deleteDoc(snap.docs[0].ref); return { added: false }; }
  await addDoc(collection(db, 'wishlist'), { user_id: userId, product_id: productId, created_at: new Date().toISOString() });
  return { added: true };
}

// ── Order Timeline & Cancel ───────────────────────────────────────────────────

export async function fetchOrderTimeline(orderId: string) {
  const snap = await getDocs(query(collection(db, 'order_timeline'), where('order_id', '==', orderId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  results.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return results;
}

export async function cancelOrder(orderId: string, userId: string) {
  const orderSnap = await getDoc(doc(db, 'orders', orderId));
  if (!orderSnap.exists()) return { error: 'Order not found' };
  const order = orderSnap.data();
  if (order.user_id !== userId) return { error: 'Unauthorized' };
  if (!['placed', 'pending', 'confirmed'].includes(order.status)) return { error: 'Order cannot be cancelled' };
  try { await updateDoc(doc(db, 'orders', orderId), { status: 'cancelled', updated_at: new Date().toISOString() }); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

// ── Admin functions (shared, same Firestore) ──────────────────────────────────

export async function adminFetchAllProducts() {
  const snap = await getDocs(collection(db, 'products'));
  const [catMap, brandMap] = await Promise.all([getCategoriesMap(), getBrandsMap()]);
  const results = snap.docs.map(d => mapProduct(d.id, d.data(), catMap, brandMap));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function adminFetchBanners() {
  const snap = await getDocs(collection(db, 'banners'));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  results.sort((a, b) => (b.priority || 0) - (a.priority || 0) || (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

export async function adminCreateProduct(product: any) {
  try {
    const docRef = await addDoc(collection(db, 'products'), { ...product, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) { return { data: null, error: e.message }; }
}

export async function adminUpdateProduct(id: string, updates: any) {
  try { await updateDoc(doc(db, 'products', id), { ...updates, updated_at: new Date().toISOString() }); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

export async function adminDeleteProduct(id: string) {
  try { await updateDoc(doc(db, 'products', id), { is_active: false, updated_at: new Date().toISOString() }); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

export async function adminCreateCategory(category: { name: string; icon: string; color: string }) {
  try {
    const docRef = await addDoc(collection(db, 'categories'), { ...category, sort_order: 0, created_at: new Date().toISOString() });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) { return { data: null, error: e.message }; }
}

export async function adminUpdateCategory(id: string, updates: any) {
  try { await updateDoc(doc(db, 'categories', id), updates); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

export async function adminDeleteCategory(id: string) {
  try { await deleteDoc(doc(db, 'categories', id)); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

export async function adminCreateBanner(banner: any) {
  try {
    const docRef = await addDoc(collection(db, 'banners'), { ...banner, is_active: banner.is_active !== false, priority: banner.priority || 0, sort_order: banner.sort_order || 0, created_at: new Date().toISOString() });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) { return { data: null, error: e.message }; }
}

export async function adminUpdateBanner(id: string, updates: any) {
  try { await updateDoc(doc(db, 'banners', id), updates); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

export async function adminDeleteBanner(id: string) {
  try { await deleteDoc(doc(db, 'banners', id)); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

export async function adminGetStats() {
  const [prodSnap, orderSnap, custSnap] = await Promise.all([
    getDocs(query(collection(db, 'products'), where('is_active', '!=', false))),
    getDocs(collection(db, 'orders')),
    getDocs(query(collection(db, 'profiles'), where('role', '==', 'customer'))),
  ]);
  const orderData = orderSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  const revenue = orderData.reduce((s, o) => s + Number(o.total || 0), 0);
  const pendingOrders = orderData.filter(o => ['placed', 'pending', 'confirmed', 'processing', 'packed', 'out_for_delivery'].includes(o.status)).length;
  const deliveredOrders = orderData.filter(o => o.status === 'delivered').length;
  const today = new Date().toDateString();
  const todaysOrders = orderData.filter(o => new Date(o.created_at).toDateString() === today);
  const todaysSales = todaysOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toDateString(); });
  const revenueChart = last7.map(day => ({ day: new Date(day).toLocaleDateString('en', { weekday: 'short' }), revenue: orderData.filter(o => new Date(o.created_at).toDateString() === day).reduce((s, o) => s + Number(o.total || 0), 0) }));
  return { totalProducts: prodSnap.size, totalOrders: orderSnap.size, totalCustomers: custSnap.size, totalRevenue: revenue, pendingOrders, deliveredOrders, todaysSales, revenueChart };
}

// ── Brands ────────────────────────────────────────────────────────────────────

export async function fetchBrands() {
  const snap = await getDocs(query(collection(db, 'brands'), where('is_active', '!=', false)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return results;
}

export async function adminFetchBrands() {
  const snap = await getDocs(collection(db, 'brands'));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function adminFetchReviews() {
  const snap = await getDocs(collection(db, 'reviews'));
  const results = await Promise.all(snap.docs.map(async d => {
    const data = d.data();
    const pSnap = data.product_id ? await getDoc(doc(db, 'products', data.product_id)) : null;
    const uSnap = data.user_id ? await getDoc(doc(db, 'profiles', data.user_id)) : null;
    return { id: d.id, ...data, products: pSnap?.exists() ? { name: pSnap.data().name } : null, profiles: uSnap?.exists() ? { full_name: uSnap.data().full_name } : null };
  }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function adminFetchSettings(key: string) {
  const snap = await getDoc(doc(db, 'settings', key));
  return snap.exists() ? snap.data().value : null;
}

export async function adminUpsertSettings(key: string, value: any) {
  try { await setDoc(doc(db, 'settings', key), { value, updated_at: new Date().toISOString() }); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

// ── User Notifications ────────────────────────────────────────────────────────

export async function fetchUserNotifications(userId: string) {
  const snap = await getDocs(query(collection(db, 'user_notifications'), where('user_id', '==', userId)));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results.slice(0, 50);
}

export async function markNotificationRead(id: string) {
  try { await updateDoc(doc(db, 'user_notifications', id), { is_read: true }); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

export async function markAllNotificationsRead(userId: string) {
  const snap = await getDocs(query(collection(db, 'user_notifications'), where('user_id', '==', userId), where('is_read', '==', false)));
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { is_read: true })));
  return { error: null };
}

export async function deleteUserNotification(id: string) {
  try { await deleteDoc(doc(db, 'user_notifications', id)); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

export async function fetchUserCoupons() {
  const snap = await getDocs(query(collection(db, 'coupons'), where('is_active', '==', true)));
  const now = new Date();
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  results = results.filter(c => !c.expires_at || new Date(c.expires_at) >= now);
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

// ── Payments ──────────────────────────────────────────────────────────────────

export async function createPayment(payment: {
  order_id: string; user_id: string | null; method: string; amount: number;
  currency?: string; gateway_ref?: string; gateway_session?: string; order_number?: string;
}) {
  try {
    const docRef = await addDoc(collection(db, 'payments'), {
      ...payment,
      currency: payment.currency || 'BDT',
      status: 'pending',
      transaction_id: null,
      created_at: new Date().toISOString(),
    });
    return { data: { id: docRef.id }, error: null };
  } catch (e: any) { return { data: null, error: e.message }; }
}

export async function submitManualPayment(paymentId: string, txId: string, senderNumber: string, customerNote?: string, screenshotUrl?: string) {
  const updates: any = {
    transaction_id: txId,
    sender_number: senderNumber,
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  };
  if (customerNote) updates.customer_note = customerNote;
  if (screenshotUrl) updates.screenshot_url = screenshotUrl;
  try { await updateDoc(doc(db, 'payments', paymentId), updates); return { error: null }; }
  catch (e: any) { return { error: e.message }; }
}

export async function updatePaymentGatewayRef(paymentId: string, gatewayRef: string) {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      gateway_ref: gatewayRef,
      status: 'processing',
      updated_at: new Date().toISOString(),
    });
    return { error: null };
  } catch (e: any) { return { error: e.message }; }
}

export async function markPaymentPaid(paymentId: string, transactionId: string, method: string) {
  try {
    await updateDoc(doc(db, 'payments', paymentId), {
      transaction_id: transactionId,
      status: 'paid',
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return { error: null };
  } catch (e: any) { return { error: e.message }; }
}

export async function fetchPayment(orderId: string) {
  const snap = await getDocs(query(collection(db, 'payments'), where('order_id', '==', orderId)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function fetchUserPayments(userId: string) {
  const snap = await getDocs(query(collection(db, 'payments'), where('user_id', '==', userId)));
  const results = await Promise.all(snap.docs.map(async d => {
    const data = d.data();
    const oSnap = data.order_id ? await getDoc(doc(db, 'orders', data.order_id)) : null;
    return { id: d.id, ...data, orders: oSnap?.exists() ? { order_number: oSnap.data().order_number, total: oSnap.data().total, status: oSnap.data().status, created_at: oSnap.data().created_at, items: oSnap.data().items } : null };
  }));
  results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return results;
}

export async function initiateStripePayment(_orderId: string, _amount: number) {
  return { error: 'Stripe requires a server function. Configure Firebase Cloud Functions for Stripe.', client_secret: null, payment_intent_id: null };
}

export async function initiateSSLCommerzPayment(_payload: any) {
  return { error: 'SSLCommerz requires a server function. Configure Firebase Cloud Functions for SSLCommerz.', gateway_url: null, session_key: null };
}

// ── Settings & Payment Methods (customer-facing) ──────────────────────────────

export async function fetchDeliverySettings(): Promise<any> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'delivery_charges'));
    return snap.exists() ? snap.data().value : null;
  } catch {
    return null;
  }
}

export async function fetchActivePaymentMethods(methodType?: string): Promise<any[]> {
  try {
    let q = query(collection(db, 'payment_methods'), where('is_active', '==', true));
    const snap = await getDocs(q);
    let results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
    if (methodType) results = results.filter(m => m.payment_type === methodType);
    results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    return results;
  } catch {
    return [];
  }
}

export async function fetchBanglaQR(): Promise<string | null> {
  try {
    const snap = await getDoc(doc(db, 'settings', 'bangla_qr'));
    if (snap.exists() && snap.data()?.qr_image_url) return snap.data().qr_image_url;
    return null;
  } catch {
    return null;
  }
}

export async function fetchActiveCampaigns(): Promise<any[]> {
  const snap = await getDocs(query(collection(db, 'campaigns'), where('is_active', '==', true)));
  const now = new Date();
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
  results = results.filter(c => !c.end_date || new Date(c.end_date) >= now);
  results.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return results.slice(0, 5);
}

