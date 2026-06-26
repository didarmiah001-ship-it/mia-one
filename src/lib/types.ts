export interface Product {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  image: string;
  images: string[];
  category: string;
  description: string;
  specifications: Record<string, string>;
  rating: number;
  reviews_count: number;
  stock: number;
  is_featured: boolean;
  is_trending: boolean;
  is_new: boolean;
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
  status: 'placed' | 'processing' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  payment_method: string;
  address: OrderAddress;
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
