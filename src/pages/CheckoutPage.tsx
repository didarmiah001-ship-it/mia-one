import { useState, useEffect } from 'react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ArrowRight, Banknote, Smartphone, CreditCard, Building2, Globe,
  MapPin, User, Phone, ChevronDown, Tag, CheckCircle2, Loader2, X, Lock,
  ShieldCheck, Zap, AlertCircle, Edit3, Plus, Truck, QrCode, Copy, Check
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../lib/auth';
import { appConfig } from '../lib/config';
import {
  createOrder, validateCoupon, incrementCouponUsage, fetchAddresses,
  createPayment, initiateSSLCommerzPayment, fetchDeliverySettings, fetchActivePaymentMethods,
} from '../lib/api';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase'; 

// Bangladesh Districts and Thanas
const BANGLADESH_DISTRICTS = [
  'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogra', 'Brahmanbaria',
  'Chandpur', 'Chattogram', 'Chuadanga', 'Cox\'s Bazar', 'Cumilla', 'Dhaka', 'Dinajpur',
  'Faridpur', 'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur',
  'Jashore', 'Jhalokati', 'Jhenaidah', 'Joypurhat', 'Khagrachari', 'Khulna', 'Kishoreganj',
  'Kurigram', 'Kushtia', 'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj',
  'Meherpur', 'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon', 'Narail', 'Narayanganj',
  'Narsingdi', 'Natore', 'Nawabganj', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna',
  'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur',
  'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon'
];

const REMOTE_DISTRICTS = [
  'Bandarban', 'Barguna', 'Bhola', 'Chuadanga', 'Cox\'s Bazar', 'Khagrachari',
  'Kurigram', 'Lalmonirhat', 'Meherpur', 'Panchagarh', 'Patuakhali', 'Rangamati',
  'Satkhira', 'Sherpur', 'Sunamganj', 'Sylhet', 'Thakurgaon',
];

const BANGLADESH_THANAS: Record<string, string[]> = {
  'Dhaka': ['Dhanmondi', 'Gulshan', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Pallabi', 'Sabujbagh', 'Tejgaon', 'Uttara', 'Wari', 'Cantonment', 'Kafrul', 'Adabor', 'Badda', 'Khilgaon', 'Demra', 'Shyampur', 'Sutrapur', 'Kotwali', 'Ramna', 'Hazaribagh', 'Lalbagh', 'Chawkbazar', 'Bangsal', 'Shahjahanpur', 'Shahbag', 'New Market', 'Kalabagan', 'Jatrabari', 'Kadamtali', 'Gendaria', 'Sutrapur', 'Wari'],
  'Gazipur': ['Gazipur Sadar', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur', 'Tongi'],
  'Narayanganj': ['Narayanganj Sadar', 'Fatulla', 'Bandar', 'Araihazar', 'Sonargaon', 'Rupganj', 'Siddhirganj', 'Chashara', 'Narayanganj City'],
  'Mymensingh': ['Mymensingh Sadar', 'Trishal', 'Bhaluka', 'Muktagacha', 'Navagram', 'Phulpur', 'Gafargaon', 'Hossainpur', 'Gouripur', 'Dhobaura', 'Ishwarganj', 'Gauripur', 'Nandail', 'Fulbaria', 'Tarakanda', 'Hakimpur'],
  'Chattogram': ['Chattogram Sadar', 'Agrabad', 'Pahartali', 'Kotwali', 'Halishahar', 'Panchlaish', 'Chandgaon', 'Bandar', 'Double Mooring', 'Karnaphuli', 'Bakalia', 'Bayazid', 'Patenga', 'Satkania', 'Banshkhali', 'Sandwip', 'Mirsharai', 'Fatikchhari', 'Raozan', 'Hathazari', 'Sitakunda', 'Rangunia', 'Boalkhali', 'Anwara', 'Swandwip', 'Chakaria', 'Cox\'s Bazar Sadar', 'Kutubdia', 'Ukhia', 'Teknaf', 'Maheshkhali', 'Ramu', 'Chakaria'],
  'Cumilla': ['Cumilla Sadar', 'Chandina', 'Daudkandi', 'Homna', 'Laksam', 'Muradnagar', 'Nangalkot', 'Debidwar', 'Brahmanpara', 'Burichang', 'Manoharganj', 'Meghna', 'Chauddagram', 'Titas', 'Montanagar', 'Shalidaha'],
  'Sylhet': ['Sylhet Sadar', 'Beanibazar', 'Bishwanath', 'Balaganj', 'South Surma', 'Dakshin Surma', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Zakiganj', 'Companiganj', 'Osmani Nagar'],
  'Rajshahi': ['Rajshahi Sadar', 'Bagha', 'Bagmara', 'Charghat', 'Durgapur', 'Godagari', 'Mohanpur', 'Pabanagar Sadar', 'Puthia', 'Tanore', 'Boalia', 'Rajpara', 'Shah Makhdum', 'Motihar'],
  'Khulna': ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Bataghata', 'Dumuria', 'Digholia', 'Koyra', 'Paikgachha', 'Rupsa', 'Terokhada'],
  'Barishal': ['Barishal Sadar', 'Bakerganj', 'Babalakandi', 'Gaurnadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Banaripara', 'Uzirpur', 'Agailjhara', 'Gournadi'],
  'Rangpur': ['Rangpur Sadar', 'Badarganj', 'Gangachara', 'Haridevpur', 'Kaunia', 'Pirgachha', 'Pirganj', 'Mithapukur', 'Taraganj', 'Rangpur City'],
  'Bogra': ['Bogra Sadar', 'Adamdighi', 'Bogra Sadar Upazila', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibҷanj', 'Sonatala'],
  'Dinajpur': ['Dinajpur Sadar', 'Birampur', 'Birganj', 'Biral', 'Bochaganj', 'Chirirbandar', 'Fulbari', 'Ghoraghat', 'Hakimpur', 'Kaharole', 'Khanshama', 'Nawabganj', 'Parbatipur', 'Phulbari', 'Setabganj'],
  'Faridpur': ['Faridpur Sadar', 'Alfadanga', 'Boalmari', 'Charbhadrasan', 'Madukhali', 'Nagarkanda', 'Saltha', 'Bhanga', 'Sadarpur'],
  'Jashore': ['Jashore Sadar', 'Abhaynagar', 'Bagherpara', 'Chaugachha', 'Keshabpur', 'Manirampur', 'Sharsha', 'Jhikargachha', 'Chowgacha'],
  'Sirajganj': ['Sirajganj Sadar', 'Belkuchi', 'Chauhali', 'Kamarkhanda', 'Kazipur', 'Raiganj', 'Shahjadpur', 'Tarash', 'Ullahpara', 'Dhanbari'],
  'Kushtia': ['Kushtia Sadar', 'Bheramara', 'Daulatpur', 'Khoksa', 'Kumarkhali', 'Mirpur', 'Darsana'],
  'Munshiganj': ['Munshiganj Sadar', 'Gazaria', 'Lohajang', 'Sreenagar', 'Tongibari', 'Sirajdikhan'],
  'Narsingdi': ['Narsingdi Sadar', 'Belabo', 'Monohardi', 'Palash', 'Raipura', 'Shibpur', 'Narsingdi City'],
  'Tangail': ['Tangail Sadar', 'Basail', 'Delduar', 'Dhanbari', 'Ghatail', 'Gopalpur', 'Kalihati', 'Madhupur', 'Mirzapur', 'Nagarpur', 'Sakhipur', 'Dhanbari'],
  'Jamalpur': ['Jamalpur Sadar', 'Bakshiganj', 'Dewanganj', 'Islampur', 'Madarganj', 'Melandaha', 'Sarishabari'],
  'Netrokona': ['Netrokona Sadar', 'Atpara', 'Barhatta', 'Durgapur', 'Kalmakanda', 'Kendua', 'Khaliajuri', 'Madan', 'Mohanganj', 'Purbadhala'],
  'Sherpur': ['Sherpur Sadar', 'Jhenaigati', 'Nakla', 'Nalitabari', 'Sreebardi'],
  'Kishoreganj': ['Kishoreganj Sadar', 'Austagram', 'Bajitpur', 'Bhairab', 'Hossainpur', 'Itna', 'Karakandi', 'Katiadi', 'Kuliarchar', 'Mithamain', 'Nikli', 'Pakundia', 'Tarail'],
  'Brahmanbaria': ['Brahmanbaria Sadar', 'Ashuganj', 'Bancharampur', 'Bijoypur', 'Kasba', 'Nabiganj', 'Nasirnagar', 'Sarail', 'Akhaura'],
  'Chandpur': ['Chandpur Sadar', 'Faridganj', 'Haimchar', 'Haziganj', 'Kachua', 'Matlab', 'Shahrasti'],
  'Feni': ['Feni Sadar', 'Chhagalnaiya', 'Daganbhuiyan', 'Parshuram', 'Phulgazi', 'Sonagazi'],
  'Lakshmipur': ['Lakshmipur Sadar', 'Kamalnagar', 'Raipur', 'Ramgati', 'Ramganj'],
  'Noakhali': ['Noakhali Sadar', 'Begumganj', 'Chatkhil', 'Companiganj', 'Hatiya', 'Kabirhat', 'Senbagh', 'Subarnachar'],
  'Patuakhali': ['Patuakhali Sadar', 'Bauphal', 'Dashmina', 'Dumki', 'Galachipa', 'Kaluapara', 'Mirzaganj', 'Rangabali'],
  'Pirojpur': ['Pirojpur Sadar', 'Bhandaria', 'Kawkhali', 'Mathbaria', 'Nazirpur', 'Nesarabad', 'Indurkani'],
  'Barguna': ['Barguna Sadar', 'Amtali', 'Betagi', 'Patharghata', 'Taltali'],
  'Bhola': ['Bhola Sadar', 'Borhanuddin', 'Char Fasson', 'Daulatkhan', 'Lalmohan', 'Manpura', 'Tazumuddin'],
  'Jhalokati': ['Jhalokati Sadar', 'Kathalia', 'Nalchity', 'Rajapur'],
  'Satkhira': ['Satkhira Sadar', 'Assasuni', 'Debhata', 'Kalaroa', 'Kaliganj', 'Shyamnagar', 'Tala'],
  'Narail': ['Narail Sadar', 'Kalia', 'Lohagara', 'Naragati'],
  'Magura': ['Magura Sadar', 'Mohammadpur', 'Shalikha', 'Sreepur'],
  'Meherpur': ['Meherpur Sadar', 'Gangni', 'Mujibnagar'],
  'Nawabganj': ['Nawabganj Sadar', 'Bholahat', 'Gomastapur', 'Nachole', 'Shibganj'],
  'Naogaon': ['Naogaan Sadar', 'Atrai', 'Badalgachhi', 'Dhamurhat', 'Manda', 'Mahadevpur', 'Niamatpur', 'Patnitala', 'Raninagar', 'Sapahar', 'Porsha', 'Dhamoirhat'],
  'Natore': ['Natore Sadar', 'Baraigram', 'Gurudaspur', 'Lalpur', 'Bagatipara', 'Singra', 'Naldanga'],
  'Pabna': ['Pabna Sadar', 'Atgharia', 'Bera', 'Bhangura', 'Chatmohar', 'Faridpur', 'Ishwardi', 'Santhia', 'Sathia', 'Sujanagar'],
  'Rajbari': ['Rajbari Sadar', 'Baliakandi', 'Goalanda', 'Pangsha', 'Kalukhali'],
  'Shariatpur': ['Shariatpur Sadar', 'Bhedarganj', 'Damudya', 'Goshairhat', 'Naria', 'Janjira', 'Zanjira'],
  'Madaripur': ['Madaripur Sadar', 'Kalkini', 'Rajoir', 'Shibchar'],
  'Gopalganj': ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara'],
  'Bagerhat': ['Bagerhat Sadar', 'Chitalmagi', 'Fakirhat', 'Kachua', 'Mollahat', 'Mongla', 'Morrelganj', 'Rampal', 'Sarankhola'],
  'Khagrachari': ['Khagrachari Sadar', 'Dighinala', 'Lakshmichhari', 'Manikchhari', 'Matiranga', 'Panchhari', 'Ramgarh'],
  'Rangamati': ['Rangamati Sadar', 'Barkal', 'Kaukhali', 'Baghaichhari', 'Belaichhari', 'Jurachhari', 'Kaptai', 'Langadu', 'Naniarchar', 'Rajasthali'],
  'Bandarban': ['Bandarban Sadar', 'Ali Kadam', 'Lama', 'Naikhongchhari', 'Rowangchhari', 'Ruma', 'Thanchi'],
  'Sunamganj': ['Sunamganj Sadar', 'Bishwamvarpur', 'Chhatak', 'Derai', 'Dhairabazar', 'Dowarabazar', 'Jagannathpur', 'Jamalganj', 'Sullah', 'Tahirpur', 'Dakshin Sunamganj'],
  'Habiganj': ['Habiganj Sadar', 'Ajmiriganj', 'Baniachang', 'Chunarughat', 'Lakhai', 'Madhabpur', 'Nabiganj', 'Shaistaganj'],
  'Moulvibazar': ['Moulvibazar Sadar', 'Barlekha', 'Juri', 'Kulaura', 'Rajnagar', 'Sreemangal', 'Kamalganj'],
  'Cox\'s Bazar': ['Cox\'s Bazar Sadar', 'Chakaria', 'Kutubdia', 'Maheshkhali', 'Ramu', 'Teknaf', 'Ukhia', 'Pekua'],
  'Kurigram': ['Kurigram Sadar', 'Bhurungamari', 'Char Rajibpur', 'Chilmari', 'Phulbari', 'Hatibandha', 'Nageshwari', 'Rajarhat', 'Raiganj', 'Ulipur', 'Roumari'],
  'Lalmonirhat': ['Lalmonirhat Sadar', 'Aditmari', 'Hatibandha', 'Kaliganj', 'Patgram'],
  'Nilphamari': ['Nilphamari Sadar', 'Dimla', 'Domar', 'Jaldhaka', 'Kishoreganj', 'Saidpur', 'Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia'],
  'Gaibandha': ['Gaibandha Sadar', 'Fulchhari', 'Gobindaganj', 'Palashbari', 'Sadullapur', 'Sughatta', 'Sundarganj'],
  'Thakurgaon': ['Thakurgaon Sadar', 'Baliadangi', 'Haripur', 'Pirganj', 'Ranishankail'],
  'Panchagarh': ['Panchagarh Sadar', 'Atwari', 'Boda', 'Debiganj', 'Tetulia'],
  'Joypurhat': ['Joypurhat Sadar', 'Akkelpur', 'Kalai', 'Khetlal', 'Panchbibi'],
};

// Delivery zones
const DELIVERY_ZONES: Record<string, { charge: number; zone: string }> = {
  'Dhaka': { charge: 60, zone: 'Inside Dhaka' },
  'Gazipur': { charge: 70, zone: 'Dhaka Suburb' },
  'Narayanganj': { charge: 70, zone: 'Dhaka Suburb' },
  'Munshiganj': { charge: 80, zone: 'Dhaka Suburb' },
  'Narsingdi': { charge: 90, zone: 'Dhaka Division' },
};

const DEFAULT_DELIVERY_SETTINGS = {
  inside_dhaka: 60,
  outside_dhaka: 120,
  remote_area: 150,
  munshiganj: 80,
  free_delivery_min: 500,
  express_delivery: 100,
  express_enabled: false,
};

interface PaymentMethodDB {
  id: string;
  payment_type: string;
  account_name: string;
  account_number: string;
  account_type: string;
  display_name: string;
  payment_instructions: string;
  is_active: boolean;
  sort_order: number;
  qr_code_url?: string;
  image_url?: string;
  qr_url?: string;
  bank_name?: string;
  branch_name?: string;
}

const FALLBACK_PAYMENT_METHODS: PaymentMethodDB[] = [
  {
    id: 'fallback-cod',
    payment_type: 'cash_on_delivery',
    account_name: '',
    account_number: '',
    account_type: 'cash',
    display_name: 'Cash on Delivery',
    payment_instructions: 'Pay with cash when your order is delivered.',
    is_active: true,
    sort_order: 999,
  },
];

const PAYMENT_TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  'bkash': { icon: Smartphone, color: '#E2136E' },
  'nagad': { icon: Smartphone, color: '#F6921E' },
  'rocket': { icon: Smartphone, color: '#8B5CF6' },
  'bank_transfer': { icon: Building2, color: '#00D1FF' },
  'cash_on_delivery': { icon: Banknote, color: '#FF8A00' },
  'stripe': { icon: CreditCard, color: '#6772E5' },
  'sslcommerz': { icon: Globe, color: '#00AEEF' },
  'bangla_qr': { icon: QrCode, color: '#10B981' }, 
};

function generateOrderId() {
  return 'MIA-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function CheckoutPage() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { label: t('checkout.cart'), done: true },
    { label: t('checkout.delivery'), done: step === 'payment', active: step === 'info' },
    { label: t('checkout.payment'), done: false, active: step === 'payment' },
  ];

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    district: '',
    thana: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [paymentMethodsDB, setPaymentMethodsDB] = useState<PaymentMethodDB[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [copiedField, setCopiedField] = useState(false);
  const [globalAdminQrUrl, setGlobalAdminQrUrl] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState<any>(DEFAULT_DELIVERY_SETTINGS);

  useEffect(() => {
    fetchDeliverySettings()
      .then(value => {
        if (value) setDeliverySettings({ ...DEFAULT_DELIVERY_SETTINGS, ...value });
      })
      .catch(() => {});
  }, []);

  // ওভির অ্যাপের ডাটাবেস সেটিংস কালেকশন সিঙ্ক্রোনাইজেশন (সুরক্ষিত অন-স্ন্যাপশট)
  useEffect(() => {
    const settingsDocRef = doc(db, 'settings', 'payment');
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const url = data?.bangla_qr_url || data?.qr_url || data?.image_url || data?.qr_code_url || data?.url || data?.qrCode;
        if (url) setGlobalAdminQrUrl(url);
      }
    }, (err) => {
      console.error("Firebase fetch error:", err);
    });
    return () => unsubscribe();
  }, []);

  const availableThanas = form.district && BANGLADESH_THANAS[form.district] ? BANGLADESH_THANAS[form.district] : [];
  const isInsideDhaka = form.district === 'Dhaka';
  const isMunshiganj = form.district === 'Munshiganj';
  const isRemoteDistrict = REMOTE_DISTRICTS.includes(form.district || '');
  const isRemote = form.isRemoteArea || isRemoteDistrict;

  const baseCharge = (() => {
    if (isRemote) return deliverySettings.remote_area ?? 150;
    if (isMunshiganj) return deliverySettings.munshiganj ?? 80;
    if (isInsideDhaka) return deliverySettings.inside_dhaka ?? 60;
    return deliverySettings.outside_dhaka ?? 120;
  })();

  const subtotal = Math.round((state?.cart || []).reduce((s, i) => s + (i.product.discount_price || i.product.price) * i.quantity, 0));
  const hasFreeDeliveryCoupon = couponApplied?.free_delivery === true;
  const deliveryCharge = (subtotal >= (deliverySettings.free_delivery_min || 0) || hasFreeDeliveryCoupon) ? 0 : baseCharge;
  const discount = couponApplied?.discount ?? 0;
  const total = Math.round(Math.max(0, subtotal + deliveryCharge - discount));

  useEffect(() => {
    if (profile?.full_name) setForm(f => ({ ...f, full_name: profile.full_name }));
  }, [profile]);

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setLoadingPaymentMethods(true);
      try {
        const data = await fetchActivePaymentMethods();
        if (data && data.length > 0) {
          setPaymentMethodsDB(data as PaymentMethodDB[]);
          if (data[0]) setPaymentMethod(data[0].payment_type);
        } else {
          setPaymentMethodsDB(FALLBACK_PAYMENT_METHODS);
        }
      } catch {
        setPaymentMethodsDB(FALLBACK_PAYMENT_METHODS);
      }
      setLoadingPaymentMethods(false);
    };
    fetchPaymentMethods();
  }, []);

  const handleCopyNumber = (num: string) => {
    if (!num) return;
    navigator.clipboard.writeText(num);
    setCopiedField(true);
    setTimeout(() => setCopiedField(false), 2000);
  };

  const applyAddress = (a: any) => {
    if (!a) return;
    setForm(f => ({
      ...f,
      full_name: a.full_name || f.full_name,
      phone: a.phone || f.phone,
      address: a.address || f.address,
      district: a.district || f.district,
      thana: a.thana || f.thana,
      notes: a.notes || f.notes,
    }));
  };

  useEffect(() => {
    if (user?.id) {
      fetchAddresses(user.id)
        .then(a => {
          if (Array.isArray(a) && a.length > 0) {
            setSavedAddresses(a);
            const def = a.find((x: any) => x?.is_default);
            if (def) applyAddress(def);
          }
        }).catch(() => {});
    }
  }, [user]);

  const handleFormChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (formErrors[field]) setFormErrors(e => ({ ...e, [field]: '' }));
    if (field === 'district') setForm(f => ({ ...f, thana: '' }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    ['full_name', 'phone', 'address', 'district', 'thana'].forEach(f => {
      if (!form[f as keyof typeof form]?.trim()) errors[f] = 'Required';
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    const result = await validateCoupon(couponInput.trim(), subtotal, state?.cart || [], user?.id);
    if (result.error) setCouponError(result.error);
    else setCouponApplied({ code: couponInput.trim().toUpperCase(), discount: result.discount });
    setCouponLoading(false);
  };

  const removeCoupon = () => { setCouponApplied(null); setCouponInput(''); setCouponError(''); };
  const isFormValid = form.full_name.trim() && form.phone.trim() && form.address.trim() && form.district && form.thana;
  
  const isManualPayment = paymentMethod !== 'cash_on_delivery' && paymentMethod !== 'stripe' && paymentMethod !== 'sslcommerz';
  const isPaymentFieldsFilled = isManualPayment ? (senderNumber.trim() && transactionId.trim()) : true;

  const handlePlaceOrder = async () => {
    if (!isFormValid || !isPaymentFieldsFilled) return;
    setSubmitting(true);

    const orderPayload = {
      user_id: user?.id || null,
      items: (state?.cart || []).map(i => ({ product_id: i.product.id, name: i.product.name, price: i.product.discount_price || i.product.price, quantity: i.quantity, image: i.product.image })),
      subtotal, delivery_charge: deliveryCharge, discount, total, status: 'placed', payment_method: paymentMethod,
      address: { full_name: form.full_name, phone: form.phone, address: form.address, district: form.district, thana: form.thana, area: `${form.thana}, ${form.district}`, notes: form.notes },
      sender_number: isManualPayment ? senderNumber : null,
      transaction_id: isManualPayment ? transactionId : null,
    };

    const { data } = await createOrder(orderPayload);
    if (data) {
      if (isManualPayment) {
        await createPayment({ order_id: data.id, method: paymentMethod, amount: total, currency: 'BDT', order_number: data.order_number || data.id, sender_number: senderNumber, transaction_id: transactionId });
      }
      dispatch({ type: 'CLEAR_CART' });
      navigate(`/order-success?id=${data.id}&number=${data.order_number || data.id}&total=${total}&method=${paymentMethod}`);
    }
    setSubmitting(false);
  };

  return (
    <div className="page-transition pb-[140px]">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => step === 'payment' ? setStep('info') : navigate('/cart')} className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
            <ArrowLeft size={16} className="text-white" />
          </button>
          <h1 className="text-sm font-bold text-white uppercase tracking-wider">{step === 'info' ? 'Delivery Info' : 'Review & Payment'}</h1>
          <div className="text-[10px] text-white/40 flex items-center gap-1"><Lock size={10}/>Secure</div>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {step === 'info' && (
          <div className="glow-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><MapPin size={16} className="text-mia-orange" /> Shipping Details</h3>
            <input type="text" placeholder="Full Name" value={form.full_name} onChange={e => handleFormChange('full_name', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
            <input type="tel" placeholder="Mobile Number" value={form.phone} onChange={e => handleFormChange('phone', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none" />
            <textarea placeholder="Full Address" value={form.address} onChange={e => handleFormChange('address', e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none resize-none" />
            <select value={form.district} onChange={e => handleFormChange('district', e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none cursor-pointer">
              <option value="" disabled className="bg-neutral-900 text-white/50">Select District</option>
              {BANGLADESH_DISTRICTS.map(d => <option key={d} value={d} className="bg-neutral-900 text-white">{d}</option>)}
            </select>
            <select value={form.thana} onChange={e => handleFormChange('thana', e.target.value)} disabled={!form.district} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none cursor-pointer disabled:opacity-40">
              <option value="" disabled className="bg-neutral-900 text-white/50">Select Thana</option>
              {availableThanas.map(t => <option key={t} value={t} className="bg-neutral-900 text-white">{t}</option>)}
            </select>
          </div>
        )}

        {step === 'payment' && (
          <>
            <div className="glow-card p-4 flex justify-between items-center bg-white/[0.02]">
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold">Delivery Address</p>
                <p className="text-sm font-semibold text-white mt-1">{form.full_name} ({form.phone})</p>
                <p className="text-xs text-white/50">{form.address}, {form.thana}, {form.district}</p>
              </div>
              <button onClick={() => setStep('info')} className="text-xs text-mia-orange hover:underline">Edit</button>
            </div>

            <div className="glow-card p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2"><ShieldCheck size={16} className="text-mia-pink" /> Choose Payment Method</h3>
              <div className="space-y-2">
                {paymentMethodsDB.map(pm => {
                  const conf = PAYMENT_TYPE_CONFIG[pm.payment_type] || { icon: Banknote, color: '#FF8A00' };
                  const Icon = conf.icon;
                  const isSelected = paymentMethod === pm.payment_type;
                  return (
                    <button key={pm.id} onClick={() => setPaymentMethod(pm.payment_type)} className="w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all" style={isSelected ? { background: `${conf.color}0D`, borderColor: `${conf.color}50` } : { background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${conf.color}15` }}><Icon size={18} style={{ color: conf.color }} /></div>
                        <span className="text-sm font-medium text-white">{pm.display_name || pm.payment_type.toUpperCase()}</span>
                      </div>
                      <div className="w-4 h-4 rounded-full border border-white/30 flex items-center justify-center">{isSelected && <div className="w-2 h-2 rounded-full" style={{ background: conf.color }} />}</div>
                    </button>
                  );
                })}
              </div>

              {/* ওভির ম্যানুয়াল এবং কিউআর পেমেন্ট সেকশন */}
              {isManualPayment && (() => {
                const selectedMethod = paymentMethodsDB.find(pm => pm.payment_type === paymentMethod);
                // ফায়ারবেস ডকের কিউআর ইউআরএল মেথড লেভেলে থাকলে সেটাকে ১ নম্বর প্রায়োরিটি দেবে, নইলে সেটিংস থেকে ডাইনামিক সোর্স নিবে
                const qrImageSrc = selectedMethod?.qr_code_url || selectedMethod?.image_url || selectedMethod?.qr_url || (paymentMethod === 'bangla_qr' ? globalAdminQrUrl : '');
                const isBank = paymentMethod === 'bank_transfer';

                return (
                  <div className="mt-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    
               {paymentMethod === 'bangla_qr' && (
  <div className="flex justify-center my-1">
    <div className="w-44 h-44 bg-white p-2.5 rounded-2xl shadow-xl flex items-center justify-center">
      <img 
       src={globalAdminQrUrl || "https://ik.imagekit.io/i67rlxsde/bangla-qr_w9oHJ_8Sw.png"}
        alt="Bangla QR Code" 
        className="w-full h-full object-contain rounded-xl" 
      />
    </div>
  </div>
)}
                    {/* পেমেন্ট ডিটেইলস কার্ড */}
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/40 tracking-wider">PAYMENT DETAILS</span>
                        {selectedMethod?.account_type && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-mia-orange/20 text-mia-orange border border-mia-orange/30 capitalize">
                            {selectedMethod.account_type} Account
                          </span>
                        )}
                      </div>

                      {!isBank && selectedMethod?.account_number && (
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5">
                          <div>
                            <p className="text-[10px] text-white/33 font-medium">Account Number</p>
                            <p className="text-sm font-bold text-white font-mono mt-0.5 tracking-wider">{selectedMethod.account_number}</p>
                          </div>
                          <button onClick={() => handleCopyNumber(selectedMethod.account_number)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all flex items-center gap-1 text-white/70 text-xs">
                            {copiedField ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                            <span>{copiedField ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}

                      {isBank && (
                        <div className="space-y-2 text-xs text-white/70 border-t border-white/5 pt-2">
                          <div className="grid grid-cols-3 py-1 border-b border-white/5"><span className="text-white/40">Bank Name:</span><span className="col-span-2 text-white font-semibold">{selectedMethod?.bank_name || 'N/A'}</span></div>
                          <div className="grid grid-cols-3 py-1 border-b border-white/5"><span className="text-white/40">Branch Name:</span><span className="col-span-2 text-white font-semibold">{selectedMethod?.branch_name || 'N/A'}</span></div>
                          <div className="grid grid-cols-3 py-1 border-b border-white/5"><span className="text-white/40">Account Name:</span><span className="col-span-2 text-white font-semibold">{selectedMethod?.account_name || 'N/A'}</span></div>
                          <div className="flex items-center justify-between p-2.5 bg-black/20 rounded-xl border border-white/5 mt-2">
                            <div><p className="text-[10px] text-white/35">Account Number</p><p className="text-sm font-bold font-mono text-white tracking-wider mt-0.5">{selectedMethod?.account_number}</p></div>
                            <button onClick={() => handleCopyNumber(selectedMethod?.account_number || '')} className="p-2 bg-white/5 rounded-lg flex items-center gap-1 text-xs text-white/70">
                              {copiedField ? <Check size={12} className="text-green-400" /> : <Copy size={12} />} Copy
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedMethod?.payment_instructions && <p className="text-[11px] text-white/40 leading-relaxed italic">📝 Instruction: {selectedMethod.payment_instructions}</p>}

                    <div className="space-y-3 pt-2 border-t border-white/5">
                      <div className="space-y-1">
                        <label className="text-[11px] text-white/50 block font-medium">আপনার সেন্ডার নাম্বার (যে মোবাইল অ্যাকাউন্ট থেকে টাকা পাঠিয়েছেন): *</label>
                        <input type="tel" placeholder="01XXXXXXXXX" value={senderNumber} onChange={e => setSenderNumber(e.target.value.replace(/[^0-9]/g, ''))} maxLength={11} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:outline-none font-mono focus:border-mia-orange/40" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] text-white/50 block font-medium">ট্রানজেকশন আইডি (Transaction ID / TxID): *</label>
                        <input type="text" placeholder="TRX8X7Y6Z..." value={transactionId} onChange={e => setTransactionId(e.target.value)} className="w-full px-4 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs text-white focus:outline-none font-mono uppercase focus:border-mia-orange/40" />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </div>

      {/* ওভির নতুন ডিজাইনড মিডলড ফুল-উইডথ স্মার্ট বার */}
      <div className="fixed left-0 right-0 bottom-0 z-40 px-4 py-3.5 bg-neutral-950/80 backdrop-blur-md border-t border-white/5">
        <div className="max-w-lg md:max-w-2xl mx-auto">
          {step === 'info' ? (
            <button 
              onClick={() => { if (validateForm()) setStep('payment'); }} 
              disabled={!isFormValid} 
              className="w-full py-4 rounded-xl bg-gradient-to-r from-mia-orange to-mia-pink text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-40"
            >
              Continue to Payment (৳{total}) <ArrowRight size={16}/>
            </button>
          ) : (
            <button 
              onClick={handlePlaceOrder} 
              disabled={submitting || !isPaymentFieldsFilled} 
              className="w-full py-4 rounded-xl bg-gradient-to-r from-mia-orange to-mia-pink text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform disabled:opacity-40"
            >
              {submitting ? (
                <><Loader2 size={16} className="animate-spin" /> Confirming...</>
              ) : (
                <>Confirm & Place Order — ৳{total}</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
