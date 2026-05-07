import { TrendingUp, Flame, ArrowUpRight } from 'lucide-react';

const trends = [
  { rank: 1, tag: '#indico', posts: '8.2M', change: '+42%', hot: true },
  { rank: 2, tag: '#newcreator', posts: '4.1M', change: '+89%', hot: true },
  { rank: 3, tag: '#goviralindico', posts: '2.8M', change: '+156%', hot: true },
  { rank: 4, tag: '#beatmaking', posts: '1.9M', change: '+34%', hot: false },
  { rank: 5, tag: '#aiart', posts: '1.6M', change: '+67%', hot: false },
  { rank: 6, tag: '#contentcreator', posts: '1.4M', change: '+28%', hot: false },
  { rank: 7, tag: '#gaming2026', posts: '1.1M', change: '+45%', hot: false },
  { rank: 8, tag: '#studywithme', posts: '980K', change: '+22%', hot: false },
  { rank: 9, tag: '#fitnessjourney', posts: '870K', change: '+31%', hot: false },
  { rank: 10, tag: '#photography', posts: '760K', change: '+18%', hot: false },
];

const trendingPosts = [
  { author: 'LunaCreative', handle: '@luna_create', content: 'Just hit 4M followers on Indico! New creators CAN go viral here. Algorithm actually rewards quality 🔥', likes: '89K', timeAgo: '2h ago' },
  { author: 'TechBro Dev', handle: '@techbro_dev', content: 'Built this entire dashboard in 2 hours using AI tools. The future of dev is here.', likes: '45K', timeAgo: '5h ago' },
  { author: 'BeatMaker Pro', handle: '@beatmakerpro', content: 'New track dropping at midnight. This one hits different. #beatmaking #music', likes: '62K', timeAgo: '8h ago' },
];

export default function TrendingPage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <TrendingUp size={28} style={{ color: 'var(--accent-secondary)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Trending</h1>
      </div>

      {/* Trending Hashtags */}
      <div className="glass-card" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Flame size={20} style={{ color: '#f97316' }} />
          <h2 style={{ fontWeight: '700', fontSize: '1rem' }}>Top Hashtags Right Now</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {trends.map((trend) => (
            <div key={trend.rank} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: trend.rank < trends.length ? '1px solid var(--border-light)' : 'none',
              cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ width: '24px', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.9rem' }}>
                  {trend.rank}
                </span>
                <div>
                  <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={trend.hot ? 'text-gradient' : ''}>{trend.tag}</span>
                    {trend.hot && <Flame size={14} style={{ color: '#f97316' }} />}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{trend.posts} posts</div>
                </div>
              </div>
              <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <ArrowUpRight size={14} />{trend.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Posts */}
      <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '1.1rem' }}>🔥 Trending Posts</h2>
      {trendingPosts.map((post, i) => (
        <div key={i} className="glass-card animate-fade-in" style={{ padding: '20px', borderRadius: '16px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 'bold'
            }}>{post.author[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '700' }}>{post.author}
                <span style={{ color: 'var(--text-secondary)', fontWeight: '400', marginLeft: '6px', fontSize: '0.85rem' }}>{post.handle}</span>
              </div>
              <p style={{ margin: '8px 0', lineHeight: '1.5' }}>{post.content}</p>
              <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <span>❤️ {post.likes}</span>
                <span>{post.timeAgo}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
