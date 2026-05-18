import type { Metadata } from 'next';
import { Shield, FileText, AlertTriangle, Eye, Lock, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Understand user responsibilities, content policies, licensing, copyright terms, and account rules on the Indico creator-first social platform.',
  alternates: {
    canonical: '/terms',
  },
};

export default function TermsPage() {
  const sections = [
    {
      id: 'user-responsibilities',
      icon: <Shield className="text-gradient" size={24} />,
      title: '1. User Responsibilities',
      content: 'You must be at least 13 years old to use Indico. By creating an account, you represent and warrant that you meet this age restriction. You are entirely responsible for all activities that occur under your account, and you agree to maintain the security and confidentiality of your login credentials. You explicitly agree that you are solely responsible for any content (including images, video, text, audio, and reels) that you upload, post, or transmit through our services.',
      keyClause: '“Users are responsible for all content they upload, publish, or share on the platform.”'
    },
    {
      id: 'prohibited-content',
      icon: <AlertTriangle style={{ color: '#ef4444' }} size={24} />,
      title: '2. Prohibited Content & Abuse',
      content: 'We are committed to maintaining a safe, creative, and respectful environment. You are strictly prohibited from uploading, publishing, or sharing any material that is illegal, abusive, vulgar, defamatory, harassing, sexually explicit, harmful to minors, pornographic, promoting violence, criminal acts, or violating any intellectual property rights of others.',
      keyClause: '“No illegal, abusive, copyrighted, or harmful material of any kind is permitted on Indico.”'
    },
    {
      id: 'suspension-moderation',
      icon: <Scale style={{ color: 'var(--accent-secondary, #a855f7)' }} size={24} />,
      title: '3. Moderation & Suspension Rights',
      content: 'Indico utilizes automated AI systems and human moderators to verify safety and review content. We reserve the absolute right, in our sole discretion and without prior notice, to monitor, review, flag, reject, or permanently delete any content, post, or reel that violates these terms. Furthermore, we reserve the right to suspend, terminate, or restrict your access to your account and the platform at any time, for any reason or no reason.',
      keyClause: '“Indico may remove content, restrict access, or terminate accounts at its sole discretion.”'
    },
    {
      id: 'ownership-license',
      icon: <FileText style={{ color: 'var(--accent-neon, #00f0ff)' }} size={24} />,
      title: '4. Content Ownership & License',
      content: 'You retain all ownership rights in the original content you submit, post, or display on Indico. However, by uploading content to the platform, you automatically grant Indico a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to host, store, use, reproduce, modify, adapt, publish, translate, create derivative works from, distribute, publicly perform, and publicly display such content in connection with providing and promoting our services.',
      keyClause: '“You own your content, but grant Indico a license to host, distribute, and display it.”'
    },
    {
      id: 'copyright-dmca',
      icon: <Lock style={{ color: '#f59e0b' }} size={24} />,
      title: '5. Copyright & IP Policy',
      content: 'Indico respects the intellectual property rights of others. We respond promptly to clear, valid notices of alleged copyright infringement under applicable laws, including the DMCA. If you believe your copyrighted work is being infringed on our platform, you may submit a take-down notification to our designated support/legal contact with the required proof of original ownership.',
      keyClause: '“Unauthorized use of copyrighted material will lead to content removal and account suspension.”'
    },
    {
      id: 'liability-disputes',
      icon: <Eye style={{ color: '#10b981' }} size={24} />,
      title: '6. Limitation of Liability & Disputes',
      content: 'Indico is provided "as is" and "as available" without any warranties, express or implied. In no event shall Indico, its developers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use or inability to use the platform. Any disputes arising out of these Terms of Service shall be resolved through binding individual arbitration or the relevant courts, to the exclusion of any class action lawsuits.',
      keyClause: '“Indico is provided as-is, and our liability is strictly limited to the maximum extent permitted by law.”'
    }
  ];

  return (
    <article className="container" style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '40px', paddingBottom: '120px', paddingLeft: '20px', paddingRight: '20px' }}>
      
      {/* Premium Glowing Page Title */}
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(138,43,226,0.1)', border: '1px solid rgba(138,43,226,0.25)', padding: '6px 16px', borderRadius: '30px', marginBottom: '16px' }}>
          <Shield size={14} style={{ color: 'var(--accent-neon, #00f0ff)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent-neon, #00f0ff)' }}>Legal Agreement</span>
        </div>
        <h1 id="terms-title" className="text-gradient-primary" style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.04em', margin: '0 0 12px 0' }}>
          Terms of Service
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
          Welcome to Indico. Please read our terms carefully. By accessing or using our platform, you agree to be bound by these legal rules.
        </p>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginTop: '16px', fontWeight: '600' }}>
          Last Updated: May 18, 2026
        </div>
      </header>

      {/* Main Glass Cards container */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} aria-labelledby="terms-title">
        
        {/* Quick Summary Banner */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(138,43,226,0.06), rgba(0,240,255,0.04))', border: '1px solid rgba(138,43,226,0.2)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 8px 0', color: 'white' }}>⚡ Quick TL;DR Summary</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            We want Indico to be the ultimate, premium launchpad for high-quality creators. To keep our community thriving, you remain the owner of whatever content you upload, but you grant us permission to host it. In turn, you must guarantee your content is safe, legal, and does not violate copyright laws. We hold absolute moderation rights to preserve safety and quality across trending feeds.
          </p>
        </div>

        {/* Individual Clauses */}
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
            
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.7', margin: '0 0 20px 0' }}>
              {section.content}
            </p>

            {/* Glowing Important Clause callout */}
            <div style={{ 
              padding: '16px 20px', 
              borderRadius: '16px', 
              background: 'rgba(255,255,255,0.02)', 
              borderLeft: '4px solid var(--accent-primary)',
              fontSize: '0.85rem', 
              fontWeight: '700',
              fontStyle: 'italic',
              color: 'var(--text-primary)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.05)'
            }}>
              {section.keyClause}
            </div>
          </div>
        ))}
      </section>

      {/* Footer Contact Details */}
      <footer style={{ marginTop: '56px', textAlign: 'center', paddingTop: '32px', borderTop: '1px solid var(--border-light)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '12px' }}>
          Have questions or require support regarding these Terms of Service?
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: '700' }}>Legal & Support Contact:</span>
          <a 
            id="legal-contact-link"
            href="mailto:legal@indicosocial.in" 
            style={{ 
              fontSize: '0.9rem', 
              color: 'var(--accent-neon, #00f0ff)', 
              fontWeight: '800', 
              textDecoration: 'none',
              borderBottom: '1px dashed var(--accent-neon)' 
            }}
          >
            legal@indicosocial.in
          </a>
        </div>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.8rem', marginTop: '24px', margin: 0 }}>
          © 2026 Indico Social. All rights reserved. Built for creators.
        </p>
      </footer>

    </article>
  );
}
