import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  console.error('ERROR: Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON file path.');
  console.error('Example: GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node scripts/seed-firestore.ts');
  process.exit(1);
}

const serviceAccount = JSON.parse(
  require('fs').readFileSync(serviceAccountPath, 'utf8')
);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const now = new Date().toISOString();

const seedData: Record<string, Record<string, any>> = {
  categories: {
    'sample-electronics': {
      name: 'Electronics',
      icon: 'Smartphone',
      color: '#FF8A00',
      sort_order: 1,
      is_active: true,
      created_at: now,
    },
    'sample-fashion': {
      name: 'Fashion',
      icon: 'Shirt',
      color: '#FF2EC9',
      sort_order: 2,
      is_active: true,
      created_at: now,
    },
  },
  banners: {
    'sample-banner-1': {
      title: 'Flash Sale',
      subtitle: 'Up to 50% Off on Electronics',
      image_url: '',
      mobile_image_url: '',
      link_url: '',
      is_active: true,
      priority: 10,
      sort_order: 1,
      open_in_new_tab: false,
      created_at: now,
    },
  },
  brands: {
    'sample-brand-1': {
      name: 'MIA Brand',
      logo_url: '',
      is_active: true,
      sort_order: 1,
      created_at: now,
    },
  },
  orders: {
    'sample-order-1': {
      order_number: 'ORD-SAMPLE1',
      user_id: 'sample-customer',
      items: [
        { product_id: 'sample-product', name: 'Sample Product', price: 100, quantity: 1, image: '' },
      ],
      subtotal: 100,
      delivery_charge: 60,
      discount: 0,
      total: 160,
      status: 'placed',
      payment_method: 'cash_on_delivery',
      address: {
        full_name: 'Sample Customer',
        phone: '01700000000',
        address: '123 Sample St',
        area: 'Sample Area',
        city: 'Dhaka',
      },
      created_at: now,
      updated_at: now,
    },
  },
  coupons: {
    'sample-coupon-1': {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      is_active: true,
      min_order: 200,
      max_uses: 100,
      used_count: 0,
      expires_at: null,
      created_at: now,
    },
  },
  notifications: {
    'sample-notification-1': {
      title: 'Welcome to MIA ONE',
      message: 'Thank you for joining us!',
      type: 'info',
      is_sent: true,
      is_active: true,
      created_at: now,
    },
  },
  payments: {
    'sample-payment-1': {
      order_id: 'sample-order-1',
      user_id: 'sample-customer',
      method: 'cash_on_delivery',
      amount: 160,
      currency: 'BDT',
      status: 'pending',
      created_at: now,
    },
  },
  profiles: {
    'sample-customer': {
      full_name: 'Sample Customer',
      email: 'sample@test.com',
      phone: '01700000000',
      role: 'customer',
      created_at: now,
    },
  },
};

async function seed() {
  const batch = db.batch();
  for (const [collectionName, docs] of Object.entries(seedData)) {
    for (const [docId, data] of Object.entries(docs)) {
      batch.set(db.collection(collectionName).doc(docId), data, { merge: true });
    }
  }
  await batch.commit();
  console.log('Seeded', Object.keys(seedData).length, 'collections.');

  const collections = [
    'admins', 'products', 'categories', 'banners', 'brands',
    'orders', 'coupons', 'notifications', 'payments', 'profiles',
  ];
  console.log('\nCollections that now exist in Firestore:');
  for (const name of collections) {
    const snap = await db.collection(name).limit(1).get();
    console.log(`  - ${name} (${snap.size} document${snap.size !== 1 ? 's' : ''})`);
  }
}

seed().catch(err => {
  console.error('Seeding failed:', err.message);
  process.exit(1);
});
