import { ArrowLeft, CheckCircle, XCircle, AlertCircle, MessageCircle } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { appConfig } from '../lib/config';

const LAST_UPDATED = 'June 26, 2026';

export function RefundPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="page-transition pb-28">
      <header className="sticky top-0 z-30 glass px-4 py-3">
        <div className="max-w-lg md:max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <ArrowLeft size={16} className="text-white/60" />
          </button>
          <h1 className="text-lg font-bold text-white">Refund Policy</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <div className="glow-card p-4">
          <p className="text-[11px] text-white/30">Last updated: {LAST_UPDATED}</p>
          <p className="text-xs text-white/50 mt-2 leading-relaxed">
            We want you to be completely satisfied with your purchase. If you're not,
            our straightforward return and refund policy is here to help.
          </p>
        </div>

        {/* Quick summary cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: CheckCircle, color: '#22C55E', label: '7-Day Returns' },
            { icon: AlertCircle, color: '#FF8A00', label: 'Original Condition' },
            { icon: CheckCircle, color: '#00D1FF', label: 'Fast Refunds' },
          ].map(item => (
            <div key={item.label} className="glow-card p-3 text-center">
              <item.icon size={20} style={{ color: item.color }} className="mx-auto mb-2" />
              <p className="text-[11px] text-white/60 font-medium leading-tight">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div>
            <h2 className="text-sm font-bold text-white mb-3">What Can Be Returned</h2>
            <div className="space-y-2">
              {[
                { ok: true, text: 'Items received damaged or defective' },
                { ok: true, text: 'Items that differ from product description' },
                { ok: true, text: 'Wrong item delivered' },
                { ok: true, text: 'Unopened items in original packaging within 7 days' },
                { ok: false, text: 'Used, opened, or damaged by customer' },
                { ok: false, text: 'Perishable or consumable products' },
                { ok: false, text: 'Intimate apparel and personal care items' },
                { ok: false, text: 'Items returned after 7 days' },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: item.ok ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)', border: `1px solid ${item.ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}` }}>
                  {item.ok
                    ? <CheckCircle size={14} className="text-green-400 shrink-0 mt-0.5" />
                    : <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />}
                  <span className="text-xs text-white/60 leading-relaxed">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white mb-3">Return Process</h2>
            <div className="space-y-3">
              {[
                { step: '01', title: 'Contact Support', desc: 'Reach us via WhatsApp or email within 7 days of delivery with your order number and reason.' },
                { step: '02', title: 'Approval', desc: 'Our team reviews your request and sends return instructions within 24 hours.' },
                { step: '03', title: 'Ship the Item', desc: 'Pack the item securely and hand it to our delivery agent or ship to our address.' },
                { step: '04', title: 'Refund Processed', desc: 'Once we receive and inspect the item, your refund is processed within 3–5 business days.' },
              ].map(item => (
                <div key={item.step} className="flex gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="text-lg font-black leading-none shrink-0"
                    style={{ background: 'linear-gradient(135deg, #FF8A00, #FF2EC9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white/80 mb-0.5">{item.title}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white mb-2">Refund Timeline</h2>
            <div className="space-y-2 text-xs text-white/50 leading-relaxed">
              <p>• <strong className="text-white/70">Online payments (Card/bKash/Nagad):</strong> 3–5 business days to original payment method</p>
              <p>• <strong className="text-white/70">Cash on Delivery (COD):</strong> Credited as store credit or bank transfer within 5–7 business days</p>
              <p>• <strong className="text-white/70">Partial refunds:</strong> May apply for items with signs of use or missing accessories</p>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-white mb-2">Order Cancellation</h2>
            <div className="text-xs text-white/50 leading-relaxed space-y-2">
              <p>You may cancel an order free of charge before it is dispatched.
              Once dispatched, the order cannot be cancelled but may be returned after delivery.</p>
              <p>To cancel, go to <strong className="text-white/70">Orders</strong> in the app and tap <strong className="text-white/70">Cancel Order</strong>,
              or contact our support team immediately.</p>
            </div>
          </div>

          {/* CTA */}
          <a
            href={appConfig.support.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, rgba(37,211,102,0.15), rgba(37,211,102,0.08))', border: '1px solid rgba(37,211,102,0.2)' }}
          >
            <MessageCircle size={15} style={{ color: '#25D366' }} />
            <span style={{ color: '#25D366' }}>Start a Return via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
