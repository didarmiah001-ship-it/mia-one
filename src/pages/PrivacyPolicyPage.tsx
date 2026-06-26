import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '../lib/router';
import { appConfig } from '../lib/config';

const LAST_UPDATED = 'June 26, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-bold text-white mb-2">{title}</h2>
      <div className="text-xs text-white/50 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export function PrivacyPolicyPage() {
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
          <h1 className="text-lg font-bold text-white">Privacy Policy</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <div className="glow-card p-4">
          <p className="text-[11px] text-white/30">Last updated: {LAST_UPDATED}</p>
          <p className="text-xs text-white/50 mt-2 leading-relaxed">
            {appConfig.name} ("we", "us", "our") respects your privacy and is committed to protecting your personal data.
            This Privacy Policy explains how we collect, use, store, and share information about you when you use our app.
          </p>
        </div>

        <div className="space-y-5">
          <Section title="1. Information We Collect">
            <p><strong className="text-white/70">Account Information:</strong> Name, email address, phone number, and profile photo when you register.</p>
            <p><strong className="text-white/70">Order Information:</strong> Delivery addresses, payment methods (tokenized), and purchase history.</p>
            <p><strong className="text-white/70">Device & Usage Data:</strong> Device type, OS version, app usage patterns, and crash reports to improve app performance.</p>
            <p><strong className="text-white/70">Location Data:</strong> Only with your permission, to suggest relevant delivery options.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>• Process and fulfill your orders, including delivery and payment</p>
            <p>• Send order confirmations, updates, and important notices</p>
            <p>• Personalize your shopping experience and product recommendations</p>
            <p>• Improve our app, detect fraud, and ensure security</p>
            <p>• Send promotional offers (you can opt out at any time in Settings)</p>
          </Section>

          <Section title="3. Information Sharing">
            <p>We do not sell your personal information. We share data only with:</p>
            <p>• <strong className="text-white/70">Delivery partners</strong> — only the information needed to complete your delivery</p>
            <p>• <strong className="text-white/70">Payment processors</strong> — for secure transaction processing</p>
            <p>• <strong className="text-white/70">Service providers</strong> — who assist in operating our platform under strict confidentiality</p>
            <p>• <strong className="text-white/70">Legal requirements</strong> — when required by law or to protect rights and safety</p>
          </Section>

          <Section title="4. Data Security">
            <p>We implement industry-standard security measures including encrypted data transmission (HTTPS/TLS),
            hashed passwords, and access controls. However, no method of transmission over the Internet is 100% secure.</p>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain your account data for as long as your account is active.
            Order records are retained for 7 years for legal and accounting purposes.
            You can request deletion of your account at any time from Settings.</p>
          </Section>

          <Section title="6. Your Rights">
            <p>You have the right to: access your personal data, correct inaccurate information,
            request deletion of your account, opt out of marketing communications,
            and lodge a complaint with a data protection authority.</p>
          </Section>

          <Section title="7. Cookies & Tracking">
            <p>We use essential cookies for app functionality and analytics cookies (anonymized)
            to understand usage patterns. We do not use third-party advertising trackers.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>Our service is not directed to children under 13. We do not knowingly collect
            personal information from children under 13.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this Privacy Policy periodically. We will notify you of significant changes
            via the app or email. Continued use of the app constitutes acceptance of the updated policy.</p>
          </Section>

          <Section title="10. Contact Us">
            <p>For privacy-related inquiries, please contact us at:</p>
            <p className="text-white/70">{appConfig.support.email}</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
