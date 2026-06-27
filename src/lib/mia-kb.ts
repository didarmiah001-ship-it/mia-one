export interface KnowledgeEntry {
  keywords: string[];
  responseEn: string;
  responseBn: string;
}

export const miaKnowledgeBase: KnowledgeEntry[] = [
  // Welcome/Greeting
  {
    keywords: ['hello', 'hi', 'hey', 'greeting', 'start', 'begin'],
    responseEn: 'Hello! Welcome to MIA ONE. I am MIA Agent, your personal shopping assistant. How can I help you today?',
    responseBn: 'আসসালামু আলাইকুম! MIA ONE-এ স্বাগতম। আমি MIA Agent, আপনার ব্যক্তিগত শপিং সহায়ক। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?',
  },

  // MIA ONE - About
  {
    keywords: ['about', 'what is mia one', 'mia one', 'company', 'who are you', 'tell me about'],
    responseEn: 'MIA ONE is a premium e-commerce platform based in Munshiganj, Bangladesh. We offer a wide range of products including electronics, fashion, home goods, and more. We provide fast delivery within 2-4 business days in Dhaka and Munshiganj areas.',
    responseBn: 'MIA ONE মুন্সিগঞ্জ, বাংলাদেশে অবস্থিত একটি প্রিমিয়াম ই-কমার্স প্ল্যাটফর্ম। আমরা ইলেকট্রনিক্স, ফ্যাশন, হোম গুডস এবং আরও অনেক পণ্য অফার করি। ঢাকা ও মুন্সিগঞ্জ এলাকায় আমরা ২-৪ কর্মদিবসের মধ্যে দ্রুত ডেলিভারি প্রদান করি।',
  },

  // Order - How to place
  {
    keywords: ['place order', 'how to order', 'ordering', 'buy', 'purchase', 'কিনুন', 'অর্ডার করুন', 'order koro', 'কিভাবে অর্ডার'],
    responseEn: 'To place an order: 1) Browse products from Home or Search. 2) Tap on a product to view details. 3) Tap "Add to Cart". 4) Go to your Cart and review items. 5) Tap "Proceed to Checkout". 6) Enter your delivery address. 7) Select payment method. 8) Confirm your order.',
    responseBn: 'অর্ডার করতে: ১) হোম বা অনুসন্ধান থেকে পণ্য ব্রাউজ করুন। ২) বিস্তারিত দেখতে পণ্যে ট্যাপ করুন। ৩) "কার্টে যোগ করুন" ট্যাপ করুন। ৪) আপনার কার্টে যান এবং আইটেম রিভিউ করুন। ৫) "চেকআউটে যান" ট্যাপ করুন। ৬) ডেলিভারি ঠিকানা লিখুন। ৭) পেমেন্ট পদ্ধতি নির্বাচন করুন। ৮) অর্ডার নিশ্চিত করুন।',
  },

  // Track Order
  {
    keywords: ['track order', 'my order', 'order status', 'where is my order', 'order tracking', 'অর্ডার ট্র্যাক', 'আমার অর্ডার', 'অর্ডার কোথায়'],
    responseEn: 'To track your order: Go to Profile > My Orders to see all your orders. Tap on any order to view its full timeline including order confirmation, processing, shipping, and delivery status updates.',
    responseBn: 'আপনার অর্ডার ট্র্যাক করতে: প্রোফাইল > আমার অর্ডারে যান এবং সব অর্ডার দেখুন। যেকোনো অর্ডারে ট্যাপ করে এর সম্পূর্ণ টাইমলাইন দেখুন, যার মধ্যে অর্ডার নিশ্চিতকরণ, প্রসেসিং, শিপিং এবং ডেলিভারি স্ট্যাটাস আপডেট অন্তর্ভুক্ত।',
  },

  // Cancel Order
  {
    keywords: ['cancel order', 'how to cancel', 'cancellation', 'অর্ডার বাতিল', 'বাতিল করুন'],
    responseEn: 'To cancel an order: Go to Profile > My Orders, tap on the order you want to cancel, and tap "Cancel Order". Orders can only be cancelled before they are shipped. Once shipped, please contact our helpline for assistance.',
    responseBn: 'অর্ডার বাতিল করতে: প্রোফাইল > আমার অর্ডারে যান, যে অর্ডারটি বাতিল করতে চান সেটিতে ট্যাপ করুন, এবং "অর্ডার বাতিল করুন" ট্যাপ করুন। শিপ হওয়ার আগেই কেবল অর্ডার বাতিল করা যায়। শিপ হয়ে গেলে সাহায্যের জন্য আমাদের হেল্পলাইনে যোগাযোগ করুন।',
  },

  // Delivery Info
  {
    keywords: ['delivery', 'shipping', 'delivery time', 'how long', 'deliver', 'ডেলিভারি', 'শিপিং', 'কতদিন', 'পৌঁছাতে'],
    responseEn: 'We deliver within 2-4 business days in Dhaka and Munshiganj areas. Free delivery on orders above 500 BDT. Standard delivery charge is 60 BDT for orders below 500 BDT. Express delivery options may be available at checkout.',
    responseBn: 'ঢাকা ও মুন্সিগঞ্জ এলাকায় আমরা ২-৪ কর্মদিবসের মধ্যে ডেলিভারি করি। ৫০০ টাকার বেশি অর্ডারে বিনামূল্যে ডেলিভারি। ৫০০ টাকার কম অর্ডারে স্ট্যান্ডার্ড ডেলিভারি চার্জ ৬০ টাকা। চেকআউটে এক্সপ্রেস ডেলিভারি অপশন থাকতে পারে।',
  },

  // Payment Methods
  {
    keywords: ['payment', 'pay', 'payment method', 'how to pay', 'bkash', 'nagad', 'cod', 'card', 'পেমেন্ট', 'বিকাশ', 'নগদ', 'কার্ড', 'টাকা দিন'],
    responseEn: 'We support multiple payment methods: bKash, Nagad, Rocket, SSLCommerz (all BD banks & wallets), Stripe (Visa/Mastercard/Amex), Bank Transfer (NPSB/RTGS/BEFTN), and Cash on Delivery (COD) in select areas.',
    responseBn: 'আমরা একাধিক পেমেন্ট পদ্ধতি সমর্থন করি: বিকাশ, নগদ, রকেট, SSLCommerz (সব বাংলাদেশি ব্যাংক ও ওয়ালেট), Stripe (ভিসা/মাস্টারকার্ড/আমেক্স), ব্যাংক ট্রান্সফার (NPSB/RTGS/BEFTN), এবং নির্দিষ্ট এলাকায় ক্যাশ অন ডেলিভারি (COD)।',
  },

  // Return/Refund
  {
    keywords: ['return', 'refund', 'exchange', 'replace', 'রিটার্ন', 'রিফান্ড', 'এক্সচেঞ্জ', 'বদল'],
    responseEn: 'We accept returns within 7 days of delivery for eligible items in original condition. For return requests, contact us via WhatsApp or email with your order number and reason. Refunds are processed within 3-5 business days.',
    responseBn: 'আমরা ডেলিভারির ৭ দিনের মধ্যে মূল অবস্থায় যোগ্য পণ্য রিটার্ন গ্রহণ করি। রিটার্নের জন্য আপনার অর্ডার নম্বর ও কারণ সহ WhatsApp বা ইমেইলে যোগাযোগ করুন। রিফান্ড ৩-৫ কর্মদিবসের মধ্যে প্রসেস হয়।',
  },

  // Products
  {
    keywords: ['product', 'products', 'items', 'catalog', 'what do you sell', 'পণ্য', 'আইটেম', 'ক্যাটালগ'],
    responseEn: 'We offer a wide range of products including electronics, smartphones, accessories, fashion, home appliances, beauty products, and more. Browse our categories from the Home page or use Search to find specific products.',
    responseBn: 'আমরা ইলেকট্রনিক্স, স্মার্টফোন, অ্যাক্সেসরিজ, ফ্যাশন, হোম অ্যাপ্লায়েন্সেস, বিউটি পণ্য এবং আরও অনেক কিছু অফার করি। হোম পেজ থেকে ক্যাটাগরি ব্রাউজ করুন বা নির্দিষ্ট পণ্য খুঁজতে অনুসন্ধান ব্যবহার করুন।',
  },

  // Wholesale
  {
    keywords: ['wholesale', 'bulk order', 'পাইকারি', 'পাইকারি অর্ডার', 'বাল্ক', 'গুটিকৃত'],
    responseEn: 'Yes, we accept wholesale/bulk orders! For wholesale pricing and special arrangements, please contact us via WhatsApp at +8801823057578 or email at miaonebd@gmail.com. Our team will provide special rates for bulk purchases.',
    responseBn: 'হ্যাঁ, আমরা পাইকারি/বাল্ক অর্ডার গ্রহণ করি! পাইকারি মূল্য এবং বিশেষ ব্যবস্থার জন্য WhatsApp-এ +8801823057578 বা miaonebd@gmail.com ইমেইলে যোগাযোগ করুন। বাল্ক ক্রয়ের জন্য আমাদের টিম বিশেষ রেট প্রদান করবে।',
  },

  // Address/Location
  {
    keywords: ['address', 'location', 'office', 'where are you', 'visit', 'ঠিকানা', 'অফিস', 'কোথায়', 'লোকেশন'],
    responseEn: 'Our office address: Dashtatar Panchgaon, Tongibari, Munshiganj, Dhaka, Bangladesh. You can visit us during business hours: Saturday-Thursday 9 AM - 9 PM, Friday 2 PM - 9 PM.',
    responseBn: 'আমাদের অফিসের ঠিকানা: দশত্তর পাঁচগাঁও, টংগিবাড়ি, মুন্সিগঞ্জ, ঢাকা, বাংলাদেশ। কার্যসময়ে আমাদের সাথে দেখা করতে পারেন: শনি-বৃহস্পতি সকাল ৯ - রাত ৯, শুক্রবার দুপুর ২ - রাত ৯।',
  },

  // Contact/Support
  {
    keywords: ['contact', 'phone', 'call', 'whatsapp', 'email', 'support', 'helpline', 'যোগাযোগ', 'ফোন', 'কল', 'ইমেইল', 'সাপোর্ট'],
    responseEn: 'You can reach us via:\n- WhatsApp: +8801823057578\n- Phone: +8801823057578\n- Email: miaonebd@gmail.com\n\nWe are available 7 days a week, 9 AM - 10 PM (GMT+6).',
    responseBn: 'আমাদের সাথে যোগাযোগ করুন:\n- WhatsApp: +8801823057578\n- ফোন: +8801823057578\n- ইমেইল: miaonebd@gmail.com\n\nআমরা সপ্তাহে ৭ দিন, সকাল ৯ - রাত ১০ (GMT+6) পর্যন্ত উপলব্ধ।',
  },

  // Account/Registration
  {
    keywords: ['account', 'register', 'sign up', 'login', 'profile', 'অ্যাকাউন্ট', 'রেজিস্টার', 'সাইন আপ', 'লগইন', 'প্রোফাইল'],
    responseEn: 'To create an account: Tap Profile > Sign Up. Enter your full name, email, and password (min 6 characters). You can also shop as a guest without an account, but an account helps you track orders and save addresses.',
    responseBn: 'অ্যাকাউন্ট তৈরি করতে: প্রোফাইল > সাইন আপ ট্যাপ করুন। আপনার পুরো নাম, ইমেইল এবং পাসওয়ার্ড (ন্যূনতম ৬ অক্ষর) লিখুন। অ্যাকাউন্ট ছাড়াও গেস্ট হিসেবে কেনাকাটা করতে পারবেন, তবে অ্যাকাউন্ট থাকলে অর্ডার ট্র্যাক ও ঠিকানা সংরক্ষণ করা যায়।',
  },

  // Coupon/Discount
  {
    keywords: ['coupon', 'discount', 'promo', 'offer', 'কুপন', 'ডিসকাউন্ট', 'প্রোমো', 'অফার'],
    responseEn: 'To use a coupon: Go to checkout and enter your coupon code in the "Coupon Code" field before placing your order. Check "My Coupons" in your profile for available offers. Follow us for exclusive deals!',
    responseBn: 'কুপন ব্যবহার করতে: চেকআউটে যান এবং অর্ডার করার আগে "কুপন কোড" ফিল্ডে আপনার কুপন কোড লিখুন। উপলব্ধ অফারের জন্য প্রোফাইলে "আমার কুপন" দেখুন। এক্সক্লুসিভ ডিলের জন্য আমাদের ফলো করুন!',
  },

  // Flash Sale
  {
    keywords: ['flash sale', 'sale', 'deal', 'ফ্ল্যাশ সেল', 'সেল', 'ডিল'],
    responseEn: 'Flash Sales offer up to 50% off on selected products for a limited time! Check the "Flash Sale" section on the Home page for current deals. These offers are time-limited, so act fast!',
    responseBn: 'ফ্ল্যাশ সেলে নির্বাচিত পণ্যে ৫০% পর্যন্ত ছাড়! বর্তমান ডিলের জন্য হোম পেজে "ফ্ল্যাশ সেল" সেকশন দেখুন। এই অফারগুলো সময়সীমিত, তাই দ্রুত কাজ করুন!',
  },

  // Help/Features
  {
    keywords: ['help', 'what can you do', 'features', 'সাহায্য', 'কি করতে পারো'],
    responseEn: 'I can help you with:\n- Placing orders\n- Tracking orders\n- Product information\n- Delivery details\n- Payment options\n- Returns & refunds\n- Wholesale inquiries\n- Contact information\n\nWhat would you like to know?',
    responseBn: 'আমি সাহায্য করতে পারি:\n- অর্ডার করতে\n- অর্ডার ট্র্যাক করতে\n- পণ্যের তথ্য\n- ডেলিভারি বিস্তারিত\n- পেমেন্ট অপশন\n- রিটার্ন ও রিফান্ড\n- পাইকারি তথ্য\n- যোগাযোগ তথ্য\n\nআপনি কী জানতে চান?',
  },
];

export function getMiaResponse(userMessage: string, isBangla: boolean): string | null {
  const lowerMessage = userMessage.toLowerCase();

  for (const entry of miaKnowledgeBase) {
    const hasMatch = entry.keywords.some(keyword =>
      lowerMessage.includes(keyword.toLowerCase()) ||
      lowerMessage.includes(keyword)
    );

    if (hasMatch) {
      return isBangla ? entry.responseBn : entry.responseEn;
    }
  }

  return null;
}

export function getFallbackResponse(isBangla: boolean): string {
  if (isBangla) {
    return 'দুঃখিত, এই তথ্যটি বর্তমানে আমার কাছে নেই। আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করতে পারেন:';
  }
  return 'Sorry, I don\'t have that information right now. Please contact our support team:';
}
