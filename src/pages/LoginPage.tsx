import { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from '../lib/router';
import { appConfig } from '../lib/config';
import { useTranslation } from 'react-i18next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import emailjs from '@emailjs/browser';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';

const ADMIN_OTP_EMAIL = 'miaonebd@gmail.com'; // ওটিপি রিসিভার জিমেইল

export function LoginPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP স্টেটসমূহ
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtpInput, setUserOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const { signIn } = useAuth();
  const navigate = useNavigate();

  // 🔒 ওভি ভাই, এই পেজটি লোড হওয়া মাত্রই আগের সব পুরোনো অবাধ্য সেশন আমরা জোর করে ডিলিট করে দেবো
  useEffect(() => {
    signOut(auth).catch(err => console.error(err));
    sessionStorage.removeItem('admin_otp_verified');
  }, []);

  // EmailJS দিয়ে ওটিপি পাঠানোর ফাংশন
  const sendOtpEmail = async (otp: string, loginEmail: string) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      console.error("EmailJS environment variables are missing!");
      return false;
    }

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          email: ADMIN_OTP_EMAIL,
          admin_user: loginEmail,
          passcode: otp,
        },
        publicKey
      );
      return true;
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      return false;
    }
  };

  // ফর্ম সাবমিট ও লগইন প্রসেস
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ১. ডাটাবেজে ওটিপি পাঠানোর আগে আমরা ফায়ারবেসের অফিশিয়াল সেশন এড়িয়ে শুধু চেক করব ইউজার অ্যাডমিন কি না
      const adminQuery = query(
        collection(db, 'admins'),
        where('email', '==', email.trim().toLowerCase()),
        where('role', '==', 'admin')
      );
      const adminSnap = await getDocs(adminQuery);

      if (!adminSnap.empty) {
        const adminData = adminSnap.docs[0].data();

        if (adminData.is_allowed_to_login === true) {
          // ২. অ্যাডমিন ভেরিফাইড! এবার ওটিপি কোড জেনারেট করে মেইলে পাঠানো হবে
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          setGeneratedOtp(otp);

          const emailSent = await sendOtpEmail(otp, email);
          setLoading(false);

          if (emailSent) {
            setShowOtpScreen(true);
          } else {
            setError("ওটিপি কোড ইমেইলে পাঠাতে ব্যর্থ হয়েছে।");
          }
        } else {
          setError("আপনার অ্যাকাউন্ট থেকে লগইন করার অনুমতি নেই।");
          setLoading(false);
        }
      } else {
        // অ্যাডমিন না হলে সাধারণ কাস্টমার হিসেবে সরাসরি মেইন অ্যাপে সাইন-ইন করে হোমপেজে চলে যাবে
        const { error: signInErr } = await signIn(email, password);
        setLoading(false);
        if (signInErr) {
          setError('ভুল ইমেইল অথবা পাসওয়ার্ড!');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error(err);
      setError('লগইন প্রসেসে সমস্যা হয়েছে। নেটওয়ার্ক চেক করুন।');
      setLoading(false);
    }
  };

  // ওটিপি ভেরিফাই হওয়ার ফাংশন
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setLoading(true);

    if (userOtpInput === generatedOtp) {
      try {
        // ওটিপি মিললেই কেবল অফিশিয়াল ফায়ারবেস লগইন সেশন চালু করা হবে
        const { error: signInErr } = await signIn(email, password);
        setLoading(false);

        if (signInErr) {
          setOtpError('অথেনটিকেশন ফেইল হয়েছে! ভুল পাসওয়ার্ড বা ইমেইল হতে পারে।');
        } else {
          sessionStorage.setItem('admin_otp_verified', 'true');
          navigate('/admin/dashboard');
        }
      } catch (err) {
        setOtpError('লগইন প্রসেস সম্পন্ন করা যায়নি।');
        setLoading(false);
      }
    } else {
      setOtpError('ভুল ওটিপি কোড! অনুগ্রহ করে পুনরায় চেক করুন।');
      setLoading(false);
    }
  };

  // ওটিপি স্ক্রিন ভিউ
  if (showOtpScreen) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--bg-base)" }}>
        <div className="relative w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-8 text-center backdrop-blur-md">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="text-amber-500 animate-pulse" size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">অ্যাডমিন ওটিপি ভেরিফিকেশন</h2>
          <p className="text-sm text-white/60 mb-6">
            নিরাপত্তার জন্য আপনার রেজিস্টার্ড জিমেইল <strong>{ADMIN_OTP_EMAIL}</strong>-এ একটি ۶ ডিজিটের ওটিপি কোড পাঠানো হয়েছে।
          </p>

          <form onSubmit={handleVerifyOtp} className="space-y-4">
            {otpError && (
              <div className="p-3 rounded-xl text-sm text-red-300 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.05)' }}>
                {otpError}
              </div>
            )}

            <input
              type="text"
              maxLength={6}
              value={userOtpInput}
              onChange={e => setUserOtpInput(e.target.value.replace(/\D/g, ''))}
              placeholder="৬ ডিজিটের ওটিপি কোড লিখুন"
              required
              disabled={loading}
              className="w-full text-center tracking-[1em] pl-[1em] py-3.5 bg-white/[0.03] border border-white/8 rounded-2xl text-lg font-bold text-white focus:outline-none focus:border-mia-orange/40 transition-all"
            />

            <button type="submit" disabled={loading} className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
              {loading ? 'ভেরিফাই হচ্ছে...' : <>ভেরিফাই করুন <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // নরমাল লগইন স্ক্রিন ভিউ
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 page-transition" style={{ background: "var(--bg-base)" }}>
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="relative inline-block w-16 h-16 mb-4">
            <img src={appConfig.logo} alt="MIA ONE" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold neon-text">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-white/40 mt-2">{t('auth.signInToAccount')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-sm text-red-300 border border-red-500/20" style={{ background: 'rgba(239,68,68,0.05)' }}>
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
              className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/8 rounded-2xl text-sm text-white focus:outline-none focus:border-mia-orange/40 transition-all"
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
              className="w-full pl-11 pr-12 py-3.5 bg-white/[0.03] border border-white/8 rounded-2xl text-sm text-white focus:outline-none focus:border-mia-orange/40 transition-all"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs text-mia-orange hover:underline">
              {t('auth.forgotPassword')}
            </button>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white glow-btn flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
            {loading ? 'Processing...' : <>{t('auth.signIn')} <ArrowRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}
