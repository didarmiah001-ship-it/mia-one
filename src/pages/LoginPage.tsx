import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from '../lib/router';
import { appConfig } from '../lib/config';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // সিকিউরিটি লকের জন্য স্টেটসমূহ
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [deviceStatus, setDeviceStatus] = useState<'pending' | 'rejected' | 'approved'>('pending');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { signIn } = useAuth();
  const navigate = useNavigate();

  // ১. ব্রাউজারের ইউনিক ডিভাইস আইডি জেনারেট বা রিড করার ফাংশন
  const getOrCreateDeviceId = () => {
    let id = localStorage.getItem('mia_admin_device_id');
    if (!id) {
      id = 'device_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('mia_admin_device_id', id);
    }
    return id;
  };

  // ২. ডিভাইস স্ট্যাটাস রিয়েলটাইম ট্র্যাক করার জন্য লিসেনার
  useEffect(() => {
    if (!currentUser || !deviceId) return;

    const deviceDocRef = doc(db, 'approved_devices', deviceId);
    
    // ফায়ারবেস থেকে রিয়েলটাইম লাইভ ট্র্যাকিং
    const unsubscribe = onSnapshot(deviceDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDeviceStatus(data.status);
        if (data.status === 'approved') {
          setShowLockScreen(false);
          navigate('/'); // অনুমোদন পাওয়ার সাথে সাথে ড্যাশবোর্ড ওপেন হবে
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser, deviceId, navigate]);

  // ৩. ডিভাইস ডাটাবেজে রেজিস্টার করার ফাংশন
  const registerDeviceInFirestore = async (user: any, currentDeviceId: string) => {
    const deviceDocRef = doc(db, 'approved_devices', currentDeviceId);
    const deviceSnap = await getDoc(deviceDocRef);

    if (!deviceSnap.exists()) {
      // নতুন ডিভাইস হলে 'pending' হিসেবে রেজিস্টার হবে
      await setDoc(deviceDocRef, {
        deviceId: currentDeviceId,
        requestedBy: user.email,
        uid: user.uid,
        status: 'pending',
        createdAt: new Date().toISOString(),
        deviceName: navigator.userAgent.includes('Android') ? 'Android Mobile' : 'Web Browser'
      });
      setDeviceStatus('pending');
    } else {
      setDeviceStatus(deviceSnap.data().status);
    }
  };

  // ৪. ফর্ম সাবমিট ও লগইন প্রসেস
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: err } = await signIn(email, password);
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    if (data?.user) {
      const user = data.user;
      setCurrentUser(user);

      try {
        // ফায়ারবেসে এই ইউজারটি অ্যাডমিন কি না চেক করা হচ্ছে
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminSnap = await getDoc(adminDocRef);

        if (adminSnap.exists() && adminSnap.data().role === 'admin') {
          // অ্যাডমিন হলে ডিভাইস আইডি রিড করে চেক করা হবে
          const currentDeviceId = getOrCreateDeviceId();
          setDeviceId(currentDeviceId);

          const deviceDocRef = doc(db, 'approved_devices', currentDeviceId);
          const deviceSnap = await getDoc(deviceDocRef);

          if (deviceSnap.exists() && deviceSnap.data().status === 'approved') {
            // যদি আগে থেকেই অনুমোদিত থাকে, সরাসরি হোম পেজে যাবে
            navigate('/');
          } else {
            // অন্যথায় লক স্ক্রিন ঝুলিয়ে দেওয়া হবে এবং ডিভাইস ফায়ারবেসে পেন্ডিং লিস্টে ঢুকবে
            await registerDeviceInFirestore(user, currentDeviceId);
            setShowLockScreen(true);
          }
        } else {
          // কাস্টমার হলে কোনো বাধা ছাড়াই সরাসরি রিডাইরেক্ট হবে
          navigate('/');
        }
      } catch (firestoreErr) {
        console.error("Security Check Failed:", firestoreErr);
        // ফায়ারবেস কানেকশন ফেইল করলে সেফটির জন্য ড্যাশবোর্ডে ঢুকতে বাধা দেওয়া হবে
        setError("Security verification failed. Connection lost.");
      }
    }
  };

  // ৫. লক স্ক্রিন ভিউ (যদি লক অ্যাক্টিভ থাকে)
  if (showLockScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
        <div className="relative w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-md">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-amber-500 animate-pulse" size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">ডিভাইস অনুমোদন প্রয়োজন</h2>
          <p className="text-sm text-white/60 mb-6">
            আপনার ডিভাইসটি অ্যাডমিন প্যানেলে অ্যাক্সেস করার জন্য অনুমোদিত নয়। দয়া করে প্রধান অ্যাডমিনের কাছ থেকে অনুমোদন নিন।
          </p>

          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 mb-6 text-left">
            <div className="text-xs text-white/30 mb-1">আপনার ইউনিক ডিভাইস আইডি:</div>
            <code className="text-xs text-amber-400 break-all select-all font-mono bg-black/30 p-2 rounded block">
              {deviceId}
            </code>
            <div className="text-xs text-white/30 mt-3">স্ট্যাটাস:</div>
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full mt-1 bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {deviceStatus === 'pending' ? 'অনুমোদনের অপেক্ষায় (Pending)' : 'প্রত্যাখ্যাত (Rejected)'}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> পুনরায় চেষ্টা করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ৬. নরমাল লগইন স্ক্রিন ভিউ
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
