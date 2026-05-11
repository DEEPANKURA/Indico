'use client';

import { useState, useEffect } from 'react';
import { Camera, Layout, Grid3x3, DollarSign, Settings, Share2, BarChart2, Video, Trash2, Heart, MessageCircle, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import EditProfileModal from '@/components/EditProfileModal';
import PostCard from '@/components/PostCard';
import { deletePostAction } from '@/app/actions/social';
import FollowsModal from '@/components/FollowsModal';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFollows, setShowFollows] = useState<{type: 'followers' | 'following', userId: string} | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
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
      supabase.from('posts').select('id, content, like_count, comment_count, created_at, media_urls, music_url, music_title, music_artist, music_start_time, music_volume, video_volume, video_trim_start, video_trim_end').eq('author_id', user.id).is('community_id', null).order('created_at', { ascending: false }),
      supabase.from('transactions').select('amount').eq('recipient_id', user.id).eq('status', 'completed'),
    ]);

    setProfile(profile);
    setPosts(posts || []);
    setTotalEarnings(earnings?.reduce((s: number, t: any) => s + (t.amount || 0), 0) || 0);
    setLoading(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;
    
    const res = await deletePostAction(postId);
    if (res.success) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
    } else {
      alert('Error: ' + res.error);
    }
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
          onSaved={() => { 
            setShowEdit(false);
            fetchData();
          }}
        />
      )}

      {showFollows && (
        <FollowsModal 
          type={showFollows.type} 
          userId={showFollows.userId} 
          onClose={() => setShowFollows(null)} 
        />
      )}

      {/* Profile Header */}
      <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', marginBottom: '24px', position: 'relative', overflow: 'hidden' }}>
        {/* Background Accent */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--accent-primary)', opacity: 0.1, filter: 'blur(80px)', borderRadius: '50%' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
           <a href="/settings" style={{ color: 'var(--text-secondary)' }}><Settings size={22} /></a>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profile?.avatar_url ? (
              <img src={`${profile.avatar_url}${profile.avatar_url.includes('?') ? '&' : '?'}t=${Date.now()}`} alt="avatar"
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
                style={{ display: 'inline-block', color: 'var(--accent-neon)', textDecoration: 'none', fontSize: '0.85rem', marginBottom: '12px' }}>
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowEdit(true)} className="btn-primary" style={{ padding: '8px 20px', borderRadius: '12px', fontSize: '0.85rem' }}>Edit Profile</button>
              <button className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Share2 size={16} />
                Share Profile
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{posts.length.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Posts</div>
          </div>
          <div 
            style={{ textAlign: 'center', cursor: 'pointer' }} 
            onClick={() => setShowFollows({ type: 'followers', userId: user.id })}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{(profile?.followers_count || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Followers</div>
          </div>
          <div 
            style={{ textAlign: 'center', cursor: 'pointer' }} 
            onClick={() => setShowFollows({ type: 'following', userId: user.id })}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{(profile?.following_count || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Following</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{totalLikes.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Likes</div>
          </div>
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
                  position: 'relative', 
                  cursor: 'pointer',
                  overflow: 'hidden',
                  background: 'var(--bg-secondary)',
                  borderRadius: '4px'
                }}
                className="hover-scale"
              >
                {post.media_urls?.[0] ? (
                  post.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? (
                    <video src={post.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )
                ) : (
                  <div style={{ padding: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden' }}>{post.content}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderRadius: '20px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No posts yet.</p>
            <a href="/upload" className="btn-primary" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none', padding: '8px 20px' }}>Create First Post</a>
          </div>
        )}
      </div>

      {/* Detail Modal */}
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
              maxHeight: isMobile ? '40vh' : 'none', position: 'relative'
            }}>
              {selectedPost.media_urls?.[0] ? (
                selectedPost.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? (
                  <video 
                    src={selectedPost.media_urls[0]} 
                    controls 
                    autoPlay 
                    loop
                    onPlay={(e) => {
                      const v = e.currentTarget;
                      v.volume = selectedPost.video_volume ?? 1.0;
                      if (selectedPost.video_trim_start) v.currentTime = selectedPost.video_trim_start;
                    }}
                    onTimeUpdate={(e) => {
                      const v = e.currentTarget;
                      if (selectedPost.video_trim_end && v.currentTime >= selectedPost.video_trim_end) {
                        v.currentTime = selectedPost.video_trim_start || 0;
                      }
                    }}
                    style={{ width: '100%', maxHeight: '100%', display: 'block' }} 
                  />
                ) : (
                  <img src={selectedPost.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                )
              ) : (
                <div style={{ padding: '40px', color: 'white', textAlign: 'center' }}>
                  {selectedPost.content}
                </div>
              )}
              
              {selectedPost.music_url && (
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', zIndex: 5 }}>
                   <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px',
                      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderRadius: '12px',
                      color: 'white', fontSize: '0.8rem'
                    }}>
                      <Music size={14} />
                      <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedPost.music_title} • {selectedPost.music_artist}
                      </div>
                    </div>
                    <audio 
                      autoPlay 
                      src={selectedPost.music_url} 
                      loop 
                      onPlay={(e) => {
                        const a = e.currentTarget;
                        a.volume = selectedPost.music_volume ?? 0.5;
                        a.currentTime = selectedPost.music_start_time || 0;
                      }}
                    />
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
                <button onClick={() => setSelectedPost(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
              
              <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedPost.content}</p>
                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {new Date(selectedPost.created_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ padding: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Heart size={20} /> {selectedPost.like_count || 0}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MessageCircle size={20} /> {selectedPost.comment_count || 0}</span>
                
                <button 
                  onClick={() => handleDeletePost(selectedPost.id)}
                  style={{ 
                    marginLeft: 'auto', background: 'rgba(239,68,68,0.1)', color: '#ef4444', 
                    border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer' 
                  }}
                  title="Delete Post"
                >
                  <Trash2 size={20} />
                </button>
                
                <button onClick={() => router.push(`/post/${selectedPost.id}`)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>View Full</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
