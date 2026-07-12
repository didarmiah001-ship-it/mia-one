import {
  collection,
  getDocs,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

const IK = 'https://ik.imagekit.io/i67rlxsde';

const categories = [
  { name: 'Electronics', icon: 'Smartphone', color: '#FF8A00' },
  { name: 'Fashion', icon: 'Shirt', color: '#FF2EC9' },
  { name: 'Home & Living', icon: 'Sofa', color: '#7B2CFF' },
  { name: 'Beauty & Health', icon: 'Heart', color: '#00D1FF' },
  { name: 'Sports & Fitness', icon: 'Dumbbell', color: '#22C55E' },
  { name: 'Books & Stationery', icon: 'Book', color: '#F59E0B' },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#EF4444' },
  { name: 'Toys & Baby', icon: 'Baby', color: '#3B82F6' },
];

const banners = [
  {
    title: 'Flash Sale',
    subtitle: 'Up to 50% Off on Electronics',
    color: '#FF8A00',
    image: `${IK}/banners/flash-sale.jpg`,
    is_active: true,
    priority: 10,
    sort_order: 1,
  },
  {
    title: 'New Arrivals',
    subtitle: 'Fresh Products Every Day',
    color: '#00D1FF',
    image: `${IK}/banners/new-arrivals.jpg`,
    is_active: true,
    priority: 8,
    sort_order: 2,
  },
  {
    title: 'Free Delivery',
    subtitle: 'On Orders Above 500 BDT',
    color: '#7B2CFF',
    image: `${IK}/banners/free-delivery.jpg`,
    is_active: true,
    priority: 6,
    sort_order: 3,
  },
];

const settings = {
  store_name: { value: 'MIA ONE' },
  currency: { value: '৳' },
  free_delivery_threshold: { value: 500 },
  delivery_charge: { value: 60 },
  estimated_days: { value: '2-4 business days' },
  whatsapp_number: { value: '8801823057578' },
  support_email: { value: 'miaonebd@gmail.com' },
};

const products = [
  { name: 'Wireless Bluetooth Earbuds Pro', category: 'Electronics', price: 1299, discount_price: 999, image: `${IK}/products/earbuds-pro.jpg`, description: 'Premium wireless earbuds with active noise cancellation and 30hr battery life.', rating: 4.5, reviews_count: 128, stock: 50, is_featured: true, is_trending: true, is_new: false },
  { name: 'Smart Watch Series 7', category: 'Electronics', price: 3499, discount_price: 2999, image: `${IK}/products/smart-watch-s7.jpg`, description: 'Fitness tracking, heart rate monitor, and AMOLED display.', rating: 4.7, reviews_count: 89, stock: 30, is_featured: true, is_trending: false, is_new: true },
  { name: 'USB-C Fast Charger 65W', category: 'Electronics', price: 899, discount_price: null, image: `${IK}/products/usbc-charger.jpg`, description: 'GaN technology fast charger for laptops and phones.', rating: 4.3, reviews_count: 45, stock: 100, is_featured: false, is_trending: false, is_new: false },
  { name: 'Portable Power Bank 20000mAh', category: 'Electronics', price: 1599, discount_price: 1199, image: `${IK}/products/power-bank.jpg`, description: 'High capacity power bank with dual USB-C output.', rating: 4.6, reviews_count: 210, stock: 75, is_featured: false, is_trending: true, is_new: false },
  { name: 'LED Monitor 27 inch 4K', category: 'Electronics', price: 24999, discount_price: 21999, image: `${IK}/products/monitor-4k.jpg`, description: 'Ultra HD 4K monitor with HDR support and 144Hz refresh rate.', rating: 4.8, reviews_count: 34, stock: 15, is_featured: true, is_trending: false, is_new: true },

  { name: 'Men\'s Cotton T-Shirt', category: 'Fashion', price: 599, discount_price: 399, image: `${IK}/products/tshirt-men.jpg`, description: '100% premium cotton t-shirt, comfortable and breathable.', rating: 4.2, reviews_count: 156, stock: 200, is_featured: false, is_trending: true, is_new: false },
  { name: 'Women\'s Silk Saree', category: 'Fashion', price: 2999, discount_price: 2499, image: `${IK}/products/saree-silk.jpg`, description: 'Elegant handwoven silk saree with traditional motifs.', rating: 4.9, reviews_count: 78, stock: 40, is_featured: true, is_trending: false, is_new: true },
  { name: 'Denim Jeans Slim Fit', category: 'Fashion', price: 1499, discount_price: 1099, image: `${IK}/products/jeans-denim.jpg`, description: 'Stretchable slim-fit denim jeans for everyday comfort.', rating: 4.4, reviews_count: 92, stock: 120, is_featured: false, is_trending: true, is_new: false },
  { name: 'Running Sneakers', category: 'Fashion', price: 2199, discount_price: 1799, image: `${IK}/products/sneakers.jpg`, description: 'Lightweight breathable sneakers with cushioned sole.', rating: 4.5, reviews_count: 167, stock: 60, is_featured: true, is_trending: true, is_new: false },

  { name: 'Memory Foam Pillow', category: 'Home & Living', price: 799, discount_price: 599, image: `${IK}/products/pillow-foam.jpg`, description: 'Orthopedic memory foam pillow for neck support.', rating: 4.3, reviews_count: 54, stock: 80, is_featured: false, is_trending: false, is_new: false },
  { name: 'Stainless Steel Cookware Set', category: 'Home & Living', price: 3999, discount_price: 3299, image: `${IK}/products/cookware-set.jpg`, description: '5-piece stainless steel cookware set with glass lids.', rating: 4.7, reviews_count: 41, stock: 25, is_featured: true, is_trending: false, is_new: true },
  { name: 'LED Desk Lamp', category: 'Home & Living', price: 699, discount_price: null, image: `${IK}/products/desk-lamp.jpg`, description: 'Adjustable LED desk lamp with USB charging port.', rating: 4.1, reviews_count: 33, stock: 90, is_featured: false, is_trending: false, is_new: false },

  { name: 'Vitamin C Serum', category: 'Beauty & Health', price: 899, discount_price: 699, image: `${IK}/products/serum-vitc.jpg`, description: 'Brightening vitamin C serum for radiant skin.', rating: 4.6, reviews_count: 234, stock: 150, is_featured: true, is_trending: true, is_new: false },
  { name: 'Hair Dryer 1800W', category: 'Beauty & Health', price: 1799, discount_price: 1399, image: `${IK}/products/hair-dryer.jpg`, description: 'Professional ionic hair dryer with cool shot button.', rating: 4.4, reviews_count: 67, stock: 45, is_featured: false, is_trending: false, is_new: true },
  { name: 'Digital Blood Pressure Monitor', category: 'Beauty & Health', price: 2499, discount_price: 1999, image: `${IK}/products/bp-monitor.jpg`, description: 'Automatic upper arm blood pressure monitor with memory.', rating: 4.8, reviews_count: 29, stock: 35, is_featured: true, is_trending: false, is_new: false },

  { name: 'Yoga Mat Premium', category: 'Sports & Fitness', price: 999, discount_price: 799, image: `${IK}/products/yoga-mat.jpg`, description: 'Non-slip eco-friendly yoga mat with carrying strap.', rating: 4.5, reviews_count: 88, stock: 100, is_featured: false, is_trending: true, is_new: false },
  { name: 'Adjustable Dumbbell 20kg', category: 'Sports & Fitness', price: 3499, discount_price: 2799, image: `${IK}/products/dumbbell.jpg`, description: 'Space-saving adjustable dumbbell set, 2-20kg per hand.', rating: 4.7, reviews_count: 52, stock: 20, is_featured: true, is_trending: false, is_new: true },

  { name: 'Notebook Set A5 (5 pcs)', category: 'Books & Stationery', price: 450, discount_price: 350, image: `${IK}/products/notebook-set.jpg`, description: 'Premium A5 dotted notebooks, 120 pages each.', rating: 4.3, reviews_count: 76, stock: 200, is_featured: false, is_trending: false, is_new: false },
  { name: 'Organic Honey 500g', category: 'Groceries', price: 650, discount_price: null, image: `${IK}/products/honey-organic.jpg`, description: 'Raw organic wildflower honey, unprocessed and natural.', rating: 4.9, reviews_count: 143, stock: 80, is_featured: true, is_trending: true, is_new: false },
  { name: 'Plush Teddy Bear', category: 'Toys & Baby', price: 899, discount_price: 699, image: `${IK}/products/teddy-bear.jpg`, description: 'Soft and cuddly plush teddy bear, safe for all ages.', rating: 4.6, reviews_count: 61, stock: 70, is_featured: false, is_trending: false, is_new: true },
];

export async function seedFirestoreIfEmpty() {
  const [catSnap, banSnap, prodSnap, setSnap] = await Promise.all([
    getDocs(collection(db, 'categories')),
    getDocs(collection(db, 'banners')),
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'settings')),
  ]);

  if (catSnap.empty) {
    const batch = writeBatch(db);
    categories.forEach((c) => {
      batch.set(doc(collection(db, 'categories')), { ...c, created_at: new Date().toISOString() });
    });
    await batch.commit();
  }

  if (banSnap.empty) {
    const batch = writeBatch(db);
    banners.forEach((b) => {
      batch.set(doc(collection(db, 'banners')), { ...b, created_at: new Date().toISOString() });
    });
    await batch.commit();
  }

  const categoryDocs = catSnap.empty
    ? (await getDocs(collection(db, 'categories'))).docs
    : catSnap.docs;

  const categoryMap: Record<string, string> = {};
  categoryDocs.forEach((d) => {
    const data = d.data();
    categoryMap[data.name] = d.id;
  });

  if (prodSnap.empty) {
    const batch = writeBatch(db);
    products.forEach((p) => {
      const { category, ...rest } = p;
      batch.set(doc(collection(db, 'products')), {
        ...rest,
        category_id: categoryMap[category] ?? '',
        images: [p.image],
        specifications: {},
        created_at: new Date().toISOString(),
      });
    });
    await batch.commit();
  }

  if (setSnap.empty) {
    const batch = writeBatch(db);
    Object.entries(settings).forEach(([key, val]) => {
      batch.set(doc(collection(db, 'settings'), key), val);
    });
    await batch.commit();
  }
}
