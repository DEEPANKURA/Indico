import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Grid3x3, Heart, MessageCircle, Share2, Settings, DollarSign } from 'lucide-react';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth');

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, like_count, comment_count, created_at, media_urls')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch transactions (earnings)
  const { data: earnings } = await supabase
    .from('transactions')
    .select('amount')
    .eq('recipient_id', user.id)
    .eq('status', 'completed');

  const totalEarnings = earnings?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const totalLikes = posts?.reduce((sum, p) => sum + (p.like_count || 0), 0) || 0;

  const displayName = profile?.full_name || user.user_metadata?.full_name || 'Creator';
  const username = profile?.username || user.user_metadata?.username || user.email?.split('@')[0] || 'user';

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {/* Profile Header */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', marginBottom: '24px', position: 'relative' }}>
        {/* Settings button */}
        <a href="/settings" style={{
          position: 'absolute', top: '20px', right: '20px',
          color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
        }}>
          <Settings size={20} />
        </a>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div style={{
            width: '88px', height: '88px', borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-neon))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2.5rem', fontWeight: '800', color: 'white',
            border: '3px solid var(--accent-secondary)',
            boxShadow: 'var(--shadow-neon)'
          }}>
            {displayName[0]?.toUpperCase()}
          </div>

          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '2px' }}>{displayName}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>@{username}</p>
            {profile?.bio && <p style={{ fontSize: '0.9rem', marginBottom: '12px', lineHeight: '1.5' }}>{profile.bio}</p>}
            {!profile?.bio && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', fontStyle: 'italic' }}>
                No bio yet — add one in Settings
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-primary" style={{ padding: '7px 20px', fontSize: '0.85rem' }}>Edit Profile</button>
              <button className="btn-secondary" style={{ padding: '7px 20px', fontSize: '0.85rem' }}>Share Profile</button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
          marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-light)'
        }}>
          {[
            { label: 'Posts', value: posts?.length || 0 },
            { label: 'Followers', value: profile?.followers_count || 0 },
            { label: 'Following', value: profile?.following_count || 0 },
            { label: 'Total Likes', value: totalLikes },
          ].map((stat, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{stat.value.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1040 0%, #0d2040 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px', padding: '20px', marginBottom: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Creator Earnings</div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }} className="text-gradient">
            ${totalEarnings.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total tips received</div>
        </div>
        <div style={{
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <DollarSign size={28} color="white" />
        </div>
      </div>

      {/* Posts Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Grid3x3 size={20} style={{ color: 'var(--accent-secondary)' }} />
          <h2 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Your Posts</h2>
        </div>

        {posts && posts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map((post) => (
              <div key={post.id} className="glass-card" style={{ padding: '16px', borderRadius: '14px' }}>
                <p style={{ marginBottom: '12px', lineHeight: '1.6', fontSize: '0.95rem' }}>{post.content}</p>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Heart size={14} /> {post.like_count || 0}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MessageCircle size={14} /> {post.comment_count || 0}
                  </span>
                  <span style={{ marginLeft: 'auto' }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✍️</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No posts yet. Share something with the world!</p>
            <a href="/" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 24px' }}>
              Create your first post
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
