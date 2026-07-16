import emailjs from '@emailjs/browser';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID ?? '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY ?? '';
const ADMIN_EMAIL = 'miaonebd@gmail.com';

const OTP_SESSION_KEY = 'admin_otp_verified';
const OTP_PENDING_KEY = 'admin_otp_pending';

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendOtpEmail(otp: string): Promise<void> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    throw new Error('EmailJS is not configured.');
  }

  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      to_email: ADMIN_EMAIL,
      email: ADMIN_EMAIL,
      to_name: 'MIA Admin',
      otp_code: otp,
      code: otp,
      otp: otp,
      subject: 'MIA Admin - OTP Verification Code',
      message: `Your MIA Admin verification code is: ${otp}. This code expires in 10 minutes.`,
    },
    { publicKey: EMAILJS_PUBLIC_KEY },
  );
}

export function setOtpVerified() {
  sessionStorage.setItem(OTP_SESSION_KEY, 'true');
  sessionStorage.removeItem(OTP_PENDING_KEY);
}

export function isOtpVerified(): boolean {
  return sessionStorage.getItem(OTP_SESSION_KEY) === 'true';
}

export function setOtpPending() {
  sessionStorage.setItem(OTP_PENDING_KEY, 'true');
}

export function isOtpPending(): boolean {
  return sessionStorage.getItem(OTP_PENDING_KEY) === 'true';
}

export function clearOtpState() {
  sessionStorage.removeItem(OTP_SESSION_KEY);
  sessionStorage.removeItem(OTP_PENDING_KEY);
}
