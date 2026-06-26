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

export function TermsPage() {
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
          <h1 className="text-lg font-bold text-white">Terms &amp; Conditions</h1>
        </div>
      </header>

      <div className="max-w-lg md:max-w-2xl mx-auto px-4 mt-6 space-y-6">
        <div className="glow-card p-4">
          <p className="text-[11px] text-white/30">Last updated: {LAST_UPDATED}</p>
          <p className="text-xs text-white/50 mt-2 leading-relaxed">
            Please read these Terms &amp; Conditions carefully before using {appConfig.name}.
            By accessing or using our service, you agree to be bound by these terms.
          </p>
        </div>

        <div className="space-y-5">
          <Section title="1. Acceptance of Terms">
            <p>By creating an account or placing an order on {appConfig.name}, you confirm that you are at least 18 years of age
            and agree to these Terms &amp; Conditions and our Privacy Policy.</p>
          </Section>

          <Section title="2. Account Registration">
            <p>You are responsible for maintaining the confidentiality of your account credentials.
            You agree to provide accurate, current, and complete information during registration
            and to update it as necessary. You are responsible for all activities that occur under your account.</p>
          </Section>

          <Section title="3. Orders & Payments">
            <p>All orders are subject to product availability and confirmation of the order price.
            We reserve the right to refuse or cancel orders at any time, including after order confirmation,
            if we detect pricing errors, fraud, or insufficient stock.</p>
            <p>Payment must be made at the time of ordering (or upon delivery for COD orders).
            All prices are listed in Bangladeshi Taka (৳) and include applicable taxes.</p>
          </Section>

          <Section title="4. Delivery">
            <p>We aim to deliver within {appConfig.delivery.estimatedDays}. Delivery times are estimates
            and may be affected by weather, holidays, or other factors beyond our control.
            Free delivery applies on orders above {appConfig.delivery.currency}{appConfig.delivery.freeDeliveryThreshold}.</p>
          </Section>

          <Section title="5. Returns & Refunds">
            <p>Please refer to our Refund Policy for detailed information about returns, exchanges, and refunds.
            In general, eligible items may be returned within 7 days of delivery in their original condition and packaging.</p>
          </Section>

          <Section title="6. Prohibited Activities">
            <p>You agree not to: use the service for any unlawful purpose, engage in fraudulent transactions,
            attempt to gain unauthorized access to our systems, resell products for commercial purposes without our consent,
            or post false, misleading, or defamatory reviews.</p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>All content on {appConfig.name}, including logos, text, graphics, and software, is owned by or licensed to us.
            You may not reproduce, distribute, or create derivative works without our written permission.</p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>To the maximum extent permitted by law, {appConfig.name} shall not be liable for any indirect, incidental,
            special, or consequential damages arising from your use of the service, even if we have been advised
            of the possibility of such damages.</p>
          </Section>

          <Section title="9. Governing Law">
            <p>These Terms are governed by and construed in accordance with the laws of Bangladesh.
            Any disputes shall be subject to the exclusive jurisdiction of the courts of Dhaka, Bangladesh.</p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>We reserve the right to modify these Terms at any time. We will notify you of material changes
            via the app. Continued use after changes constitutes acceptance of the new Terms.</p>
          </Section>

          <Section title="11. Contact">
            <p>For questions about these Terms, contact us at:</p>
            <p className="text-white/70">{appConfig.support.email}</p>
          </Section>
        </div>
      </div>
    </div>
  );
}
