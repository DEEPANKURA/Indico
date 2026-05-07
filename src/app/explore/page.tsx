import { Compass, Flame, Music, Gamepad2, Camera, Palette, BookOpen, Dumbbell } from 'lucide-react';

const categories = [
  { icon: Flame, label: 'Viral', color: '#f97316', count: '2.4M posts' },
  { icon: Music, label: 'Music', color: '#8b5cf6', count: '1.1M posts' },
  { icon: Gamepad2, label: 'Gaming', color: '#06b6d4', count: '890K posts' },
  { icon: Camera, label: 'Photography', color: '#ec4899', count: '670K posts' },
  { icon: Palette, label: 'Art & Design', color: '#10b981', count: '540K posts' },
  { icon: BookOpen, label: 'Education', color: '#f59e0b', count: '430K posts' },
  { icon: Dumbbell, label: 'Fitness', color: '#ef4444', count: '380K posts' },
];

const featuredCreators = [
  { name: 'Luna Creative', handle: '@luna_create', followers: '4.2M', category: 'Art', growth: '+240%' },
  { name: 'TechBro Dev', handle: '@techbro_dev', followers: '1.8M', category: 'Tech', growth: '+180%' },
  { name: 'BeatMaker Pro', handle: '@beatmakerpro', followers: '3.1M', category: 'Music', growth: '+156%' },
  { name: 'Fitness King', handle: '@fitnessking', followers: '2.7M', category: 'Fitness', growth: '+134%' },
  { name: 'Pixel Artist', handle: '@pixelart', followers: '920K', category: 'Art', growth: '+98%' },
  { name: 'CodeWithMe', handle: '@codewithme', followers: '1.2M', category: 'Education', growth: '+87%' },
];

export default function ExplorePage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Compass size={28} style={{ color: 'var(--accent-secondary)' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Explore</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>Discover the best creators and content across all categories</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '32px' }}>
        <input
          type="text"
          placeholder="Search creators, topics, hashtags..."
          style={{
            width: '100%', padding: '14px 20px',
            background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
            borderRadius: '40px', color: 'white', outline: 'none',
            fontSize: '1rem', boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Categories */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '1.1rem' }}>Browse Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {categories.map((cat, i) => (
            <div key={i} className="glass-card" style={{
              padding: '16px', borderRadius: '14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '14px',
              transition: 'transform 0.2s', border: `1px solid ${cat.color}22`
            }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <cat.icon size={24} style={{ color: cat.color }} />
              </div>
              <div>
                <div style={{ fontWeight: '700' }}>{cat.label}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{cat.count}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Creators */}
      <div>
        <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '1.1rem' }}>
          🔥 Rising Creators This Week
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {featuredCreators.map((creator, i) => (
            <div key={i} className="glass-card" style={{
              padding: '16px', borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 'bold', fontSize: '1.2rem'
                }}>
                  {creator.name[0]}
                </div>
                <div>
                  <div style={{ fontWeight: '700' }}>{creator.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {creator.handle} · {creator.followers} followers
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <span style={{ color: '#10b981', fontWeight: '700', fontSize: '0.9rem' }}>{creator.growth}</span>
                <button className="btn-secondary" style={{ padding: '5px 14px', fontSize: '0.8rem' }}>Follow</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
