import type { Metadata } from 'next';
import { Eye, Database, Cookie, Globe, Trash2, Mail, ShieldAlert } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Understand how Indico collects, stores, processes, and protects your personal data under DPDPA and GDPR guidelines, including cookies, third-party integrations, and your deletion rights.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  const sections = [
    {
      id: 'data-collection',
      icon: <Database className="text-gradient" size={24} />,
      title: '1. What Data We Collect',
      content: 'We collect personal information that you provide directly to us (e.g., username, email address, profile picture, and optional bio), and UPI / financial transaction details if you set up monetization. We also automatically collect interaction data (such as watch time, likes, comments, shares, and search queries) and technical metadata (including IP addresses, device browser types, and system errors).',
      highlight: 'Key Data Categories: Account Info, User Content (Reels/Posts), Interactions, UPI/Payout Details, IP & Device Logs.'
    },
    {
      id: 'data-usage',
      icon: <Eye style={{ color: 'var(--accent-secondary, #a855f7)' }} size={24} />,
      title: '2. Why We Collect It',
      content: 'We process your data to deliver, optimize, and secure the Indico platform. This includes personalizing your feed based on engagement (watch time and completion rate rather than follower counts), enabling community subscriptions, facilitating coin purchases, detecting and preventing harmful or illegal activities, and compiling analytical reports to improve the platform experience.',
      highlight: 'Core Purpose: Providing high-fidelity media hosting, processing subscription payouts, and ensuring safety.'
    },
    {
      id: 'cookies-tracking',
      icon: <Cookie style={{ color: '#f59e0b' }} size={24} />,
      title: '3. Cookies & Local Storage',
      content: 'We use cookies, session storage, and browser local storage to maintain your authentication state, protect against CSRF attacks, and remember your interface preferences (e.g., sound toggles). Some third-party integrations, such as Cloudflare and Razorpay, may place necessary security cookies to authenticate transactions and guard against fraud.',
      highlight: 'Our cookies do not track you across unrelated external websites.'
    },
    {
      id: 'third-party-partners',
      icon: <Globe style={{ color: 'var(--accent-neon, #00f0ff)' }} size={24} />,
      title: '4. Third-Party Services We Use',
      content: 'To power our next-generation features, we securely share minimal necessary data with trusted third-party providers:',
      bullets: [
        { name: 'Supabase', desc: 'Secure database hosting, file storage for media/reels, and user authentication.' },
        { name: 'Cloudflare Edge Network', desc: 'Global content delivery, DDoS mitigation, IP logging for security, and server-side edge caching.' },
        { name: 'Razorpay', desc: 'PCI-DSS compliant payment processing for UPI, cards, and wallets. We do not store full credit card details on our servers.' },
        { name: 'Sentry', desc: 'Realtime application monitoring and telemetry to catch rendering crashes and edge network latency.' },
        { name: 'Google Generative AI', desc: 'Automated AI content moderation layers to analyze uploaded images, videos, and texts for harmful material.' }
      ]
    },
    {
      id: 'retention-rights',
      icon: <ShieldAlert style={{ color: '#ef4444' }} size={24} />,
      title: '5. Data Rights & Legal Frameworks',
      content: 'Indico complies with international data protection standards, including India\'s Digital Personal Data Protection Act (DPDPA) and the EU General Data Protection Regulation (GDPR). Users have the right to access their data, correct inaccuracies, object to automated filtering, and restrict certain processing parameters.',
      highlight: 'Compliant with GDPR & Indian DPDPA frameworks to keep your data secure.'
    },
    {
      id: 'deletion-requests',
      icon: <Trash2 style={{ color: '#ef4444' }} size={24} />,
      title: '6. Data Retention & Deletion Requests',
      content: 'We retain your personal information only as long as your account remains active or as required by law (e.g., standard tax and transaction reporting rules for Razorpay payouts). You have the absolute right to delete your account and request a total purge of all uploaded media and interaction history.',
      highlight: 'To request complete account deletion, please write to us at our legal email below or initiate account deletion via your Account Settings.'
    }
  ];

  return (
    <article className="container" style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '40px', paddingBottom: '120px', paddingLeft: '20px', paddingRight: '20px' }}>
      
      {/* Page Title & Branding */}
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.25)', padding: '6px 16px', borderRadius: '30px', marginBottom: '16px' }}>
          <Eye size={14} style={{ color: 'var(--accent-neon, #00f0ff)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-neon, #00f0ff)' }}>Privacy & Protection</span>
        </div>
        <h1 id="privacy-title" className="text-gradient-primary" style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.04em', margin: '0 0 12px 0' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
          Your privacy is a core priority at Indico. Learn how we handle your personal data, secure your transactions, and safeguard your creative freedom.
        </p>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginTop: '16px', fontWeight: '600' }}>
          Last Updated: May 18, 2026
        </div>
      </header>

      {/* Policies Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} aria-labelledby="privacy-title">
        
        {/* Quick Consent Banner */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(0,240,255,0.06), rgba(138,43,226,0.04))', border: '1px solid rgba(0,240,255,0.2)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 8px 0', color: 'white' }}>🛡️ Transparent Processing Guarantee</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Indico does not sell your private personal records to third-party advertising companies. Any data we collect is utilized purely to power the creator experience, process creator transactions, or run security and spam-prevention systems.
          </p>
        </div>

        {/* Section Cards */}
        {sections.map((section) => (
          <div 
            key={section.id} 
            id={section.id}
            className="glass-card hover-glow" 
            style={{ 
              padding: '32px', 
              borderRadius: '24px', 
              border: '1px solid var(--border-light)', 
              background: 'var(--bg-glass)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                width: '44px', height: '44px', borderRadius: '12px', 
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                {section.icon}
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'white', margin: 0 }}>
                {section.title}
              </h3>
            </div>
            
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.7', margin: '0 0 16px 0' }}>
              {section.content}
            </p>

            {/* Render Partner List if available */}
            {section.bullets && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {section.bullets.map((b, idx) => (
                  <div key={idx} style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <strong style={{ color: 'var(--accent-neon, #00f0ff)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                      {b.name}
                    </strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {b.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Glowing Category callout */}
            {section.highlight && (
              <div style={{ 
                padding: '16px 20px', 
                borderRadius: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                borderLeft: '4px solid var(--accent-neon, #00f0ff)',
                fontSize: '0.85rem', 
                fontWeight: '700',
                color: 'var(--text-primary)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)'
              }}>
                {section.highlight}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Footer Contact Details */}
      <footer style={{ marginTop: '56px', textAlign: 'center', paddingTop: '32px', borderTop: '1px solid var(--border-light)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '12px' }}>
          Have requests regarding data deletion, access, or compliance?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={16} style={{ color: 'var(--accent-neon, #00f0ff)' }} />
            <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: '700' }}>Compliance Office:</span>
            <a 
              id="privacy-contact-link"
              href="mailto:indicosocialprivacy@gmail.com" 
              style={{ 
                fontSize: '0.9rem', 
                color: 'var(--accent-neon, #00f0ff)', 
                fontWeight: '800', 
                textDecoration: 'none',
                borderBottom: '1px dashed var(--accent-neon)' 
              }}
            >
              indicosocialprivacy@gmail.com
            </a>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.8rem', marginTop: '28px', margin: 0 }}>
          © 2026 Indico Social. All rights reserved. Your data, protected.
        </p>
      </footer>

    </article>
  );
}
