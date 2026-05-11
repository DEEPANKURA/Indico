'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Settings, Camera, DollarSign, BarChart2, Video, 
  Sparkles, Layout, Trash2, CheckCircle2, User, 
  Users, Heart, FileText, ChevronRight, Edit2, Share2, Calendar, Crown, MessageCircle
} from 'lucide-react';
import { deletePostAction } from '@/app/actions/social';
import EditProfileModal from '@/components/EditProfileModal';
import FollowsModal from '@/components/FollowsModal';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showFollows, setShowFollows] = useState<{ type: 'followers' | 'following', userId: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }
    setUser(user);

    const [{ data: profile }, { data: posts }, { data: earnings }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('posts').select('*').eq('author_id', user.id).is('community_id', null).order('created_at', { ascending: false }),
      supabase.from('transactions').select('amount').eq('recipient_id', user.id).eq('status', 'completed'),
    ]);

    setProfile(profile);
    setPosts(posts || []);
    setTotalEarnings(earnings?.reduce((s: number, t: any) => s + (t.amount || 0), 0) || 0);
    setLoading(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    const res = await deletePostAction(postId);
    if (res.success) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    } else {
      alert('Error: ' + res.error);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingTop: '100px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <div className="animate-spin" style={{ marginBottom: '20px' }}>
        <Sparkles size={40} color="var(--accent-primary)" />
      </div>
      <p style={{ fontWeight: '600', letterSpacing: '0.05em' }}>PREPARING YOUR PROFILE...</p>
    </div>
  );

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Creator';
  const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'user';
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
  const joinDate = new Date(profile?.created_at || user?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 20px 120px 20px' }}>
      {showEdit && (
        <EditProfileModal
          profile={profile || {}}
          onClose={() => setShowEdit(false)}
          onSaved={() => { setShowEdit(false); fetchData(); }}
        />
      )}

      {showFollows && (
        <FollowsModal
          type={showFollows.type}
          userId={showFollows.userId}
          onClose={() => setShowFollows(null)}
        />
      )}

      {/* Header Section */}
      <div className="glass-card" style={{ padding: '40px', borderRadius: '32px', marginBottom: '24px', position: 'relative', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
        <button onClick={() => router.push('/settings')} style={{ position: 'absolute', top: '24px', right: '24px', background: 'var(--bg-glass)', padding: '10px', borderRadius: '14px', border: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }} className="hover-scale">
          <Settings size={20} />
        </button>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Avatar with Camera Overlay */}
          <div style={{ position: 'relative' }}>
            <div style={{ 
              width: '140px', height: '140px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              padding: '4px', boxShadow: '0 10px 30px rgba(138, 43, 226, 0.3)'
            }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-secondary)' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: '900', color: 'var(--text-primary)' }}>
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button onClick={() => setShowEdit(true)} style={{ position: 'absolute', bottom: '8px', right: '8px', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent-primary)', border: '3px solid var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }} className="hover-scale">
              <Camera size={16} />
            </button>
          </div>

          {/* User Info */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.03em', margin: 0 }}>{displayName}</h1>
              <CheckCircle2 size={24} style={{ color: '#8b5cf6' }} fill="#8b5cf6" />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '16px', fontWeight: '500' }}>@{username}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              {profile?.bio ? (
                <p style={{ fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>{profile.bio}</p>
              ) : (
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>No bio yet</p>
              )}
              <button onClick={() => setShowEdit(true)} style={{ color: 'var(--text-muted)' }}><Edit2 size={14} /></button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'rgba(139,92,246,0.1)', borderRadius: '12px', color: '#8b5cf6', fontSize: '0.85rem', fontWeight: '700', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Crown size={14} /> Creator
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'var(--bg-glass)', borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '700', border: '1px solid var(--border-light)' }}>
                <Calendar size={14} /> Member since {joinDate}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowEdit(true)} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Edit2 size={18} /> Edit Profile
              </button>
              <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="btn-secondary" style={{ padding: '12px 32px', borderRadius: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Share2 size={18} /> Share Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="glass-card" style={{ padding: '32px', borderRadius: '32px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', textAlign: 'center', border: '1px solid var(--border-light)' }}>
        <div>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <FileText size={24} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>{posts.length}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Posts</div>
        </div>
        <div onClick={() => setShowFollows({ type: 'followers', userId: user.id })} style={{ cursor: 'pointer' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <User size={24} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>{profile?.followers_count || 0}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Followers</div>
        </div>
        <div onClick={() => setShowFollows({ type: 'following', userId: user.id })} style={{ cursor: 'pointer' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Users size={24} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>{profile?.following_count || 0}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Following</div>
        </div>
        <div>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(236,72,153,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <Heart size={24} color="#ec4899" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900' }}>{totalLikes}</div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Likes</div>
        </div>
      </div>

      {/* Creator Earnings Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
        borderRadius: '32px', padding: '32px', marginBottom: '40px',
        position: 'relative', overflow: 'hidden', border: '1px solid rgba(139,92,246,0.3)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1rem', fontWeight: '600', marginBottom: '8px' }}>Creator Earnings</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <h2 style={{ fontSize: '3rem', fontWeight: '900', margin: 0 }} className="text-gradient">${totalEarnings.toFixed(2)}</h2>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginTop: '4px' }}>Total tips received</p>
        </div>

        {/* Wavy Line Visualization */}
        <div style={{ position: 'absolute', right: '120px', bottom: '40px', width: '200px', height: '80px', opacity: 0.3 }}>
          <svg width="100%" height="100%" viewBox="0 0 100 40">
            <path d="M0,35 Q15,35 25,25 T50,20 T75,10 T100,15" fill="none" stroke="var(--accent-secondary)" strokeWidth="2" />
            <circle cx="25" cy="25" r="1.5" fill="var(--accent-secondary)" />
            <circle cx="50" cy="20" r="1.5" fill="var(--accent-secondary)" />
            <circle cx="75" cy="10" r="1.5" fill="var(--accent-secondary)" />
            <circle cx="100" cy="15" r="1.5" fill="var(--accent-secondary)" />
          </svg>
        </div>

        <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2, boxShadow: '0 10px 20px rgba(0,0,0,0.3)' }}>
          <DollarSign size={36} color="white" />
        </div>
      </div>

      {/* Creator Studio Section */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Layout size={24} style={{ color: '#8b5cf6' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>Creator Studio</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { title: 'Analytics', desc: 'Track your performance and audience insights', icon: BarChart2, color: '#06b6d4', href: '/analytics' },
            { title: 'Studio', desc: 'Create and manage your content', icon: Video, color: '#8b5cf6', href: '/studio' },
            { title: 'Monetize', desc: 'Manage earnings and tips', icon: DollarSign, color: '#10b981', href: '/monetize' },
          ].map((tool) => (
            <a key={tool.title} href={tool.href} className="glass-card" style={{ padding: '24px', borderRadius: '24px', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--border-light)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${tool.color}11`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <tool.icon size={28} style={{ color: tool.color }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '4px' }}>{tool.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>{tool.desc}</p>
              </div>
              <ChevronRight size={20} style={{ color: 'var(--text-muted)', marginTop: 'auto' }} />
            </a>
          ))}
        </div>
      </div>

      {/* Posts Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={24} style={{ color: '#06b6d4' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900' }}>Your Posts</h2>
          </div>
          <button onClick={() => router.push('/studio')} style={{ color: '#8b5cf6', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View all posts <ChevronRight size={18} />
          </button>
        </div>

        {posts.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {posts.map((post) => (
              <div 
                key={post.id}
                className="glass-card"
                style={{ padding: '20px', borderRadius: '24px', cursor: 'pointer', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '16px' }}
                onClick={() => router.push(`/post/${post.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                    {post.content ? (post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content) : 'Post Content'}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }} style={{ color: 'var(--text-muted)' }} className="hover-scale"><Trash2 size={16} /></button>
                </div>
                
                {post.media_urls?.[0] && (
                  <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
                    {post.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? (
                      <video src={post.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                      <Heart size={16} /> {post.like_count || 0}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                      <MessageCircle size={16} /> {post.comment_count || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderRadius: '32px' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <FileText size={40} color="var(--text-muted)" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>No posts yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Start sharing your premium content with the community.</p>
            <button onClick={() => router.push('/studio')} className="btn-primary">Create Your First Post</button>
          </div>
        )}
      </div>
    </div>
  );
}
