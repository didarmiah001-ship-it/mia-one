import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY || 'private_uJtmmkoZcbGmdcEXYqb/gAR0aVo=';
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY || 'public_yEPy2DHHPu/KY2jJ3R5GIjfbkZc=';

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 2400; // ৪০ মিনিট মেয়াদ

  // ইমেজকিটের অফিশিয়াল SHA-1 HMAC সিগনেচার মেথড
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  // CORS সেটিংস যাতে ফ্রন্টঅ্যান্ড কোড এটিকে ব্লক না করে
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    token,
    expire,
    signature,
    publicKey
  });
}
