import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from '../lib/router';
import { appConfig } from '../lib/config';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deviceStatus, setDeviceStatus] = useState<'checked' | 'pending'>('checked');
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ১. ফায়ারবেস অথেনটিকেশন দিয়ে সাধারণ লগইন চেষ্টা
      const { user: authUser, error: err } = await signIn(email, password);

      if (err) {
        setError(err);
        setLoading(false);
        return;
      }

      if (authUser) {
        // ২. ইউজারটি আমাদের অ্যাডমিন ডাটাবেজে আছে কিনা চেক করা
        const adminDocRef = doc(db, 'admins', authUser.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (adminDoc.exists() && adminDoc.data().role === 'admin') {
          const localToken = localStorage.getItem('ovi_device_token');

          // ৩. যদি ওভি ভাইয়ের অনুমোদিত ডিভাইস চাবি থাকে, তবে ডাইরেক্ট লগইন
          if (localToken === 'my_secret_macbook_2026') {
            setLoading(false);
            navigate('/');
            return;
          }

          // ৪. লোকাল চাবি না থাকলে ব্রাউজারের একটি ইউনিক ফিঙ্গারপ্রিন্ট আইডি তৈরি/রিড করবে
          let browserFingerprint = localStorage.getItem('browser_fingerprint_id');
          if (!browserFingerprint) {
            browserFingerprint = 'device_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('browser_fingerprint_id', browserFingerprint);
          }

          const deviceDocRef = doc(db, 'approved_devices', browserFingerprint);
          const deviceDoc = await getDoc(deviceDocRef);

          if (deviceDoc.exists()) {
            const deviceData = deviceDoc.data();
            if (deviceData.status === 'approved') {
              // ডিভাইসটি ফায়ারবেসে অ্যাপ্রুভড হলে লোকাল চাবিটি সেভ হবে এবং ড্যাশবোর্ডে ঢুকতে দেবে
              localStorage.setItem('ovi_device_token', 'my_secret_macbook_2026');
              navigate('/');
            } else {
              setDeviceStatus('pending');
              setError('আপনার ডিভাইসটি অনুমোদনের অপেক্ষায় আছে।');
            }
          } else {
            // ৫. ডাটাবেজে এই ডিভাইস না থাকলে অটোমেটিক একটি পেন্ডিং রিকোয়েস্ট জেনারেট হবে
            await setDoc(deviceDocRef, {
              device_id: browserFingerprint,
              status: 'pending',
              owner: 'Unknown Device',
              requested_at: new Date().toISOString(),
              email: email
            });
            setDeviceStatus('pending');
            setError('নতুন ডিভাইস সনাক্ত হয়েছে! অনুমতির রিকোয়েস্ট ডাটাবেজে পাঠানো হয়েছে।');
          }
        } else {
          // অ্যাডমিন না হলে সাধারণ কাস্টমার হিসেবে ঢুকিয়ে দেবে
          navigate('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'লগইন করতে সমস্যা হচ্ছে।');
    } finally {
      setLoading(false);
    }
  };

  // 🔒 ডিভাইস অনুমোদনের জন্য পেন্ডিং লক স্ক্রিন
  if (deviceStatus === 'pending') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 page-transition" style={{ background: "var(--bg-base)" }}>
        <div className="relative w-full max-w-sm text-center bg-white/[0.02] border border-white/8 p-8 rounded-3xl shadow-2xl">
          <div className="relative inline-block w-16 h-16 mb-4 animate-pulse">
            <Lock size={48} className="mx-auto text-mia-orange mt-2" style={{ color: '#FF8A00' }} />
          </div>
          <h2 className="text-xl font-extrabold text-white mb-3">ডিভাইস অনুমোদন প্রয়োজন</h2>
          <p className="text-sm text-white/60 mb-6 leading-relaxed">
            নিরাপত্তার স্বার্থে এই ডিভাইস থেকে লগইন লক করা হয়েছে। আপনার ফায়ারবেস ডাটাবেজের <span className="text-mia-orange font-semibold">"approved_devices"</span> কালেকশনে একটি অনুমতি রিকোয়েস্ট পাঠানো হয়েছে।
          </p>
          <div className="bg-white/[0.03] border border-white/5 p-3 rounded-xl mb-6 text-xs font-mono text-white/50 break-all">
            ID: {localStorage.getItem('browser_fingerprint_id')}
          </div>
          <p className="text-xs text-white/30 mb-6">
            অ্যাডমিন ফায়ারবেসে স্ট্যাটাস "approved" করার পর নিচের বাটনে ক্লিক করুন।
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
          >
            পুনরায় চেষ্টা করুন (Refresh)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 page-transition" style={{ background: "var(--bg-base)" }}>
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #FF8A00, transparent)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #00D1FF, transparent)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative inline-block w-16 h-16 mb-4">
            <img src={appConfig.logo} alt="MIA ONE" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold neon-text">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-white/40 mt-2">{t('auth.signInToAccount')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-sm text-red-300 border border-red-500/20"
              style={{ background: 'rgba(239,68,68,0.05)' }}>
              {error}
            </div>
          )}

          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('auth.emailAddress')}
              required
              className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/8 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40 transition-all"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('auth.password')}
              required
              className="w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/8 rounded-2xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-mia-orange/40 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={() => navigate('/forgot-password')}
              className="text-xs text-mia-orange hover:underline">
              {t('auth.forgotPassword')}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}
          >
            {loading ? t('auth.signingIn') : <>{t('auth.signIn')} <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          {t('auth.noAccount')}{' '}
          <button onClick={() => navigate('/signup')} className="text-mia-orange font-medium hover:underline">
            {t('auth.signUp')}
          </button>
        </p>
      </div>
    </div>
  );
}