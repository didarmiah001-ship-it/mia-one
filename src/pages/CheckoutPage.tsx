import { useState, useEffect } from 'react';
import { useNavigate } from '../lib/router';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ArrowRight, Banknote, Smartphone, CreditCard, Building2, Globe,
  MapPin, User, Phone, ChevronDown, Tag, CheckCircle2, Loader2, X, Lock,
  ShieldCheck, Zap, AlertCircle, Edit3, Plus, Truck,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../lib/auth';
import { appConfig } from '../lib/config';
import {
  createOrder, validateCoupon, incrementCouponUsage, fetchAddresses,
  createPayment, initiateSSLCommerzPayment,
} from '../lib/api';
import { supabase } from '../lib/supabase';

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
  'Bogra': ['Bogra Sadar', 'Adamdighi', 'Bogra Sadar Upazila', 'Dhunat', 'Dhupchanchia', 'Gabtali', 'Kahaloo', 'Nandigram', 'Sariakandi', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Sonatala'],
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

// Delivery zones — fallback only, overridden by admin settings from DB
const DELIVERY_ZONES: Record<string, { charge: number; zone: string }> = {
  'Dhaka': { charge: 60, zone: 'Inside Dhaka' },
  'Gazipur': { charge: 70, zone: 'Dhaka Suburb' },
  'Narayanganj': { charge: 70, zone: 'Dhaka Suburb' },
  'Munshiganj': { charge: 80, zone: 'Dhaka Suburb' },
  'Narsingdi': { charge: 90, zone: 'Dhaka Division' },
  'Manikganj': { charge: 90, zone: 'Dhaka Division' },
  'Tangail': { charge: 100, zone: 'Dhaka Division' },
  'Faridpur': { charge: 110, zone: 'Dhaka Division' },
  'Rajbari': { charge: 110, zone: 'Dhaka Division' },
  'Gopalganj': { charge: 120, zone: 'Dhaka Division' },
  'Madaripur': { charge: 120, zone: 'Dhaka Division' },
  'Shariatpur': { charge: 120, zone: 'Dhaka Division' },
  'Kishoreganj': { charge: 110, zone: 'Dhaka Division' },
  'Mymensingh': { charge: 100, zone: 'Mymensingh' },
  'Jamalpur': { charge: 120, zone: 'Mymensingh' },
  'Sherpur': { charge: 130, zone: 'Mymensingh' },
  'Netrokona': { charge: 130, zone: 'Mymensingh' },
  'Chattogram': { charge: 120, zone: 'Chattogram' },
  'Cox\'s Bazar': { charge: 140, zone: 'Chattogram' },
  'Cumilla': { charge: 110, zone: 'Chattogram' },
  'Brahmanbaria': { charge: 120, zone: 'Chattogram' },
  'Chandpur': { charge: 130, zone: 'Chattogram' },
  'Feni': { charge: 130, zone: 'Chattogram' },
  'Lakshmipur': { charge: 130, zone: 'Chattogram' },
  'Noakhali': { charge: 130, zone: 'Chattogram' },
  'Rangamati': { charge: 140, zone: 'Chattogram' },
  'Khagrachari': { charge: 150, zone: 'Chattogram' },
  'Bandarban': { charge: 150, zone: 'Chattogram' },
  'Khulna': { charge: 120, zone: 'Khulna' },
  'Bagerhat': { charge: 130, zone: 'Khulna' },
  'Satkhira': { charge: 130, zone: 'Khulna' },
  'Jashore': { charge: 120, zone: 'Khulna' },
  'Narail': { charge: 130, zone: 'Khulna' },
  'Magura': { charge: 130, zone: 'Khulna' },
  'Meherpur': { charge: 130, zone: 'Khulna' },
  ' Chuadanga': { charge: 130, zone: 'Khulna' },
  'Jhenaidah': { charge: 130, zone: 'Khulna' },
  'Kushtia': { charge: 130, zone: 'Khulna' },
  'Rajshahi': { charge: 120, zone: 'Rajshahi' },
  'Natore': { charge: 130, zone: 'Rajshahi' },
  'Naogaon': { charge: 130, zone: 'Rajshahi' },
  'Nawabganj': { charge: 130, zone: 'Rajshahi' },
  'Pabna': { charge: 130, zone: 'Rajshahi' },
  'Sirajganj': { charge: 120, zone: 'Rajshahi' },
  'Bogra': { charge: 130, zone: 'Rajshahi' },
  'Joypurhat': { charge: 130, zone: 'Rajshahi' },
  'Dinajpur': { charge: 140, zone: 'Rangpur' },
  'Rangpur': { charge: 130, zone: 'Rangpur' },
  'Nilphamari': { charge: 130, zone: 'Rangpur' },
  'Panchagarh': { charge: 140, zone: 'Rangpur' },
  'Thakurgaon': { charge: 140, zone: 'Rangpur' },
  'Kurigram': { charge: 140, zone: 'Rangpur' },
  'Lalmonirhat': { charge: 140, zone: 'Rangpur' },
  'Gaibandha': { charge: 130, zone: 'Rangpur' },
  'Sylhet': { charge: 120, zone: 'Sylhet' },
  'Sunamganj': { charge: 130, zone: 'Sylhet' },
  'Moulvibazar': { charge: 130, zone: 'Sylhet' },
  'Habiganj': { charge: 130, zone: 'Sylhet' },
  'Barishal': { charge: 120, zone: 'Barishal' },
  'Bhola': { charge: 130, zone: 'Barishal' },
  'Patuakhali': { charge: 130, zone: 'Barishal' },
  'Pirojpur': { charge: 130, zone: 'Barishal' },
  'Barguna': { charge: 140, zone: 'Barishal' },
  'Jhalokati': { charge: 130, zone: 'Barishal' },
};

// Default delivery settings — overridden by admin-configured values from DB
const DEFAULT_DELIVERY_SETTINGS = {
  inside_dhaka: 60,
  outside_dhaka: 120,
  free_delivery_min: 500,
  express_delivery: 100,
  express_enabled: false,
};

// Dynamic payment methods fetched from database
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
}

// Map payment type to icon and color
const PAYMENT_TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  'bkash': { icon: Smartphone, color: '#E2136E' },
  'nagad': { icon: Smartphone, color: '#F6921E' },
  'rocket': { icon: Smartphone, color: '#8B5CF6' },
  'bank_transfer': { icon: Building2, color: '#00D1FF' },
  'cash_on_delivery': { icon: Banknote, color: '#FF8A00' },
  'stripe': { icon: CreditCard, color: '#6772E5' },
  'sslcommerz': { icon: Globe, color: '#00AEEF' },
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

  // Delivery form with Bangladesh address fields
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    district: '',
    thana: '',
    notes: '',
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [paymentMethodsDB, setPaymentMethodsDB] = useState<PaymentMethodDB[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState<any>(DEFAULT_DELIVERY_SETTINGS);

  // Fetch delivery charge settings from admin-configured DB values
  useEffect(() => {
    supabase.from('settings').select('value').eq('key', 'delivery_charges').maybeSingle()
      .then(({ data }) => {
        if (data?.value) setDeliverySettings({ ...DEFAULT_DELIVERY_SETTINGS, ...data.value });
      });
  }, []);

  // Get thanas for selected district - with safe fallback
  const availableThanas = form.district && BANGLADESH_THANAS[form.district] ? BANGLADESH_THANAS[form.district] : [];

  // Determine delivery zone based on district and customer selection
  const isInsideDhaka = form.district === 'Dhaka';
  const isMunshiganj = form.district === 'Munshiganj';
  const isRemoteDistrict = REMOTE_DISTRICTS.includes(form.district || '');
  const isRemote = form.isRemoteArea || isRemoteDistrict;

  const deliveryZone = isRemote ? 'remote_area' : isMunshiganj ? 'munshiganj' : isInsideDhaka ? 'inside_dhaka' : 'outside_dhaka';

  // Calculate base delivery charge from admin settings based on zone
  const baseCharge = (() => {
    if (isRemote) return deliverySettings.remote_area;
    if (isMunshiganj) return deliverySettings.munshiganj;
    if (isInsideDhaka) return deliverySettings.inside_dhaka;
    return deliverySettings.outside_dhaka;
  })();

  // Add express delivery charge if selected and enabled
  const expressAddOn = form.isExpress && deliverySettings.express_enabled ? deliverySettings.express_delivery : 0;
  const areaCharge = baseCharge + expressAddOn;

  // Safe subtotal calculation with null checks
  const subtotal = Math.round((state?.cart || []).reduce((s, i) => s + (i?.product?.discount_price || i?.product?.price || 0) * (i?.quantity || 0), 0));

  // Free delivery if subtotal >= threshold OR coupon gives free delivery
  const hasFreeDeliveryCoupon = couponApplied?.free_delivery === true;
  const deliveryCharge = (subtotal >= (deliverySettings.free_delivery_min || 0) || hasFreeDeliveryCoupon) ? 0 : areaCharge;
  const deliveryDiscount = hasFreeDeliveryCoupon ? areaCharge : 0;

  const couponDiscount = couponApplied?.discount ?? 0;
  const discount = couponDiscount;
  const total = Math.round(Math.max(0, subtotal + deliveryCharge - discount));

  useEffect(() => {
    if (profile?.full_name) setForm(f => ({ ...f, full_name: profile.full_name }));
  }, [profile]);

  // Fetch payment methods from database
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      setLoadingPaymentMethods(true);
      try {
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          setPaymentMethodsDB(data as PaymentMethodDB[]);
          // Set the first active method as default
          if (data[0]) {
            setPaymentMethod(data[0].payment_type);
          }
        }
      } catch (err) {
        // Silently handle errors - will fallback to COD
      }
      setLoadingPaymentMethods(false);
    };
    fetchPaymentMethods();
  }, []);

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
        })
        .catch(() => {
          // Silently handle address fetch errors
        });
    }
  }, [user]);

  // Validate form fields
  const validateField = (field: string, value: string) => {
    if (!value.trim()) {
      return t('checkout.err' + field.charAt(0).toUpperCase() + field.slice(1).replace('_', ''));
    }
    if (field === 'phone' && value.length < 10) {
      return t('checkout.errValidPhone');
    }
    return '';
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const requiredFields = ['full_name', 'phone', 'address', 'district', 'thana'];
    requiredFields.forEach(field => {
      const error = validateField(field, form[field as keyof typeof form] as string);
      if (error) errors[field] = error;
    });
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form field changes and clear errors
  const handleFormChange = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(e => ({ ...e, [field]: '' }));
    }
    // Reset thana when district changes
    if (field === 'district') {
      setForm(f => ({ ...f, thana: '' }));
    }
  };

  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    const result = await validateCoupon(couponInput.trim(), subtotal, state?.cart || [], user?.id);
    if (result.error) { setCouponError(result.error); setCouponApplied(null); }
    else setCouponApplied({ code: couponInput.trim().toUpperCase(), discount: result.discount, free_delivery: result.free_delivery });
    setCouponLoading(false);
  };

  const removeCoupon = () => { setCouponApplied(null); setCouponInput(''); setCouponError(''); };
  const isFormValid = form.full_name.trim() && form.phone.trim() && form.address.trim() && form.district && form.thana;

  const handlePlaceOrder = async () => {
    if (!isFormValid) return;
    setSubmitting(true);
    setError('');

    const orderItems = (state?.cart || []).map(item => ({
      product_id: item?.product?.id || '',
      name: item?.product?.name || '',
      price: item?.product?.discount_price || item?.product?.price || 0,
      quantity: item?.quantity || 0,
      image: item?.product?.image || '',
    }));

    const orderPayload = {
      user_id: user?.id || null,
      items: orderItems,
      subtotal,
      delivery_charge: deliveryCharge,
      discount,
      total,
      status: 'placed',
      payment_method: paymentMethod,
      address: {
        full_name: form.full_name,
        phone: form.phone,
        address: form.address,
        district: form.district,
        thana: form.thana,
        area: `${form.thana}, ${form.district}`,
        notes: form.notes
      },
      coupon_code: couponApplied?.code ?? null,
      coupon_discount: couponDiscount,
      delivery_discount: deliveryDiscount,
      city: form.district,
    };

    let orderId = generateOrderId();
    let orderNumber = orderId;
    let dbOrderId = '';

    // Always create order in database (both authenticated and guest)
    const { data, error: orderErr } = await createOrder(orderPayload);
    if (orderErr || !data) {
      setError(orderErr || t('checkout.orderFailed'));
      setSubmitting(false);
      return;
    }
    dbOrderId = data.id;
    orderId = data.id;
    orderNumber = data.order_number || data.id;
    if (couponApplied?.code) await incrementCouponUsage(couponApplied.code, user?.id, dbOrderId);

    // Create payment record
    let paymentId = '';
    if (dbOrderId) {
      const { data: pmtData } = await createPayment({
        order_id: dbOrderId,
        user_id: user?.id || null,
        method: paymentMethod,
        amount: total,
        currency: 'BDT',
      });
      if (pmtData) paymentId = pmtData.id;
    }

    // For Stripe — redirect to payment page with intent creation there
    if (paymentMethod === 'stripe') {
      dispatch({ type: 'ADD_ORDER', order: { id: orderId, items: [...(state?.cart || [])], total, delivery_charge: deliveryCharge, status: 'placed', payment_method: paymentMethod, address: { full_name: form.full_name, mobile: form.phone, address: form.address, district: form.district, thana: form.thana, area: `${form.thana}, ${form.district}`, notes: form.notes }, created_at: new Date().toISOString() } });
      dispatch({ type: 'CLEAR_CART' });
      setSubmitting(false);
      navigate(`/payment?order_id=${orderId}&order_number=${orderNumber}&total=${total}&method=stripe&payment_id=${paymentId}`);
      return;
    }

    // For SSLCommerz — initiate and redirect to gateway
    if (paymentMethod === 'sslcommerz') {
      const { gateway_url, error: sslErr } = await initiateSSLCommerzPayment({
        order_id: dbOrderId || orderId,
        amount: total,
        customer_name: form.full_name,
        customer_phone: form.phone,
        customer_address: `${form.address}, ${form.thana}, ${form.district}`,
      });

      if (sslErr || !gateway_url) {
        setError(sslErr || t('checkout.sslFailed'));
        setSubmitting(false);
        return;
      }

      dispatch({ type: 'ADD_ORDER', order: { id: orderId, items: [...(state?.cart || [])], total, delivery_charge: deliveryCharge, status: 'placed', payment_method: paymentMethod, address: { full_name: form.full_name, mobile: form.phone, address: form.address, district: form.district, thana: form.thana, area: `${form.thana}, ${form.district}`, notes: form.notes }, created_at: new Date().toISOString() } });
      dispatch({ type: 'CLEAR_CART' });
      setSubmitting(false);
      // Redirect to SSLCommerz gateway
      window.location.href = gateway_url;
      return;
    }

    // For manual payments (COD / bKash / Nagad / bank_transfer)
    dispatch({ type: 'ADD_ORDER', order: { id: orderId, items: [...(state?.cart || [])], total, delivery_charge: deliveryCharge, status: 'placed', payment_method: paymentMethod, address: { full_name: form.full_name, mobile: form.phone, address: form.address, district: form.district, thana: form.thana, area: `${form.thana}, ${form.district}`, notes: form.notes }, created_at: new Date().toISOString() } });
    dispatch({ type: 'CLEAR_CART' });
    setSubmitting(false);

    // bKash / Nagad go to payment page to submit TxID
    if (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'bank_transfer') {
      navigate(`/payment?order_id=${orderId}&order_number=${orderNumber}&total=${total}&method=${paymentMethod}&payment_id=${paymentId}`);
      return;
    }

    navigate(`/order-success?id=${orderId}&number=${orderNumber}&total=${total}&method=${paymentMethod}`);
  };

  if (!state?.cart || state.cart.length === 0) { navigate('/cart'); return null; }

  const inputClass = 'w-full px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none transition-colors rounded-xl bg-white/[0.03] border border-white/[0.06] focus:border-mia-orange/40';

  return (
    <div className={`page-transition ${step === 'confirmation' ? 'pb-28' : 'pb-[180px]'}`}>
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => step === 'payment' ? setStep('info') : navigate('/cart')}
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-white">
              {step === 'info' ? t('checkout.deliveryInfo') : t('checkout.reviewPay')}
            </h1>
            {/* 3-step progress */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {steps.map((s, i) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold transition-all"
                      style={s.done || s.active
                        ? { background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)' }}>
                      {s.done && !s.active ? '✓' : i + 1}
                    </div>
                    <span className="text-[10px] font-medium transition-colors"
                      style={{ color: s.active ? '#FF8A00' : s.done ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-6 h-px transition-all" style={{ background: s.done ? 'rgba(255,138,0,0.4)' : 'rgba(255,255,255,0.08)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 text-[10px] text-white/25">
            <Lock size={10} />
            <span>{t('checkout.secureCheckout')}</span>
          </div>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl text-sm text-red-300 flex items-center gap-2"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <X size={14} className="shrink-0" /> {error}
          </div>
        )}

        {/* ── STEP 1: Delivery Info ── */}
        {step === 'info' && (
          <>
            {/* Saved Addresses */}
            {savedAddresses.length > 0 && (
              <div className="glow-card p-4">
                <button onClick={() => setShowAddressPicker(!showAddressPicker)}
                  className="w-full flex items-center justify-between">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <MapPin size={14} className="text-mia-blue" /> {t('checkout.useSavedAddress')}
                  </span>
                  <ChevronDown size={14} className={`text-white/40 transition-transform ${showAddressPicker ? 'rotate-180' : ''}`} />
                </button>
                {showAddressPicker && (
                  <div className="mt-3 space-y-2">
                    {(savedAddresses || []).map((a: any) => (
                      <button key={a?.id || Math.random()} onClick={() => { applyAddress(a); setShowAddressPicker(false); }}
                        className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.01]"
                        style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-mia-orange">{a?.label || 'Address'}</span>
                          {a?.is_default && <span className="text-[9px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">{t('checkout.default')}</span>}
                        </div>
                        <p className="text-xs text-white/70">{a?.full_name || ''} · {a?.phone || ''}</p>
                        <p className="text-xs text-white/40 truncate">{a?.address || ''}, {a?.district || ''}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Premium Shipping Address Card */}
            <div className="glow-card p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin size={18} className="text-mia-orange" /> {t('checkout.shippingAddress')}
                </h3>
                <div className="flex items-center gap-1 text-[10px] text-white/30 bg-white/5 px-2 py-1 rounded-lg">
                  <Lock size={10} />
                  <span>{t('checkout.secure')}</span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">
                    {t('checkout.fullName')} <span className="text-mia-orange">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      placeholder={t('checkout.fullNamePlaceholder')}
                      value={form.full_name}
                      onChange={e => handleFormChange('full_name', e.target.value)}
                      autoComplete="name"
                      className={`w-full pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all rounded-2xl bg-white/[0.04] border ${
                        formErrors.full_name ? 'border-red-500/50' : 'border-white/[0.08] focus:border-mia-orange/50'
                      }`}
                    />
                    {formErrors.full_name && (
                      <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                        <AlertCircle size={10} /> {formErrors.full_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone Number with Country Code */}
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">
                    {t('checkout.phoneNumber')} <span className="text-mia-orange">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] shrink-0">
                      <span className="text-sm font-medium text-white/70">+88</span>
                    </div>
                    <div className="flex-1 relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={form.phone}
                        onChange={e => handleFormChange('phone', e.target.value.replace(/[^0-9]/g, ''))}
                        autoComplete="tel"
                        maxLength={11}
                        className={`w-full pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all rounded-2xl bg-white/[0.04] border ${
                          formErrors.phone ? 'border-red-500/50' : 'border-white/[0.08] focus:border-mia-orange/50'
                        }`}
                      />
                    </div>
                  </div>
                  {formErrors.phone && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={10} /> {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Full Address */}
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">
                    {t('checkout.fullAddress')} <span className="text-mia-orange">*</span>
                  </label>
                  <textarea
                    placeholder={t('checkout.addressPlaceholder')}
                    value={form.address}
                    onChange={e => handleFormChange('address', e.target.value)}
                    autoComplete="street-address"
                    rows={2}
                    className={`w-full px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all rounded-2xl bg-white/[0.04] border resize-none ${
                      formErrors.address ? 'border-red-500/50' : 'border-white/[0.08] focus:border-mia-orange/50'
                    }`}
                  />
                  {formErrors.address && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={10} /> {formErrors.address}
                    </p>
                  )}
                </div>

                {/* District Dropdown */}
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">
                    {t('checkout.district')} <span className="text-mia-orange">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.district}
                      onChange={e => handleFormChange('district', e.target.value)}
                      className={`w-full px-4 py-3.5 text-sm text-white focus:outline-none transition-all rounded-2xl bg-white/[0.04] border appearance-none cursor-pointer ${
                        formErrors.district ? 'border-red-500/50' : 'border-white/[0.08] focus:border-mia-orange/50'
                      } ${!form.district ? 'text-white/30' : ''}`}
                    >
                      <option value="" disabled className="">{t('checkout.selectDistrict')}</option>
                      {BANGLADESH_DISTRICTS.map(d => (
                        <option key={d} value={d} className="">{d}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                  {formErrors.district && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={10} /> {formErrors.district}
                    </p>
                  )}
                </div>

                {/* Thana/Upazila Dropdown */}
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">
                    {t('checkout.thana')} <span className="text-mia-orange">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={form.thana}
                      onChange={e => handleFormChange('thana', e.target.value)}
                      disabled={!form.district || availableThanas.length === 0}
                      className={`w-full px-4 py-3.5 text-sm text-white focus:outline-none transition-all rounded-2xl bg-white/[0.04] border appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        formErrors.thana ? 'border-red-500/50' : 'border-white/[0.08] focus:border-mia-orange/50'
                      } ${!form.thana ? 'text-white/30' : ''}`}
                    >
                      <option value="" disabled className="">
                        {form.district ? t('checkout.selectThana') : t('checkout.selectDistrictFirst')}
                      </option>
                      {availableThanas.map(t => (
                        <option key={t} value={t} className="">{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
                  </div>
                  {formErrors.thana && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={10} /> {formErrors.thana}
                    </p>
                  )}
                </div>

                {/* Delivery Note (Optional) */}
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">
                    {t('checkout.deliveryNote')} <span className="text-white/30">{t('common.optional')}</span>
                  </label>
                  <textarea
                    placeholder={t('checkout.deliveryNotePlaceholder')}
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-4 py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all rounded-2xl bg-white/[0.04] border border-white/[0.08] focus:border-mia-orange/50 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Delivery Info Banner */}
            {form.district && (
              <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl"
                style={{
                  background: deliveryCharge === 0
                    ? 'rgba(34,197,94,0.08)'
                    : 'rgba(255,138,0,0.06)',
                  border: deliveryCharge === 0
                    ? '1px solid rgba(34,197,94,0.2)'
                    : '1px solid rgba(255,138,0,0.15)'
                }}>
                <div className="flex items-center gap-3">
                  <Truck size={18} className={deliveryCharge === 0 ? 'text-green-400' : 'text-mia-orange'} />
                  <div>
                    <p className="text-xs text-white/70">
                      {t('checkout.deliveringTo')} <span className="text-white font-medium">{form.thana ? `${form.thana}, ` : ''}{form.district}</span>
                    </p>
                    <p className="text-[10px] text-white/40">{deliveryInfo.zone}</p>
                  </div>
                </div>
                <span className={`text-base font-bold ${deliveryCharge === 0 ? 'text-green-400' : 'text-mia-orange'}`}>
                  {deliveryCharge === 0 ? t('checkout.free') : `৳${deliveryCharge}`}
                </span>
              </div>
            )}

          </>
        )}

        {/* ── STEP 2: Review & Pay ── */}
        {step === 'payment' && (
          <>
            {/* Delivery summary */}
            <div className="glow-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-white/35 mb-1 uppercase tracking-wider font-medium">{t('checkout.deliveringTo')}</p>
                  <p className="text-sm font-semibold text-white">{form.full_name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{form.phone}</p>
                  <p className="text-xs text-white/40 mt-0.5">{form.address}</p>
                  <p className="text-xs text-white/40">{form.thana}, {form.district}</p>
                </div>
                <button onClick={() => setStep('info')} className="text-xs text-mia-orange hover:underline shrink-0 flex items-center gap-1">
                  <Edit3 size={10} /> {t('checkout.change')}
                </button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="glow-card p-4">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldCheck size={14} className="text-mia-pink" /> {t('checkout.paymentMethod')}
              </h3>

              {loadingPaymentMethods ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-[#FF8A00] border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentMethodsDB.map(pm => {
                    const config = PAYMENT_TYPE_CONFIG[pm.payment_type] || { icon: Banknote, color: '#FF8A00' };
                    const Icon = config.icon;
                    const color = config.color;
                    const isSelected = paymentMethod === pm.payment_type;
                    const displayName = pm.display_name || pm.payment_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    const accountInfo = pm.account_number || '';
                    return (
                      <button key={pm.id} onClick={() => setPaymentMethod(pm.payment_type)}
                        className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200"
                        style={isSelected
                          ? { background: `${color}0E`, border: `1.5px solid ${color}40` }
                          : { background: 'var(--bg-surface)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${color}12`, border: `1px solid ${color}20` }}>
                          <Icon size={18} style={{ color }} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-white">{displayName}</p>
                          {accountInfo && <p className="text-[11px] text-white/35">{accountInfo}</p>}
                          {pm.account_name && <p className="text-[10px] text-white/25">{pm.account_name}</p>}
                        </div>
                        <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                          style={isSelected
                            ? { borderColor: color, background: color }
                            : { borderColor: 'rgba(255,255,255,0.2)' }}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected payment info */}
              {(paymentMethod === 'stripe') && (
                <div className="mt-3 px-4 py-3 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(103,114,229,0.06)', border: '1px solid rgba(103,114,229,0.15)' }}>
                  <Lock size={12} className="text-[#6772E5] shrink-0" />
                  <p className="text-[11px] text-white/50">{t('checkout.cardNote')}</p>
                </div>
              )}
              {(paymentMethod === 'sslcommerz') && (
                <div className="mt-3 px-4 py-3 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(0,174,239,0.06)', border: '1px solid rgba(0,174,239,0.15)' }}>
                  <Zap size={12} className="text-[#00AEEF] shrink-0" />
                  <p className="text-[11px] text-white/50">{t('checkout.sslNote')}</p>
                </div>
              )}
              {/* Show payment instructions from database for mobile banking */}
              {['bkash', 'nagad', 'rocket', 'bank_transfer'].includes(paymentMethod) && (() => {
                const selectedMethod = paymentMethodsDB.find(pm => pm.payment_type === paymentMethod);
                const config = PAYMENT_TYPE_CONFIG[paymentMethod] || { color: '#FF8A00' };
                if (selectedMethod?.payment_instructions) {
                  return (
                    <div className="mt-3 px-4 py-3 rounded-xl"
                      style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <p className="text-[11px] text-white/50 leading-relaxed whitespace-pre-line">
                        {selectedMethod.payment_instructions}
                      </p>
                      {selectedMethod.account_number && (
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <p className="text-[10px] text-white/40">Account: {selectedMethod.account_number}</p>
                          {selectedMethod.account_name && <p className="text-[10px] text-white/40">Name: {selectedMethod.account_name}</p>}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Coupon */}
            <div className="glow-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Tag size={14} className="text-mia-purple" /> {t('checkout.couponCode')}
              </h3>
              {couponApplied ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-green-400" />
                      <div>
                        <p className="text-sm font-semibold text-green-400 font-mono">{couponApplied.code}</p>
                        <p className="text-xs text-green-400/60">
                          Discount: ৳{couponApplied.discount}
                          {couponApplied.free_delivery && ' · Free Delivery'}
                        </p>
                      </div>
                    </div>
                    <button onClick={removeCoupon} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                      <X size={13} className="text-white/50" />
                    </button>
                  </div>
                  <p className="text-xs text-green-400 font-medium">✅ কুপন সফলভাবে প্রয়োগ হয়েছে।</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter coupon code" value={couponInput}
                      onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleCoupon()}
                      className="flex-1 px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-purple/50 transition-colors font-mono tracking-wider" />
                    <button onClick={handleCoupon} disabled={couponLoading || !couponInput.trim()}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #7B2CFF, #FF2EC9)' }}>
                      {couponLoading ? <Loader2 size={14} className="animate-spin" /> : t('checkout.apply')}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-400">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="glow-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">{t('checkout.orderSummary')}</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {(state?.cart || []).map(item => (
                  <div key={item?.product?.id || Math.random()} className="flex items-center gap-2.5">
                    <img src={item?.product?.image || ''} alt={item?.product?.name || ''} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 truncate">{item?.product?.name || ''}</p>
                      <p className="text-[10px] text-white/35">×{item?.quantity || 0}</p>
                    </div>
                    <span className="text-xs font-semibold text-white/80">৳{((item?.product?.discount_price || item?.product?.price || 0) * (item?.quantity || 0))}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 mt-3 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">{t('checkout.subtotal')}</span>
                  <span className="text-white">৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">{t('checkout.delivery')} ({form.district})</span>
                  <span className={deliveryCharge === 0 ? 'text-green-400' : 'text-white'}>
                    {deliveryCharge === 0 ? t('checkout.free') : `৳${deliveryCharge}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">{t('checkout.coupon')} ({couponApplied?.code})</span>
                    <span className="text-green-400">-৳{discount}</span>
                  </div>
                )}
                <div className="border-t border-white/5 pt-2 flex justify-between">
                  <span className="text-sm font-bold text-white">{t('checkout.total')}</span>
                  <span className="text-xl font-bold text-mia-orange">৳{total}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {step === 'info' && (
        <div
          className="fixed left-0 right-0 z-40 px-4"
          style={{
            bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
            paddingBottom: '12px',
            paddingTop: '12px',
            background: 'linear-gradient(180deg, color-mix(in srgb, var(--bg-base) 85%, transparent) 0%, var(--bg-base) 100%)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div className="max-w-lg md:max-w-2xl mx-auto">
            <button
              onClick={() => { if (validateForm()) setStep('payment'); }}
              disabled={!isFormValid}
              className="w-full py-4 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 8px 32px rgba(255,138,0,0.3)' }}
            >
              {t('checkout.continueToPayment')} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="fixed left-0 right-0 z-40 px-4 pb-2" style={{ bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))' }}>
          <div className="max-w-lg md:max-w-2xl mx-auto">
            <button onClick={handlePlaceOrder} disabled={submitting}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 8px 32px rgba(255,138,0,0.3)' }}>
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> {t('checkout.processing')}</>
                : paymentMethod === 'stripe'
                  ? <><Lock size={14} /> {t('checkout.paySecurely')} — ৳{total}</>
                  : paymentMethod === 'sslcommerz'
                    ? <><Zap size={14} /> {t('checkout.payViaSSL')} — ৳{total}</>
                    : <>{t('checkout.placeOrder')} — ৳{total}</>}
            </button>
            <p className="text-center text-[10px] text-white/20 mt-1.5 flex items-center justify-center gap-1">
              <Lock size={9} /> {t('checkout.sslEncrypted')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
