import { useState, useEffect } from 'react';
import { ArrowLeft, Tag, Copy, CheckCircle2, Clock, Loader2, Ticket } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { useAuth } from '../lib/auth';
import { fetchUserCoupons } from '../lib/api';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const expiresText = coupon.expires_at
    ? `Expires ${new Date(coupon.expires_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'No expiry';

  const daysLeft = coupon.expires_at
    ? Math.ceil((new Date(coupon.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const isExpiringSoon = daysLeft !== null && daysLeft <= 7;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(coupon.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="glow-card overflow-hidden"
      style={{ border: isExpiringSoon ? '1px solid rgba(239,68,68,0.2)' : undefined }}>
      {/* Coupon top band */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, rgba(255,138,0,0.06), rgba(255,46,201,0.04))' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,138,0,0.12)', border: '1px solid rgba(255,138,0,0.2)' }}>
            <Tag size={18} className="text-mia-orange" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `৳${coupon.value} OFF`}
            </p>
            {coupon.min_order && coupon.min_order > 0 ? (
              <p className="text-[11px] text-white/40">Min. order ৳{coupon.min_order}</p>
            ) : (
              <p className="text-[11px] text-white/40">No minimum order</p>
            )}
          </div>
        </div>

        {isExpiringSoon && daysLeft !== null && (
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <Clock size={10} className="text-red-400" />
            <span className="text-[10px] text-red-400 font-semibold">
              {daysLeft === 0 ? 'Expires today' : `${daysLeft}d left`}
            </span>
          </div>
        )}
      </div>

      {/* Dashed divider */}
      <div className="flex items-center px-4 my-0"
        style={{ borderTop: '1px dashed rgba(255,255,255,0.07)' }}>
        <div className="w-3 h-3 rounded-full -ml-6 shrink-0" style={{ background: '#0D1117' }} />
        <div className="flex-1" />
        <div className="w-3 h-3 rounded-full -mr-6 shrink-0" style={{ background: '#0D1117' }} />
      </div>

      {/* Code + copy */}
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-white/30 font-medium mb-1 uppercase tracking-wider">Coupon Code</p>
          <div className="flex items-center gap-2">
            <span
              className="text-base font-mono font-bold tracking-widest text-mia-orange px-3 py-1.5 rounded-xl"
              style={{ background: 'rgba(255,138,0,0.08)', border: '1px dashed rgba(255,138,0,0.3)', letterSpacing: '0.12em' }}>
              {coupon.code}
            </span>
            <button
              onClick={handleCopy}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: copied ? 'rgba(34,197,94,0.1)' : 'rgba(255,138,0,0.08)', border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,138,0,0.15)' }}>
              {copied
                ? <CheckCircle2 size={14} className="text-green-400" />
                : <Copy size={14} className="text-mia-orange" />}
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white glow-btn"
          style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)' }}>
          Use Now
        </button>
      </div>

      {/* Footer */}
      <div
        className="px-5 py-2.5 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-center gap-1.5">
          <Clock size={10} className="text-white/25" />
          <span className="text-[10px] text-white/30">{expiresText}</span>
        </div>
        {coupon.max_uses && (
          <span className="text-[10px] text-white/25">
            {coupon.used_count}/{coupon.max_uses} used
          </span>
        )}
      </div>
    </div>
  );
}

export function CouponsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const data = await fetchUserCoupons();
    setCoupons(data as Coupon[]);
    setLoading(false);
  };

  return (
    <div className="page-transition pb-28">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">My Coupons</h1>
            {!loading && <p className="text-[10px] text-white/30">{coupons.length} available</p>}
          </div>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-green-400 animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center float-premium"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
              <Ticket size={26} className="text-green-400/50" />
            </div>
            <p className="text-sm text-white/40 text-center">No coupons available right now</p>
            <p className="text-xs text-white/25 text-center max-w-[220px]">
              Check back later for exclusive offers and discounts
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map(coupon => (
              <CouponCard key={coupon.id} coupon={coupon} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
