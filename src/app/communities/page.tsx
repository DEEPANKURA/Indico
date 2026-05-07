import { Users, Lock, Globe } from 'lucide-react';

const communities = [
  { name: 'Indico Creators Hub', members: '124K', posts: '4.2K', description: 'The official community for Indico creators. Share tips, collaborate, and grow together.', category: 'Official', isPublic: true, color: '#8b5cf6' },
  { name: 'Music Producers', members: '89K', posts: '2.1K', description: 'For beatmakers, producers, and music artists. Share your tracks and get feedback.', category: 'Music', isPublic: true, color: '#ec4899' },
  { name: 'Digital Artists', members: '67K', posts: '3.8K', description: 'Share your digital art, get critiques, and find collaboration opportunities.', category: 'Art', isPublic: true, color: '#06b6d4' },
  { name: 'Gaming Creators', members: '210K', posts: '8.9K', description: 'For streamers, gaming content creators, and esports enthusiasts.', category: 'Gaming', isPublic: true, color: '#10b981' },
  { name: 'Tech Builders', members: '45K', posts: '1.2K', description: 'Developers, founders, and tech creators building in public.', category: 'Tech', isPublic: false, color: '#f59e0b' },
  { name: 'Fitness & Wellness', members: '78K', posts: '2.6K', description: 'Share your fitness journey, nutrition tips, and wellness content.', category: 'Fitness', isPublic: true, color: '#ef4444' },
];

export default function CommunitiesPage() {
  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={28} style={{ color: 'var(--accent-secondary)' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Communities</h1>
        </div>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          + Create
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['All', 'Joined', 'Music', 'Gaming', 'Art', 'Tech', 'Fitness'].map((tab) => (
          <button key={tab} style={{
            padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600',
            background: tab === 'All' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-glass)',
            border: '1px solid var(--border-light)', color: 'white', cursor: 'pointer'
          }}>{tab}</button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {communities.map((comm, i) => (
          <div key={i} className="glass-card animate-fade-in" style={{ padding: '20px', borderRadius: '16px', borderLeft: `4px solid ${comm.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontWeight: '700', fontSize: '1rem' }}>{comm.name}</h3>
                  {comm.isPublic
                    ? <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
                    : <Lock size={14} style={{ color: 'var(--text-secondary)' }} />}
                  <span style={{ fontSize: '0.75rem', background: `${comm.color}22`, color: comm.color, padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{comm.category}</span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px', lineHeight: '1.5' }}>{comm.description}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>👥 {comm.members} members</span>
                  <span>💬 {comm.posts} posts/week</span>
                </div>
              </div>
              <button className="btn-secondary" style={{ marginLeft: '16px', padding: '8px 18px', flexShrink: 0 }}>Join</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
