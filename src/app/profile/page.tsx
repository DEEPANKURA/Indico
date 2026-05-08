'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Grid3x3, Heart, MessageCircle, Settings, DollarSign, Camera, BarChart2, Video, Sparkles, Layout } from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }
    setUser(user);

    const [{ data: profile }, { data: posts }, { data: earnings }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('posts').select('id, content, like_count, comment_count, created_at, media_urls').eq('author_id', user.id).order('created_at', { ascending: false }),
      supabase.from('transactions').select('amount').eq('recipient_id', user.id).eq('status', 'completed'),
    ]);

    setProfile(profile);
    setPosts(posts || []);
    setTotalEarnings(earnings?.reduce((s: number, t: any) => s + (t.amount || 0), 0) || 0);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Loading profile...
    </div>
  );

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Creator';
  const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'user';
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {showEdit && (
        <EditProfileModal
          profile={profile || {}}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchData(); }}
        />
      )}

      {/* Profile Header */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', marginBottom: '24px', position: 'relative' }}>
        <a href="/settings" style={{ position: 'absolute', top: '20px', right: '20px', color: 'var(--text-secondary)' }}>
          <Settings size={20} />
        </a>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="avatar"
                style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-secondary)', boxShadow: 'var(--shadow-neon)' }} />
            ) : (
              <div style={{
                width: '88px', height: '88px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-neon))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '2.5rem', fontWeight: '800', color: 'white',
                border: '3px solid var(--accent-secondary)', boxShadow: 'var(--shadow-neon)',
              }}>
                {displayName[0]?.toUpperCase()}
              </div>
            )}
            <button onClick={() => setShowEdit(true)}
              title="Change photo"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: '26px', height: '26px', borderRadius: '50%',
                background: 'var(--accent-primary)', border: '2px solid var(--bg-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: 'white',
              }}>
              <Camera size={13} />
            </button>
          </div>

          <div style={{ flex: 1, minWidth: '0' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '2px' }}>{displayName}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>@{username}</p>
            {profile?.bio
              ? <p style={{ fontSize: '0.9rem', marginBottom: '12px', lineHeight: '1.5' }}>{profile.bio}</p>
              : <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', fontStyle: 'italic' }}>No bio yet</p>
            }
            {profile?.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', marginBottom: '12px', display: 'block' }}>
                🔗 {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn-primary" onClick={() => setShowEdit(true)} style={{ padding: '7px 20px', fontSize: '0.85rem' }}>
                Edit Profile
              </button>
              <button className="btn-secondary" onClick={() => { navigator.clipboard?.writeText(window.location.href); }} style={{ padding: '7px 20px', fontSize: '0.85rem' }}>
                Share Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
          {[
            { label: 'Posts', value: posts.length },
            { label: 'Followers', value: profile?.followers_count || 0 },
            { label: 'Following', value: profile?.following_count || 0 },
            { label: 'Likes', value: totalLikes },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{stat.value.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1040 0%, #0d2040 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
        borderRadius: '16px', padding: '20px', marginBottom: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>Creator Earnings</div>
          <div style={{ fontSize: '2rem', fontWeight: '800' }} className="text-gradient">${totalEarnings.toFixed(2)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total tips received</div>
        </div>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <DollarSign size={28} color="white" />
        </div>
      </div>

      {/* Creator Tools Section (Especially for Mobile) */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Layout size={20} style={{ color: 'var(--accent-neon)' }} />
          <h2 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Creator Studio</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {[
            { label: 'Analytics', icon: BarChart2, href: '/analytics', color: '#06b6d4' },
            { label: 'Studio', icon: Video, href: '/studio', color: '#8b5cf6' },
            { label: 'Monetize', icon: DollarSign, href: '/monetize', color: '#10b981' },
            { label: 'AI Tools', icon: Sparkles, href: '/ai-tools', color: 'var(--accent-neon)' },
          ].map((tool) => (
            <a key={tool.label} href={tool.href} style={{ textDecoration: 'none' }}>
              <div className="glass-card" style={{ 
                padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', 
                alignItems: 'center', gap: '10px', textAlign: 'center',
                border: `1px solid ${tool.color}33`,
                transition: 'transform 0.2s'
              }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                 onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ 
                  width: '40px', height: '40px', borderRadius: '10px', 
                  background: `${tool.color}11`, display: 'flex', 
                  alignItems: 'center', justifyContent: 'center' 
                }}>
                  <tool.icon size={20} style={{ color: tool.color }} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{tool.label}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Grid3x3 size={20} style={{ color: 'var(--accent-secondary)' }} />
          <h2 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Your Posts</h2>
        </div>
        
        {posts.length > 0 ? (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '4px',
            marginBottom: '40px'
          }}>
            {posts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => setSelectedPost(post)}
                style={{ 
                  aspectRatio: '1/1', 
                  background: 'var(--bg-glass)', 
                  cursor: 'pointer',
                  overflow: 'hidden',
                  position: 'relative',
                  borderRadius: '4px'
                }}
              >
                {post.media_urls?.[0] ? (
                  post.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? (
                    <video src={post.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )
                ) : (
                  <div style={{ padding: '8px', fontSize: '0.75rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    {post.content.substring(0, 50)}...
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div style={{ 
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
                  opacity: 0, transition: 'opacity 0.2s', color: 'white'
                }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={18} fill="white" /> {post.like_count || 0}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={18} fill="white" /> {post.comment_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✍️</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>No posts yet. Share something!</p>
            <a href="/" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '10px 24px' }}>Create your first post</a>
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div style={{ 
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' 
        }} onClick={() => setSelectedPost(null)}>
          <div className="glass-card" style={{ 
            width: '100%', maxWidth: '900px', maxHeight: '90vh', 
            display: 'flex', flexDirection: isMobile ? 'column' : 'row',
            overflow: 'hidden', borderRadius: '12px'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Media Area */}
            <div style={{ 
              flex: 1.5, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
              maxHeight: isMobile ? '40vh' : 'none'
            }}>
              {selectedPost.media_urls?.[0] ? (
                selectedPost.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? (
                  <video src={selectedPost.media_urls[0]} controls autoPlay style={{ width: '100%', maxHeight: '100%', display: 'block' }} />
                ) : (
                  <img src={selectedPost.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )
              ) : (
                <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>
                  {selectedPost.content}
                </div>
              )}
            </div>

            {/* Info Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-light)' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem', overflow: 'hidden' }}>
                  {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : username[0].toUpperCase()}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{username}</div>
              </div>
              
              <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedPost.content}</p>
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(selectedPost.created_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '16px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Heart size={20} /> {selectedPost.like_count || 0}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={20} /> {selectedPost.comment_count || 0}</span>
                <button onClick={() => router.push(`/post/${selectedPost.id}`)} className="btn-secondary" style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}>View Full Post</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
