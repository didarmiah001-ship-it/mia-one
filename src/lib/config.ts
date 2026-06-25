export const appConfig = {
  // Brand
  name: 'MIA ONE',
  shortName: 'MIA ONE',
  slogan: 'Everything You Need, One App',
  description: 'MIA ONE - Premium Shopping Experience. Everything You Need, One App.',
  logo: '/mia-one-logo.svg',

  // Colors (Logo Color Palette)
  colors: {
    orange: '#FF8A00',
    pink: '#FF2EC9',
    purple: '#7B2CFF',
    blue: '#00D1FF',
    black: '#0A0A0F',
    navy: '#0D1117',
    card: '#141820',
    surface: '#1A1F2E',
  },

  // Support
  support: {
    whatsappNumber: '8801XXXXXXXXX',
    whatsappUrl: 'https://wa.me/8801XXXXXXXXX',
    email: 'support@miaone.app',
    welcomeMessage: 'Assalamu Alaikum.\nI am MIA Agent.\nHow can I help you today?',
  },

  // Delivery
  delivery: {
    freeDeliveryThreshold: 500,
    deliveryCharge: 60,
    estimatedDays: '2-4 business days',
    currency: '৳',
  },

  // Banner Content
  banners: [
    {
      id: '1',
      title: 'Flash Sale',
      subtitle: 'Up to 50% Off on Electronics',
      color: '#FF8A00',
    },
    {
      id: '2',
      title: 'New Arrivals',
      subtitle: 'Fresh Products Every Day',
      color: '#00D1FF',
    },
    {
      id: '3',
      title: 'Free Delivery',
      subtitle: 'On Orders Above 500 BDT',
      color: '#7B2CFF',
    },
  ],

  // PWA
  pwa: {
    themeColor: '#0A0A0F',
    backgroundColor: '#0A0A0F',
    display: 'standalone' as const,
    orientation: 'portrait' as const,
    startUrl: '/',
    scope: '/',
  },
};
