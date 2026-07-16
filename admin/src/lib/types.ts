export interface Product {
  id: string;
  name: string;
  price: number;
  cost_price: number;
  discount_price: number | null;
  wholesale_price: number | null;
  image: string;
  images: string[];
  category: string;
  category_id: string;
  brand: string;
  brand_id: string;
  subcategory: string;
  description: string;
  short_description: string;
  long_description: string;
  specifications: Record<string, string>;
  sku: string;
  barcode: string;
  weight: number | null;
  colors: string[];
  sizes: string[];
  tags: string[];
  primary_image_index: number;
  rating: number;
  reviews_count: number;
  stock: number;
  low_stock_threshold: number;
  is_featured: boolean;
  is_trending: boolean;
  is_new: boolean;
  is_best_selling: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface WishlistItem {
  product: Product;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  delivery_charge: number;
  status: 'placed' | 'processing' | 'packed' | 'out_for_delivery' | 'delivered' | 'pending' | 'dispatched' | 'shipped' | 'returned' | 'cancelled';
  payment_method: string;
  address: OrderAddress;
  courier_partner?: 'none' | 'pathao' | 'steadfast' | 'redx' | null;
  courier_tracking_id?: string | null;
  created_at: string;
}

export interface OrderAddress {
  full_name: string;
  mobile: string;
  address: string;
  area: string;
  notes: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
