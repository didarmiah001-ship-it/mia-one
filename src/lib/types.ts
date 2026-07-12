export interface Product {
  id: string;
  name: string;
  price: number;
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
  is_featured: boolean;
  is_trending: boolean;
  is_new: boolean;
  is_best_selling: boolean;
  is_active: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  payment_type: 'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'cash_on_delivery' | 'stripe' | 'sslcommerz';
  account_name: string;
  account_number: string;
  account_type: 'personal' | 'agent' | 'merchant' | 'bank' | 'none';
  bank_name: string;
  branch_name: string;
  routing_number: string;
  payment_instructions: string;
  is_active: boolean;
  sort_order: number;
  display_name: string;
  created_at: string;
  updated_at: string;
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
  district?: string;
  thana?: string;
  isRemoteArea?: boolean;
  isExpress?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
