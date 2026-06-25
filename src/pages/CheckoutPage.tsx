import { useState, useEffect } from 'react';
import { useNavigate } from '../lib/router';
import {
  ArrowLeft, Banknote, Smartphone, CreditCard, Building2, Globe,
  MapPin, User, Phone, ChevronDown, Tag, CheckCircle2, Loader2, X, Lock,
  ShieldCheck, Zap,
} from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { useAuth } from '../lib/auth';
import { appConfig } from '../lib/config';
import {
  createOrder, validateCoupon, incrementCouponUsage, fetchAddresses,
  createPayment, initiateSSLCommerzPayment,
} from '../lib/api';

const DELIVERY_AREAS: Record<string, number> = {
  'Dhaka City': 60,
  'Outside Dhaka': 120,
  'Chittagong': 120,
  'Sylhet': 120,
  'Rajshahi': 120,
  'Khulna': 120,
  'Barishal': 120,
  'Mymensingh': 100,
  'Rangpur': 120,
};

const PAYMENT_METHODS = [
  {
    id: 'cash_on_delivery',
    label: 'Cash on Delivery',
    sub: 'Pay when you receive',
    icon: Banknote,
    color: '#FF8A00',
    badge: null,
  },
  {
    id: 'bkash',
    label: 'bKash',
    sub: 'Mobile banking · Send Money',
    icon: Smartphone,
    color: '#E2136E',
    badge: 'INSTANT',
  },
  {
    id: 'nagad',
    label: 'Nagad',
    sub: 'Mobile banking · Send Money',
    icon: Smartphone,
    color: '#F6921E',
    badge: 'INSTANT',
  },
  {
    id: 'stripe',
    label: 'Card Payment',
    sub: 'Visa / Mastercard / Amex',
    icon: CreditCard,
    color: '#6772E5',
    badge: 'SECURE',
  },
  {
    id: 'sslcommerz',
    label: 'SSLCommerz',
    sub: 'All BD banks & wallets',
    icon: Globe,
    color: '#00AEEF',
    badge: 'POPULAR',
  },
  {
    id: 'bank_transfer',
    label: 'Bank Transfer',
    sub: 'NPSB / RTGS / BEFTN',
    icon: Building2,
    color: '#00D1FF',
    badge: null,
  },
];

function generateOrderId() {
  return 'MIA-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function CheckoutPage() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Delivery form
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    area: 'Dhaka City',
    city: 'Dhaka',
    notes: '',
  });

  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');

  // Coupon
  const [couponInput, setCouponInput] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const areaCharge = DELIVERY_AREAS[form.area] ?? appConfig.delivery.deliveryCharge;
  const subtotal = state.cart.reduce((s, i) => s + (i.product.discount_price || i.product.price) * i.quantity, 0);
  const deliveryCharge = subtotal >= appConfig.delivery.freeDeliveryThreshold ? 0 : areaCharge;
  const discount = couponApplied?.discount ?? 0;
  const total = Math.max(0, subtotal + deliveryCharge - discount);

  useEffect(() => {
    if (profile) setForm(f => ({ ...f, full_name: profile.full_name || '' }));
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchAddresses(user.id).then(a => {
        setSavedAddresses(a);
        const def = a.find((x: any) => x.is_default);
        if (def) applyAddress(def);
      });
    }
  }, [user]);

  const applyAddress = (a: any) => setForm(f => ({
    ...f,
    full_name: a.full_name || f.full_name,
    phone: a.phone || f.phone,
    address: a.address || f.address,
    area: a.area || f.area,
    city: a.city || f.city,
    notes: a.notes || f.notes,
  }));

  const handleCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    const result = await validateCoupon(couponInput.trim(), subtotal);
    if (result.error) { setCouponError(result.error); setCouponApplied(null); }
    else setCouponApplied({ code: couponInput.trim().toUpperCase(), discount: result.discount });
    setCouponLoading(false);
  };

  const removeCoupon = () => { setCouponApplied(null); setCouponInput(''); setCouponError(''); };
  const isFormValid = form.full_name.trim() && form.phone.trim() && form.address.trim() && form.area;

  const handlePlaceOrder = async () => {
    if (!isFormValid) return;
    setSubmitting(true);
    setError('');

    const orderItems = state.cart.map(item => ({
      product_id: item.product.id,
      name: item.product.name,
      price: item.product.discount_price || item.product.price,
      quantity: item.quantity,
      image: item.product.image,
    }));

    const orderPayload = {
      user_id: user?.id || '00000000-0000-0000-0000-000000000000',
      items: orderItems,
      subtotal,
      delivery_charge: deliveryCharge,
      discount,
      total,
      status: 'placed',
      payment_method: paymentMethod,
      address: { full_name: form.full_name, phone: form.phone, address: form.address, area: form.area, city: form.city, notes: form.notes },
      coupon_code: couponApplied?.code ?? null,
      city: form.city,
    };

    let orderId = generateOrderId();
    let orderNumber = orderId;
    let dbOrderId = '';

    if (user) {
      const { data, error: orderErr } = await createOrder(orderPayload);
      if (orderErr || !data) {
        setError('Failed to place order. Please try again.');
        setSubmitting(false);
        return;
      }
      dbOrderId = data.id;
      orderId = data.id;
      orderNumber = data.order_number || data.id;
      if (couponApplied?.code) await incrementCouponUsage(couponApplied.code);
    }

    // Create payment record
    let paymentId = '';
    if (user && dbOrderId) {
      const { data: pmtData } = await createPayment({
        order_id: dbOrderId,
        user_id: user.id,
        method: paymentMethod,
        amount: total,
        currency: 'BDT',
      });
      if (pmtData) paymentId = pmtData.id;
    }

    // For Stripe — redirect to payment page with intent creation there
    if (paymentMethod === 'stripe') {
      dispatch({ type: 'ADD_ORDER', order: { id: orderId, items: [...state.cart], total, delivery_charge: deliveryCharge, status: 'placed', payment_method: paymentMethod, address: { full_name: form.full_name, mobile: form.phone, address: form.address, area: form.area, notes: form.notes }, created_at: new Date().toISOString() } });
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
        customer_address: `${form.address}, ${form.area}`,
      });

      if (sslErr || !gateway_url) {
        setError(sslErr || 'SSLCommerz initiation failed. Please try another method.');
        setSubmitting(false);
        return;
      }

      dispatch({ type: 'ADD_ORDER', order: { id: orderId, items: [...state.cart], total, delivery_charge: deliveryCharge, status: 'placed', payment_method: paymentMethod, address: { full_name: form.full_name, mobile: form.phone, address: form.address, area: form.area, notes: form.notes }, created_at: new Date().toISOString() } });
      dispatch({ type: 'CLEAR_CART' });
      setSubmitting(false);
      // Redirect to SSLCommerz gateway
      window.location.href = gateway_url;
      return;
    }

    // For manual payments (COD / bKash / Nagad / bank_transfer)
    dispatch({ type: 'ADD_ORDER', order: { id: orderId, items: [...state.cart], total, delivery_charge: deliveryCharge, status: 'placed', payment_method: paymentMethod, address: { full_name: form.full_name, mobile: form.phone, address: form.address, area: form.area, notes: form.notes }, created_at: new Date().toISOString() } });
    dispatch({ type: 'CLEAR_CART' });
    setSubmitting(false);

    // bKash / Nagad go to payment page to submit TxID
    if (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'bank_transfer') {
      navigate(`/payment?order_id=${orderId}&order_number=${orderNumber}&total=${total}&method=${paymentMethod}&payment_id=${paymentId}`);
      return;
    }

    navigate(`/order-success?id=${orderId}&number=${orderNumber}&total=${total}&method=${paymentMethod}`);
  };

  if (state.cart.length === 0) { navigate('/cart'); return null; }

  const inputClass = 'w-full px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none transition-colors rounded-xl bg-white/[0.03] border border-white/[0.06] focus:border-mia-orange/40';

  return (
    <div className="page-transition pb-28">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => step === 'payment' ? setStep('info') : navigate(-1 as any)}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white">
              {step === 'info' ? 'Delivery Info' : 'Review & Pay'}
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              {[0, 1].map(i => (
                <div key={i} className="h-1 w-10 rounded-full transition-all duration-300"
                  style={{ background: i === 0 || step === 'payment' ? 'linear-gradient(90deg, #FF8A00, #FF2EC9)' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1 text-[10px] text-white/25">
            <Lock size={10} />
            <span>Secure Checkout</span>
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
            {savedAddresses.length > 0 && (
              <div className="glow-card p-4">
                <button onClick={() => setShowAddressPicker(!showAddressPicker)}
                  className="w-full flex items-center justify-between">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <MapPin size={14} className="text-mia-blue" /> Use Saved Address
                  </span>
                  <ChevronDown size={14} className={`text-white/40 transition-transform ${showAddressPicker ? 'rotate-180' : ''}`} />
                </button>
                {showAddressPicker && (
                  <div className="mt-3 space-y-2">
                    {savedAddresses.map((a: any) => (
                      <button key={a.id} onClick={() => { applyAddress(a); setShowAddressPicker(false); }}
                        className="w-full text-left p-3 rounded-xl transition-all hover:scale-[1.01]"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-mia-orange">{a.label}</span>
                          {a.is_default && <span className="text-[9px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">Default</span>}
                        </div>
                        <p className="text-xs text-white/70">{a.full_name} · {a.phone}</p>
                        <p className="text-xs text-white/40 truncate">{a.address}, {a.area}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="glow-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <User size={14} className="text-mia-orange" /> Customer Information
              </h3>
              <div className="relative">
                <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input type="text" placeholder="Full Name *" value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  className={`${inputClass} pl-10`} />
              </div>
              <div className="relative">
                <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                <input type="tel" placeholder="Phone Number *" value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className={`${inputClass} pl-10`} />
              </div>
            </div>

            <div className="glow-card p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <MapPin size={14} className="text-mia-blue" /> Shipping Address
              </h3>
              <textarea placeholder="Full Address * (House, Road, Area)" value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                rows={2} className={`${inputClass} resize-none`} />
              <div>
                <p className="text-[11px] text-white/40 mb-2 font-medium">Delivery Area *</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(DELIVERY_AREAS).map(([area, charge]) => (
                    <button key={area} type="button" onClick={() => setForm(f => ({ ...f, area }))}
                      className="px-3 py-2 rounded-xl text-xs font-medium transition-all text-left"
                      style={form.area === area
                        ? { background: 'rgba(0,209,255,0.1)', border: '1px solid rgba(0,209,255,0.3)', color: '#00D1FF' }
                        : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                      <p className="font-semibold">{area}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">
                        {subtotal >= appConfig.delivery.freeDeliveryThreshold ? 'Free' : `৳${charge}`}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
              <input type="text" placeholder="City" value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className={inputClass} />
              <textarea placeholder="Delivery Notes (optional)" value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} className={`${inputClass} resize-none`} />
            </div>

            <div className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: 'rgba(0,209,255,0.04)', border: '1px solid rgba(0,209,255,0.1)' }}>
              <div className="flex items-center gap-2">
                <MapPin size={13} className="text-mia-blue" />
                <span className="text-xs text-white/60">Delivery to {form.area}</span>
              </div>
              <span className="text-sm font-bold" style={{ color: deliveryCharge === 0 ? '#22c55e' : '#00D1FF' }}>
                {deliveryCharge === 0 ? 'Free' : `৳${deliveryCharge}`}
              </span>
            </div>

            <button onClick={() => setStep('payment')} disabled={!isFormValid}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
              Continue to Payment
            </button>
          </>
        )}

        {/* ── STEP 2: Review & Pay ── */}
        {step === 'payment' && (
          <>
            {/* Delivery summary */}
            <div className="glow-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] text-white/35 mb-1 uppercase tracking-wider font-medium">Delivering to</p>
                  <p className="text-sm font-semibold text-white">{form.full_name}</p>
                  <p className="text-xs text-white/50 mt-0.5">{form.phone}</p>
                  <p className="text-xs text-white/40 mt-0.5">{form.address}, {form.area}</p>
                </div>
                <button onClick={() => setStep('info')} className="text-xs text-mia-orange hover:underline shrink-0">Change</button>
              </div>
            </div>

            {/* Payment Method */}
            <div className="glow-card p-4">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldCheck size={14} className="text-mia-pink" /> Payment Method
              </h3>
              <div className="space-y-2">
                {PAYMENT_METHODS.map(pm => {
                  const Icon = pm.icon;
                  const isSelected = paymentMethod === pm.id;
                  return (
                    <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                      className="w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200"
                      style={isSelected
                        ? { background: `${pm.color}0E`, border: `1.5px solid ${pm.color}40` }
                        : { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${pm.color}12`, border: `1px solid ${pm.color}20` }}>
                        <Icon size={18} style={{ color: pm.color }} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">{pm.label}</p>
                          {pm.badge && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                              style={{ background: `${pm.color}15`, color: pm.color, border: `1px solid ${pm.color}25` }}>
                              {pm.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-white/35">{pm.sub}</p>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                        style={isSelected
                          ? { borderColor: pm.color, background: pm.color }
                          : { borderColor: 'rgba(255,255,255,0.2)' }}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected payment info */}
              {(paymentMethod === 'stripe') && (
                <div className="mt-3 px-4 py-3 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(103,114,229,0.06)', border: '1px solid rgba(103,114,229,0.15)' }}>
                  <Lock size={12} className="text-[#6772E5] shrink-0" />
                  <p className="text-[11px] text-white/50">You'll enter your card details on the next screen — secured by Stripe.</p>
                </div>
              )}
              {(paymentMethod === 'sslcommerz') && (
                <div className="mt-3 px-4 py-3 rounded-xl flex items-center gap-2"
                  style={{ background: 'rgba(0,174,239,0.06)', border: '1px solid rgba(0,174,239,0.15)' }}>
                  <Zap size={12} className="text-[#00AEEF] shrink-0" />
                  <p className="text-[11px] text-white/50">You'll be redirected to SSLCommerz's secure payment gateway.</p>
                </div>
              )}
              {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                <div className="mt-3 px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    After placing the order, you'll be shown the merchant number and can submit your transaction ID for verification.
                  </p>
                </div>
              )}
            </div>

            {/* Coupon */}
            <div className="glow-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Tag size={14} className="text-mia-purple" /> Coupon Code
              </h3>
              {couponApplied ? (
                <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-green-400" />
                    <div>
                      <p className="text-sm font-semibold text-green-400">{couponApplied.code}</p>
                      <p className="text-xs text-green-400/60">Saved ৳{couponApplied.discount}</p>
                    </div>
                  </div>
                  <button onClick={removeCoupon} className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                    <X size={13} className="text-white/50" />
                  </button>
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
                      {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-400">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="glow-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Order Summary</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {state.cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-2.5">
                    <img src={item.product.image} alt={item.product.name} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 truncate">{item.product.name}</p>
                      <p className="text-[10px] text-white/35">×{item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold text-white/80">৳{(item.product.discount_price || item.product.price) * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 mt-3 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white">৳{subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Delivery ({form.area})</span>
                  <span className={deliveryCharge === 0 ? 'text-green-400' : 'text-white'}>
                    {deliveryCharge === 0 ? 'Free' : `৳${deliveryCharge}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-400">Coupon ({couponApplied?.code})</span>
                    <span className="text-green-400">-৳{discount}</span>
                  </div>
                )}
                <div className="border-t border-white/5 pt-2 flex justify-between">
                  <span className="text-sm font-bold text-white">Total</span>
                  <span className="text-xl font-bold text-mia-orange">৳{total}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {step === 'payment' && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 pb-2 z-20">
          <div className="max-w-lg md:max-w-2xl mx-auto">
            <button onClick={handlePlaceOrder} disabled={submitting}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 8px 32px rgba(255,138,0,0.3)' }}>
              {submitting
                ? <><Loader2 size={16} className="animate-spin" /> Processing...</>
                : paymentMethod === 'stripe'
                  ? <><Lock size={14} /> Pay Securely — ৳{total}</>
                  : paymentMethod === 'sslcommerz'
                    ? <><Zap size={14} /> Pay via SSLCommerz — ৳{total}</>
                    : `Place Order — ৳{total}`}
            </button>
            <p className="text-center text-[10px] text-white/20 mt-1.5 flex items-center justify-center gap-1">
              <Lock size={9} /> 256-bit SSL encrypted
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
