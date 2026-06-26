import { supabase } from './supabase';
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

export async function searchProducts(filters: SearchFilters): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select('*, categories(name), brands(name)')
    .eq('is_active', true);

  if (filters.query && filters.query.trim().length > 0) {
    const q = filters.query.trim();
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,short_description.ilike.%${q}%,sku.ilike.%${q}%,tags.cs.{${q}}`);
  }

  if (filters.category) query = query.eq('category_id', filters.category);
  if (filters.brand) query = query.eq('brand_id', filters.brand);
  if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);
  if (filters.minRating !== undefined) query = query.gte('rating', filters.minRating);
  if (filters.inStock) query = query.gt('stock', 0);

  switch (filters.sortBy) {
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'best_selling':
      query = query.order('is_best_selling', { ascending: false }).order('reviews_count', { ascending: false });
      break;
    case 'price_asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('price', { ascending: false });
      break;
    case 'discount':
      query = query.not('discount_price', 'is', null).order('discount_price', { ascending: true });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query.limit(100);
  if (error) return [];

  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    discount_price: p.discount_price ? Number(p.discount_price) : null,
    image: p.image,
    images: p.images || [],
    category: p.categories?.name || '',
    category_id: p.category_id,
    brand: p.brands?.name || '',
    brand_id: p.brand_id,
    description: p.description,
    short_description: p.short_description || '',
    long_description: p.long_description || '',
    specifications: p.specifications || {},
    sku: p.sku || '',
    barcode: p.barcode || '',
    weight: p.weight ? Number(p.weight) : null,
    colors: p.colors || [],
    sizes: p.sizes || [],
    tags: p.tags || [],
    subcategory: p.subcategory || '',
    wholesale_price: p.wholesale_price ? Number(p.wholesale_price) : null,
    primary_image_index: p.primary_image_index || 0,
    rating: Number(p.rating),
    reviews_count: p.reviews_count,
    stock: p.stock,
    is_featured: p.is_featured,
    is_trending: p.is_trending,
    is_new: p.is_new,
    is_best_selling: p.is_best_selling || false,
    is_active: p.is_active,
    created_at: p.created_at,
  }));
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');
  if (error) return [];
  return data.map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
  }));
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), brands(name)')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data.map(p => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    discount_price: p.discount_price ? Number(p.discount_price) : null,
    wholesale_price: p.wholesale_price ? Number(p.wholesale_price) : null,
    image: p.image,
    images: p.images || [],
    category: p.categories?.name || '',
    category_id: p.category_id,
    brand: p.brands?.name || '',
    brand_id: p.brand_id,
    subcategory: p.subcategory || '',
    description: p.description,
    short_description: p.short_description || '',
    long_description: p.long_description || '',
    specifications: p.specifications || {},
    sku: p.sku || '',
    barcode: p.barcode || '',
    weight: p.weight ? Number(p.weight) : null,
    colors: p.colors || [],
    sizes: p.sizes || [],
    tags: p.tags || [],
    primary_image_index: p.primary_image_index || 0,
    rating: Number(p.rating),
    reviews_count: p.reviews_count,
    stock: p.stock,
    is_featured: p.is_featured,
    is_trending: p.is_trending,
    is_new: p.is_new,
    is_best_selling: p.is_best_selling || false,
    is_active: p.is_active,
    created_at: p.created_at,
  }));
}

export async function adminFetchAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), brands(name)')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    price: Number(p.price),
    discount_price: p.discount_price ? Number(p.discount_price) : null,
    wholesale_price: p.wholesale_price ? Number(p.wholesale_price) : null,
    image: p.image,
    images: p.images || [],
    category: p.categories?.name || '',
    category_id: p.category_id,
    brand: p.brands?.name || '',
    brand_id: p.brand_id,
    subcategory: p.subcategory || '',
    description: p.description,
    short_description: p.short_description || '',
    long_description: p.long_description || '',
    specifications: p.specifications || {},
    sku: p.sku || '',
    barcode: p.barcode || '',
    weight: p.weight ? Number(p.weight) : null,
    colors: p.colors || [],
    sizes: p.sizes || [],
    tags: p.tags || [],
    primary_image_index: p.primary_image_index || 0,
    rating: Number(p.rating),
    reviews_count: p.reviews_count,
    stock: p.stock,
    is_featured: p.is_featured,
    is_trending: p.is_trending,
    is_new: p.is_new,
    is_best_selling: p.is_best_selling || false,
    is_active: p.is_active,
    created_at: p.created_at,
  }));
}

export async function fetchBanners() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('priority', { ascending: false })
    .order('sort_order');
  if (error) return [];
  return data;
}

export async function adminFetchBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('priority', { ascending: false })
    .order('sort_order');
  if (error) return [];
  return data;
}

export async function fetchOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
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
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

export async function validateCoupon(code: string, subtotal: number): Promise<{ discount: number; type: string; value: number; error: string | null }> {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) return { discount: 0, type: '', value: 0, error: 'Invalid coupon code' };

  const now = new Date();
  if (data.expires_at && new Date(data.expires_at) < now) return { discount: 0, type: '', value: 0, error: 'Coupon has expired' };
  if (data.max_uses && data.used_count >= data.max_uses) return { discount: 0, type: '', value: 0, error: 'Coupon usage limit reached' };
  if (data.min_order && subtotal < data.min_order) return { discount: 0, type: '', value: 0, error: `Minimum order ৳${data.min_order} required` };

  const discount = data.type === 'percentage'
    ? Math.round((subtotal * data.value) / 100)
    : Math.min(data.value, subtotal);

  return { discount, type: data.type, value: data.value, error: null };
}

export async function incrementCouponUsage(code: string) {
  await supabase.rpc('increment_coupon_usage', { coupon_code: code });
}

export async function fetchAddresses(userId: string) {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });
  if (error) return [];
  return data;
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
  const { data, error } = await supabase
    .from('addresses')
    .insert(address)
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

export async function updateAddress(id: string, updates: any) {
  const { error } = await supabase.from('addresses').update(updates).eq('id', id);
  return { error: error?.message ?? null };
}

export async function deleteAddress(id: string) {
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function fetchWishlist(userId: string) {
  const { data, error } = await supabase
    .from('wishlist')
    .select('*, products(*, categories(name))')
    .eq('user_id', userId);
  if (error) return [];
  return data;
}

export async function toggleWishlist(userId: string, productId: string) {
  const { data: existing } = await supabase
    .from('wishlist')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    await supabase.from('wishlist').delete().eq('id', existing.id);
    return { added: false };
  } else {
    await supabase.from('wishlist').insert({ user_id: userId, product_id: productId });
    return { added: true };
  }
}

// Admin functions
export async function adminFetchAllOrders(filters?: { status?: string; search?: string; dateFrom?: string; dateTo?: string }) {
  let query = supabase
    .from('orders')
    .select('*, profiles(full_name, id)')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo + 'T23:59:59Z');
  }

  const { data, error } = await query;
  if (error) return [];

  let results = data;
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    results = results.filter((o: any) =>
      (o.order_number || '').toLowerCase().includes(s) ||
      o.id.toLowerCase().includes(s) ||
      (o.profiles?.full_name || '').toLowerCase().includes(s) ||
      (o.address?.full_name || '').toLowerCase().includes(s) ||
      (o.address?.phone || '').includes(s)
    );
  }

  return results;
}

export async function adminUpdateOrderStatus(orderId: string, status: string, note?: string) {
  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId);
  if (!error && note) {
    await supabase.from('order_timeline').insert({ order_id: orderId, status, note, created_by: 'admin' });
  }
  return { error: error?.message ?? null };
}

export async function fetchOrderTimeline(orderId: string) {
  const { data, error } = await supabase
    .from('order_timeline')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return data;
}

export async function cancelOrder(orderId: string, userId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('status, user_id')
    .eq('id', orderId)
    .maybeSingle();

  if (!order || order.user_id !== userId) return { error: 'Unauthorized' };
  if (!['placed', 'pending', 'confirmed'].includes(order.status)) {
    return { error: 'Order cannot be cancelled at this stage' };
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId);
  return { error: error?.message ?? null };
}

export async function adminFetchAllCustomers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function adminCreateProduct(product: any) {
  const { data, error } = await supabase.from('products').insert(product).select().single();
  return { data, error: error?.message ?? null };
}

export async function adminUpdateProduct(id: string, updates: any) {
  const { error } = await supabase.from('products').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminDeleteProduct(id: string) {
  const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminCreateCategory(category: { name: string; icon: string; color: string }) {
  const { data, error } = await supabase.from('categories').insert(category).select().single();
  return { data, error: error?.message ?? null };
}

export async function adminUpdateCategory(id: string, updates: any) {
  const { error } = await supabase.from('categories').update(updates).eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminDeleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminCreateBanner(banner: { title: string; subtitle: string; color: string }) {
  const { data, error } = await supabase.from('banners').insert(banner).select().single();
  return { data, error: error?.message ?? null };
}

export async function adminUpdateBanner(id: string, updates: any) {
  const { error } = await supabase.from('banners').update(updates).eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminDeleteBanner(id: string) {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminGetStats() {
  const [products, orders, customers] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('orders').select('id, total, status, created_at', { count: 'exact' }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
  ]);

  const orderData = orders.data || [];
  const revenue = orderData.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
  const pendingOrders = orderData.filter((o: any) => o.status === 'placed' || o.status === 'processing' || o.status === 'packed').length;
  const deliveredOrders = orderData.filter((o: any) => o.status === 'delivered').length;

  const today = new Date().toDateString();
  const todaysOrders = orderData.filter((o: any) => new Date(o.created_at).toDateString() === today);
  const todaysSales = todaysOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

  // Revenue by day (last 7 days)
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toDateString();
  });
  const revenueChart = last7.map(day => ({
    day: new Date(day).toLocaleDateString('en', { weekday: 'short' }),
    revenue: orderData.filter((o: any) => new Date(o.created_at).toDateString() === day)
      .reduce((s: number, o: any) => s + Number(o.total || 0), 0),
  }));

  return {
    totalProducts: products.count || 0,
    totalOrders: orders.count || 0,
    totalCustomers: customers.count || 0,
    totalRevenue: revenue,
    pendingOrders,
    deliveredOrders,
    todaysSales,
    revenueChart,
  };
}

// ── Brands ────────────────────────────────────────────────────────────────────

export async function fetchBrands() {
  const { data, error } = await supabase.from('brands').select('*').eq('is_active', true).order('sort_order');
  if (error) return [];
  return data;
}

export async function adminFetchBrands() {
  const { data } = await supabase.from('brands').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function adminCreateBrand(brand: { name: string; logo_url?: string }) {
  const { data, error } = await supabase.from('brands').insert(brand).select().single();
  return { data, error: error?.message ?? null };
}

export async function adminUpdateBrand(id: string, updates: any) {
  const { error } = await supabase.from('brands').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminDeleteBrand(id: string) {
  const { error } = await supabase.from('brands').update({ is_active: false }).eq('id', id);
  return { error: error?.message ?? null };
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function adminFetchReviews() {
  const { data } = await supabase
    .from('reviews')
    .select('*, products(name), profiles(full_name)')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function adminUpdateReview(id: string, is_approved: boolean) {
  const { error } = await supabase.from('reviews').update({ is_approved }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminDeleteReview(id: string) {
  const { error } = await supabase.from('reviews').delete().eq('id', id);
  return { error: error?.message ?? null };
}

// ── Coupons ───────────────────────────────────────────────────────────────────

export async function adminFetchCoupons() {
  const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function adminCreateCoupon(coupon: any) {
  const { data, error } = await supabase.from('coupons').insert(coupon).select().single();
  return { data, error: error?.message ?? null };
}

export async function adminUpdateCoupon(id: string, updates: any) {
  const { error } = await supabase.from('coupons').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminDeleteCoupon(id: string) {
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  return { error: error?.message ?? null };
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function adminFetchNotifications() {
  const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function adminCreateNotification(notif: any) {
  const { data, error } = await supabase.from('notifications').insert(notif).select().single();
  return { data, error: error?.message ?? null };
}

// ── Notification Campaigns ─────────────────────────────────────────────────────

export async function adminFetchCampaigns() {
  const { data } = await supabase
    .from('notification_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  return data || [];
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
  const { data, error } = await supabase
    .from('notification_campaigns')
    .insert({ ...campaign, status: 'draft' })
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

export async function adminDeleteCampaign(id: string) {
  const { error } = await supabase.from('notification_campaigns').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminSendCampaign(campaignId: string, payload: {
  title: string;
  message: string;
  type: string;
  category: string;
  channel: string;
  target: string;
  link?: string;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke('send-notification', {
    body: { ...payload, campaign_id: campaignId },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });
  if (res.error) return { error: res.error.message, data: null };
  return { error: null, data: res.data };
}

export async function adminDeleteNotification(id: string) {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminMarkNotificationSent(id: string) {
  const { error } = await supabase.from('notifications').update({ is_sent: true, sent_at: new Date().toISOString() }).eq('id', id);
  return { error: error?.message ?? null };
}

// ── Flash Sales ────────────────────────────────────────────────────────────────

export async function adminFetchFlashSales() {
  const { data } = await supabase
    .from('flash_sales')
    .select('*, products(name, image)')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function adminCreateFlashSale(sale: any) {
  const { data, error } = await supabase.from('flash_sales').insert(sale).select().single();
  return { data, error: error?.message ?? null };
}

export async function adminUpdateFlashSale(id: string, updates: any) {
  const { error } = await supabase.from('flash_sales').update(updates).eq('id', id);
  return { error: error?.message ?? null };
}

export async function adminDeleteFlashSale(id: string) {
  const { error } = await supabase.from('flash_sales').delete().eq('id', id);
  return { error: error?.message ?? null };
}

// ── Settings ───────────────────────────────────────────────────────────────────

export async function adminFetchSettings(key: string) {
  const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
  return data?.value || null;
}

export async function adminUpsertSettings(key: string, value: any) {
  const { error } = await supabase.from('settings').upsert({ key, value, updated_at: new Date().toISOString() });
  return { error: error?.message ?? null };
}

// ── User Notifications ────────────────────────────────────────────────────────

export async function fetchUserNotifications(userId: string) {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return [];
  return data;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
  return { error: error?.message ?? null };
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  return { error: error?.message ?? null };
}

export async function deleteUserNotification(id: string) {
  const { error } = await supabase.from('user_notifications').delete().eq('id', id);
  return { error: error?.message ?? null };
}

export async function fetchUserCoupons() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('is_active', true)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
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
  const { data, error } = await supabase
    .from('payments')
    .insert({ ...payment, currency: payment.currency || 'BDT' })
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

export async function submitManualPayment(paymentId: string, txId: string, senderNumber: string) {
  const { error } = await supabase
    .from('payments')
    .update({ transaction_id: txId, sender_number: senderNumber, status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', paymentId);
  return { error: error?.message ?? null };
}

export async function fetchPayment(orderId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function fetchUserPayments(userId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*, orders(order_number, total, status, created_at, items)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
}

export async function initiateStripePayment(orderId: string, amount: number) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke('create-stripe-payment', {
    body: { order_id: orderId, amount, currency: 'usd' },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });
  if (res.error) return { error: res.error.message, client_secret: null, payment_intent_id: null };
  return { error: null, client_secret: res.data?.client_secret, payment_intent_id: res.data?.payment_intent_id };
}

export async function initiateSSLCommerzPayment(payload: {
  order_id: string;
  amount: number;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_address: string;
}) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke('sslcommerz-init', {
    body: payload,
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });
  if (res.error) return { error: res.error.message, gateway_url: null, session_key: null };
  return { error: null, gateway_url: res.data?.gateway_url, session_key: res.data?.session_key };
}

export async function adminFetchAllPayments(filters?: { status?: string; method?: string; search?: string }) {
  let query = supabase
    .from('payments')
    .select('*, orders(order_number, total, status, address)')
    .order('created_at', { ascending: false });

  if (filters?.status && filters.status !== 'all') query = query.eq('status', filters.status);
  if (filters?.method && filters.method !== 'all') query = query.eq('method', filters.method);

  const { data, error } = await query.limit(200);
  if (error) return [];

  let results = data;
  if (filters?.search) {
    const s = filters.search.toLowerCase();
    results = results.filter((p: any) =>
      (p.transaction_id || '').toLowerCase().includes(s) ||
      (p.orders?.order_number || '').toLowerCase().includes(s) ||
      (p.gateway_ref || '').toLowerCase().includes(s)
    );
  }
  return results;
}

export async function adminUpdatePaymentStatus(
  paymentId: string,
  status: string,
  notes?: string
) {
  const updates: any = { status };
  if (notes) updates.notes = notes;
  if (status === 'verified') updates.verified_at = new Date().toISOString();
  if (status === 'refunded') updates.refunded_at = new Date().toISOString();

  const { error } = await supabase.from('payments').update(updates).eq('id', paymentId);
  return { error: error?.message ?? null };
}

// ── Reports ────────────────────────────────────────────────────────────────────

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

  const [ordersRes, prevOrdersRes, customersRes, prevCustomersRes, productsRes] = await Promise.all([
    supabase.from('orders').select('id, total, status, payment_method, created_at, items')
      .gte('created_at', start.toISOString()).order('created_at', { ascending: true }),
    supabase.from('orders').select('id, total, status, created_at')
      .gte('created_at', prevStart.toISOString()).lt('created_at', start.toISOString()),
    supabase.from('profiles').select('id, created_at').eq('role', 'customer')
      .gte('created_at', start.toISOString()),
    supabase.from('profiles').select('id').eq('role', 'customer')
      .gte('created_at', prevStart.toISOString()).lt('created_at', start.toISOString()),
    supabase.from('products').select('id, name, image, price, stock').eq('is_active', true),
  ]);

  const orders      = ordersRes.data      || [];
  const prevOrders  = prevOrdersRes.data  || [];
  const customers   = customersRes.data   || [];
  const prevCusts   = prevCustomersRes.data || [];
  const products    = productsRes.data    || [];

  const revenue    = orders.reduce((s, o) => s + Number(o.total || 0), 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const avgOrder   = orders.length > 0 ? revenue / orders.length : 0;
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
      label:     b.label,
      revenue:   bOrders.reduce((s, o) => s + Number(o.total || 0), 0),
      orders:    bOrders.length,
      customers: bCusts.length,
    };
  });

  const paymentMethods = ['cash_on_delivery', 'bkash', 'nagad', 'stripe', 'sslcommerz', 'bank_transfer']
    .map(m => ({
      method:  m,
      count:   orders.filter(o => (o as any).payment_method === m).length,
      revenue: orders.filter(o => (o as any).payment_method === m).reduce((s, o) => s + Number(o.total || 0), 0),
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
      productMap[id].qty     += Number(item.quantity || 1);
      productMap[id].revenue += Number(item.price || 0) * Number(item.quantity || 1);
    });
  });
  const topProducts = Object.entries(productMap)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    kpis: {
      revenue,         revenueChange: pct(revenue, prevRevenue),
      orders: orders.length, ordersChange: pct(orders.length, prevOrders.length),
      customers: customers.length, customersChange: pct(customers.length, prevCusts.length),
      avgOrder,        avgOrderChange: pct(avgOrder, prevAvgOrder),
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
  const [orders, products, customers] = await Promise.all([
    supabase.from('orders').select('total, status, created_at, payment_method'),
    supabase.from('products').select('id, name, stock, is_active').eq('is_active', true),
    supabase.from('profiles').select('created_at, role').eq('role', 'customer'),
  ]);

  const orderData = orders.data || [];
  const productData = products.data || [];
  const customerData = customers.data || [];

  // Revenue by month (last 6 months)
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
    count: orderData.filter((o: any) => o.payment_method === p).length,
    revenue: orderData.filter((o: any) => o.payment_method === p).reduce((s, o) => s + Number(o.total || 0), 0),
  }));

  const lowStock = productData.filter(p => p.stock < 5);

  return { revenueByMonth, byStatus, byPayment, lowStock, totalCustomers: customerData.length };
}
