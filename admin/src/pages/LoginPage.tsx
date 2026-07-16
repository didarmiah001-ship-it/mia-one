import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { generateOtp, sendOtpEmail, setOtpVerified, setOtpPending, clearOtpState } from '../lib/otp';
import { ShieldCheck, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';

type Stage = 'credentials' | 'otp' | 'finalizing';

export function LoginPage() {
  const { verifyCredentials, finalizeSignIn } = useAuth();
  const navigate = useNavigate();

  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (stage === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [stage]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    setError(null);

    const { error: verifyError } = await verifyCredentials(email.trim(), password);
    if (verifyError) {
      setSubmitting(false);
      setError(verifyError);
      return;
    }

    const newOtp = generateOtp();
    setGeneratedOtp(newOtp);

    try {
      await sendOtpEmail(newOtp);
      setOtpPending();
      setStage('otp');
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP email. Please try again.');
    }
    setSubmitting(false);
  };

  const handleResendOtp = useCallback(async () => {
    if (resendCooldown > 0) return;
    setError(null);
    const newOtp = generateOtp();
    setGeneratedOtp(newOtp);
    try {
      await sendOtpEmail(newOtp);
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    }
  }, [resendCooldown]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setSubmitting(true);
    setError(null);

    if (otp !== generatedOtp) {
      setSubmitting(false);
      setError('Incorrect verification code. Please try again.');
      setOtp('');
      return;
    }

    setStage('finalizing');
    const { error: signInError } = await finalizeSignIn(email.trim(), password);
    if (signInError) {
      setSubmitting(false);
      setError(signInError);
      setStage('otp');
      return;
    }

    setOtpVerified();
    navigate('/admin/dashboard');
  };

  const handleBackToCredentials = () => {
    clearOtpState();
    setStage('credentials');
    setOtp('');
    setGeneratedOtp('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-3"
            style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 0 24px rgba(255,138,0,0.35)' }}
          >
            M
          </div>
          <h1 className="text-xl font-bold text-white">MIA Admin Panel</h1>
          <p className="text-sm text-white/30 mt-1">
            {stage === 'credentials' && 'Sign in to manage your store'}
            {stage === 'otp' && 'Enter the verification code sent to your email'}
            {stage === 'finalizing' && 'Verifying access…'}
          </p>
        </div>

        {stage === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl text-xs text-red-300"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={submitting}
                placeholder="admin@example.com"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-mia-orange/40 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-mia-orange/40 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 4px 12px rgba(255,138,0,0.3)' }}
            >
              {submitting ? 'Verifying credentials…' : 'Continue'}
            </button>
          </form>
        )}

        {(stage === 'otp' || stage === 'finalizing') && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl text-xs text-red-300"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}

            <div className="flex flex-col items-center gap-3 py-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.2)' }}
              >
                <ShieldCheck size={24} className="text-mia-orange" />
              </div>
              <p className="text-xs text-white/40 text-center max-w-xs">
                A 6-digit verification code has been sent to <span className="text-white/60 font-medium">miaonebd@gmail.com</span>. Enter it below to complete sign-in.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 text-center">Verification Code</label>
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                disabled={submitting}
                placeholder="000000"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-white text-center tracking-[0.5em] font-mono text-lg placeholder:text-white/20 focus:outline-none focus:border-mia-orange/40 transition-colors disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || otp.length !== 6}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', boxShadow: '0 4px 12px rgba(255,138,0,0.3)' }}
            >
              {stage === 'finalizing' ? 'Verifying…' : 'Verify & Sign In'}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToCredentials}
                disabled={submitting}
                className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors"
              >
                <ArrowLeft size={12} /> Back
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={submitting || resendCooldown > 0}
                className="text-xs text-white/30 hover:text-white/60 transition-colors disabled:opacity-40"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
