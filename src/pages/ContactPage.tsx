import { ArrowLeft, MessageCircle, Mail, Phone, MapPin, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { appConfig } from '../lib/config';

const faqs = [
  { q: 'How do I track my order?', a: 'Go to Orders in the app to see real-time status updates for all your orders.' },
  { q: 'What is the return policy?', a: 'We accept returns within 7 days of delivery for eligible items in original condition.' },
  { q: 'How long does delivery take?', a: `We deliver within ${appConfig.delivery.estimatedDays}. Express delivery options may be available at checkout.` },
  { q: 'Is Cash on Delivery available?', a: 'Yes, Cash on Delivery (COD) is available for all orders within our delivery zones.' },
  { q: 'How do I apply a coupon?', a: 'Enter your coupon code at the checkout page in the promo code field before placing the order.' },
];

export function ContactPage() {
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
          <h1 className="text-lg font-bold text-white">Contact Us</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-6 space-y-6">

        {/* Hero */}
        <div className="glow-card p-5 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,138,0,0.15), rgba(255,46,201,0.08))', border: '1px solid rgba(255,138,0,0.2)' }}>
            <MessageCircle size={24} className="text-mia-orange" />
          </div>
          <h2 className="text-base font-bold text-white mb-1">We're here to help</h2>
          <p className="text-sm text-white/40 leading-relaxed">
            Our support team is available 7 days a week to assist you with any questions or concerns.
          </p>
        </div>

        {/* Contact options */}
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2 px-1">Get In Touch</p>

          <a
            href={appConfig.support.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.15)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.2)' }}>
              <MessageCircle size={18} style={{ color: '#25D366' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-semibold">WhatsApp Support</p>
              <p className="text-xs text-white/40 mt-0.5">Fastest response · Usually replies in minutes</p>
            </div>
            <ExternalLink size={14} className="text-white/20 shrink-0" />
          </a>

          <a
            href={`mailto:${appConfig.support.email}`}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,209,255,0.08)', border: '1px solid rgba(0,209,255,0.15)' }}>
              <Mail size={18} className="text-mia-blue" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-semibold">Email Support</p>
              <p className="text-xs text-white/40 mt-0.5">{appConfig.support.email}</p>
            </div>
            <ExternalLink size={14} className="text-white/20 shrink-0" />
          </a>
        </div>

        {/* Business hours */}
        <div className="glow-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-mia-orange" />
            <p className="text-sm font-semibold text-white">Business Hours</p>
          </div>
          <div className="space-y-2">
            {[
              { days: 'Saturday – Thursday', hours: '9:00 AM – 9:00 PM' },
              { days: 'Friday', hours: '2:00 PM – 9:00 PM' },
            ].map(row => (
              <div key={row.days} className="flex items-center justify-between">
                <span className="text-xs text-white/50">{row.days}</span>
                <span className="text-xs text-white/80 font-medium">{row.hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <p className="text-[10px] font-semibold text-white/25 uppercase tracking-widest mb-2 px-1">Frequently Asked Questions</p>
          <div className="space-y-1.5">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <summary className="flex items-center justify-between px-4 py-3.5 cursor-pointer list-none select-none">
                  <span className="text-sm text-white/80 font-medium pr-4">{faq.q}</span>
                  <ChevronRight size={14} className="text-white/25 shrink-0 transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-3.5">
                  <p className="text-xs text-white/40 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="glow-card p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)' }}>
              <MapPin size={15} className="text-mia-orange" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Our Office</p>
              <p className="text-xs text-white/40 leading-relaxed">
                MIA ONE Ltd.<br />
                Dhaka, Bangladesh
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
