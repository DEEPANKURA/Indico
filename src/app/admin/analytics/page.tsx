import { BarChart3, TrendingUp, Compass, Heart, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage() {
  const trafficSources = [
    { source: 'Direct (https://indicosocial.in)', visits: 12480, percentage: 45, color: '#8b5cf6' },
    { source: 'Google Search Organic SEO', visits: 8320, percentage: 30, color: '#00f0ff' },
    { source: 'Instagram / YouTube Referral', visits: 4160, percentage: 15, color: '#eab308' },
    { source: 'Other Social Media Hubs', visits: 2770, percentage: 10, color: '#ef4444' }
  ];

  const devices = [
    { device: 'Mobile Progressive Web App (PWA)', count: '18,400 sessions', share: 66, color: '#8b5cf6' },
    { device: 'Mobile Browsers (Safari / Chrome)', count: '6,680 sessions', share: 24, color: '#00f0ff' },
    { device: 'Desktop Web Browser', count: '2,780 sessions', share: 10, color: '#64748b' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
          Platform Analytics & Diagnostics
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
          Comprehensive statistics tracking user growth, engagement trends, progressive mobile PWA session counts, and network traffic distributions.
        </p>
      </div>

      {/* Main Grid split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Traffic Sources */}
        <div style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} style={{ color: '#00f0ff' }} /> Traffic & User Acquisition Sources
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {trafficSources.map((src) => (
              <div key={src.source} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'white', fontWeight: '700' }}>{src.source}</span>
                  <span style={{ color: '#94a3b8' }}>{src.visits.toLocaleString()} ({src.percentage}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${src.percentage}%`, height: '100%', borderRadius: '4px',
                    background: src.color, transition: 'width 1s ease'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Distribution */}
        <div style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={20} style={{ color: '#8b5cf6' }} /> Device & Mobile Platform Distribution
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {devices.map((dev) => (
              <div key={dev.device} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'white', fontWeight: '700' }}>{dev.device}</span>
                  <span style={{ color: '#94a3b8' }}>{dev.count} ({dev.share}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${dev.share}%`, height: '100%', borderRadius: '4px',
                    background: dev.color, transition: 'width 1s ease'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Engagement Stats row */}
      <div style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '28px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={20} style={{ color: '#eab308' }} /> Weekly Platform Retention Metrics
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px' }}>
          {[
            { metric: 'Week 1 Retention', value: '78.2%', info: 'Highly active returning members', icon: Users, color: '#8b5cf6' },
            { metric: 'Avg Interaction Time', value: '18m 42s', info: 'Daily duration per user session', icon: Compass, color: '#00f0ff' },
            { metric: 'Like Reaction Rate', value: '89.4%', info: 'Standard positivity score', icon: Heart, color: '#ef4444' },
            { metric: 'PWA Installation Rate', value: '44.8%', info: 'PWA Mobile application targets', icon: BarChart3, color: '#10b981' }
          ].map((item, idx) => (
            <div 
              key={idx}
              style={{
                padding: '20px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px'
              }}
            >
              <item.icon size={18} style={{ color: item.color }} />
              <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>{item.metric}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>{item.value}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.info}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
