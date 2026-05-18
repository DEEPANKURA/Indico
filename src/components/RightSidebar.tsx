import { TrendingUp, Activity, UserPlus, Zap } from 'lucide-react';
import Link from 'next/link';

export default function RightSidebar() {
  const trendingTags = [
    { tag: '#indico', posts: '8.2M', growth: '+42%' },
    { tag: '#newcreator', posts: '4.1M', growth: '+89%' },
    { tag: '#goviralindico', posts: '2.8M', growth: '+156%' },
    { tag: '#beatmaking', posts: '1.9M', growth: '+34%' },
    { tag: '#aiart', posts: '1.6M', growth: '+67%' },
  ];

  const risingCreators = [
    { name: 'Alex', handle: '@alex', followers: '0' },
    { name: 'Sarah', handle: '@sarah_creates', followers: '12' },
    { name: 'Marcus', handle: '@marcus_vfx', followers: '5' },
  ];

  return (
    <aside className="right-sidebar hide-on-mobile" style={{
      width: '340px',
      height: '100vh',
      borderLeft: '1px solid var(--border-light)',
      padding: '24px',
      overflowY: 'auto',
      background: 'var(--bg-primary)'
    }}>
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Zap size={20} className="text-gradient" />
          <h3 style={{ fontSize: '1.1rem' }}>Indico Algorithm</h3>
        </div>
        <p className="text-sm text-secondary" style={{ marginBottom: '16px' }}>
          Content is ranked by quality signals — not follower count. Every new creator gets equal initial exposure.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { label: 'Watch Time', value: '94%', color: 'var(--accent-primary)' },
            { label: 'Completion Rate', value: '87%', color: 'var(--accent-secondary)' },
            { label: 'Share Velocity', value: '76%', color: 'var(--accent-neon)' },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                <span className="text-secondary">{stat.label}</span>
                <span style={{ fontWeight: 'bold' }}>{stat.value}</span>
              </div>
              <div style={{ height: '4px', background: 'var(--border-light)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: stat.value, background: stat.color, borderRadius: '2px', boxShadow: `0 0 10px ${stat.color}` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingUp size={20} style={{ color: '#ff6b6b' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Trending Now</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {trendingTags.map((tag, i) => (
            <Link href={`/tag/${tag.tag.substring(1)}`} key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className="text-muted text-sm" style={{ fontWeight: 'bold', width: '12px' }}>{i + 1}</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{tag.tag}</div>
                  <div className="text-xs text-secondary">{tag.posts} posts</div>
                </div>
              </div>
              <span style={{ color: '#00cccc', fontSize: '0.85rem', fontWeight: 'bold' }}>{tag.growth}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Activity size={20} style={{ color: 'var(--accent-secondary)' }} />
          <h3 style={{ fontSize: '1.1rem' }}>Rising Creators</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {risingCreators.map((creator, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '40px', height: '40px', 
                borderRadius: '50%', background: 'var(--bg-glass-hover)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', border: '1px solid var(--accent-secondary)'
              }}>
                {creator.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {creator.name}
                  <span className="badge badge-neon">NEW</span>
                </div>
                <div className="text-xs text-secondary">{creator.followers} followers</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ 
        marginTop: '24px', 
        padding: '0 8px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '8px', 
        fontSize: '0.75rem', 
        color: 'var(--text-muted, #94a3b8)',
        opacity: 0.8
      }}>
        <Link href="/terms" style={{ color: 'var(--text-muted, #94a3b8)', textDecoration: 'none' }} className="hover-neon">Terms of Service</Link>
        <span>•</span>
        <span>© 2026 Indico</span>
      </div>
    </aside>
  );
}
