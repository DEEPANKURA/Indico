import type { Metadata } from 'next';
import { 
  Users, AlertOctagon, HeartOff, MegaphoneOff, ShieldAlert, 
  Flame, Skull, Ban, HelpCircle, FileWarning, EyeOff 
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Community Guidelines',
  description: 'Understand Indico\'s content standards and safety rules. Read about prohibited content, automated moderation, and our zero-tolerance policies for hate speech, scams, and abuse.',
  alternates: {
    canonical: '/guidelines',
  },
};

export default function GuidelinesPage() {
  const guidelines = [
    {
      id: 'hate-speech',
      icon: <HeartOff style={{ color: '#ef4444' }} size={24} />,
      title: 'Hate Speech & Discrimination',
      content: 'We do not tolerate content that attacks, dehumanizes, incites violence against, or promotes hatred toward individuals or groups based on protected attributes. This includes race, ethnicity, national origin, religion, sexual orientation, sex, gender, gender identity, or severe disability.',
      severity: 'Strict Violation — Immediate Content Removal & Potential Account Suspension.'
    },
    {
      id: 'harassment-abuse',
      icon: <MegaphoneOff style={{ color: '#ec4899' }} size={24} />,
      title: 'Harassment & Cyberbullying',
      content: 'Abusive behaviors, targeting individuals with malicious insults, threats, unwanted sexual advances, doxxing (publishing private personal information), or coordinated brigading against any user are strictly banned. Indico is a space for supportive creativity.',
      severity: 'Strict Violation — Temporary or Permanent Ban depending on frequency.'
    },
    {
      id: 'terrorism-extremism',
      icon: <Skull style={{ color: '#ef4444' }} size={24} />,
      title: 'Terrorism & Violent Extremism',
      content: 'Any content promoting, praising, coordinating, or facilitating acts of terrorism, violent extremist groups, or dangerous organizations is strictly forbidden. This includes uploading extremist propaganda, manifestos, or funding violent operations.',
      severity: 'Zero Tolerance — Permanent Account Ban & Immediate Referral to Law Enforcement.'
    },
    {
      id: 'child-exploitation',
      icon: <Ban style={{ color: '#ef4444' }} size={24} />,
      title: 'Child Exploitation & Abuse Material (CSAM)',
      content: 'We have absolute zero tolerance for any form of child sexual abuse material, grooming, or child exploitation. We automatically scan and review uploads for such material using advanced automated detection systems.',
      severity: 'Zero Tolerance — Permanent Ban, Account Data Preserved & Reported to NCMEC/Authorities.'
    },
    {
      id: 'scams-fraud',
      icon: <AlertOctagon style={{ color: '#f59e0b' }} size={24} />,
      title: 'Scams & Financial Fraud',
      content: 'You may not upload content that deceives, misleads, or defrauds users for financial or personal gain. This includes phishing links, Ponzi schemes, multi-level marketing (MLM) promotions, artificial monetization hacking, or fake giveaways.',
      severity: 'Strict Violation — Financial Monetization Banned & Account Suspension.'
    },
    {
      id: 'impersonation-identity',
      icon: <Users style={{ color: 'var(--accent-secondary, #a855f7)' }} size={24} />,
      title: 'Impersonation & Deception',
      content: 'Do not pretend to be another individual, brand, or organization in a manner that misleads or deceives our community. Fan channels or parody accounts must clearly state their status in both their username and bio.',
      severity: 'Violation — Profile Correction Required or Account Removal.'
    },
    {
      id: 'spam-manipulation',
      icon: <EyeOff style={{ color: '#94a3b8' }} size={24} />,
      title: 'Spam & Platform Manipulation',
      content: 'Uploading high-frequency repetitive content, mass tags, coordinate engagement manipulations, clickbait links redirecting to malicious external sites, or running non-approved automated scrapers/bots is strictly prohibited.',
      severity: 'Violation — Content Deprioritization or IP Block.'
    },
    {
      id: 'piracy-copyright',
      icon: <FileWarning style={{ color: '#f59e0b' }} size={24} />,
      title: 'Digital Piracy & IP Theft',
      content: 'Sharing unauthorized copies of premium movies, television shows, commercial music tracks, software, or digital goods that you do not hold licenses or ownership rights for is banned.',
      severity: 'Strict Violation — Post Removal and Strike System Policy.'
    },
    {
      id: 'violent-threats',
      icon: <Flame style={{ color: '#ef4444' }} size={24} />,
      title: 'Violent Threats & Physical Harm',
      content: 'Content showing physical violence, glorifying self-harm or suicide, or conveying explicit statements of intent to commit acts of violence against any real-world person or location is strictly banned.',
      severity: 'Zero Tolerance — Immediate Permanent IP Ban and Legal Cooperation.'
    }
  ];

  return (
    <article className="container" style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '40px', paddingBottom: '120px', paddingLeft: '20px', paddingRight: '20px' }}>
      
      {/* Guidelines Header */}
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', padding: '6px 16px', borderRadius: '30px', marginBottom: '16px' }}>
          <ShieldAlert size={14} style={{ color: '#ef4444' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#ef4444' }}>Safety Standards</span>
        </div>
        <h1 id="guidelines-title" className="text-gradient-primary" style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-0.04em', margin: '0 0 12px 0' }}>
          Community Guidelines
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', margin: 0, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.6' }}>
          Our mission is to establish a high-quality creator space. To protect our community and justify our moderation and enforcement procedures, these guidelines outline what is strictly prohibited.
        </p>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)', marginTop: '16px', fontWeight: '600' }}>
          Last Updated: May 18, 2026
        </div>
      </header>

      {/* Main Grid */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} aria-labelledby="guidelines-title">
        
        {/* Moderate Policy Banner */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(138,43,226,0.04))', border: '1px solid rgba(239,68,68,0.2)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 8px 0', color: 'white' }}>👮 AI & Human Moderation Enforcement</h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            We deploy a combination of advanced automated artificial intelligence moderation models alongside dedicated human trust-and-safety specialists to monitor posts, reels, comments, and channels. If your uploads trigger these safety guidelines, we hold full authority to take punitive actions without warning.
          </p>
        </div>

        {/* Guidelines List */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {guidelines.map((rule) => (
            <div 
              key={rule.id} 
              id={rule.id}
              className="glass-card hover-glow" 
              style={{ 
                padding: '24px', 
                borderRadius: '20px', 
                border: '1px solid var(--border-light)', 
                background: 'var(--bg-glass)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ 
                    width: '38px', height: '38px', borderRadius: '10px', 
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    {rule.icon}
                  </div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'white', margin: 0 }}>
                    {rule.title}
                  </h3>
                </div>
                
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 16px 0' }}>
                  {rule.content}
                </p>
              </div>

              {/* Status/Consequence label */}
              <div style={{ 
                padding: '10px 14px', 
                borderRadius: '10px', 
                background: 'rgba(255,255,255,0.01)', 
                borderLeft: '3px solid #ef4444',
                fontSize: '0.75rem', 
                fontWeight: '700',
                color: 'var(--text-primary)',
              }}>
                {rule.severity}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Guidelines Footer */}
      <footer style={{ marginTop: '56px', textAlign: 'center', paddingTop: '32px', borderTop: '1px solid var(--border-light)' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '12px' }}>
          Notice any violations of these standards on Indico feeds?
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={16} style={{ color: 'var(--accent-neon, #00f0ff)' }} />
          <span style={{ fontSize: '0.9rem', color: 'white', fontWeight: '700' }}>Report Violations:</span>
          <a 
            id="guidelines-report-link"
            href="mailto:safety@indicosocial.in" 
            style={{ 
              fontSize: '0.9rem', 
              color: 'var(--accent-neon, #00f0ff)', 
              fontWeight: '800', 
              textDecoration: 'none',
              borderBottom: '1px dashed var(--accent-neon)' 
            }}
          >
            safety@indicosocial.in
          </a>
        </div>
        <p style={{ color: 'var(--text-muted, #94a3b8)', fontSize: '0.8rem', marginTop: '24px', margin: 0 }}>
          © 2026 Indico Social. All rights reserved. Keep creating, keep it safe.
        </p>
      </footer>

    </article>
  );
}
