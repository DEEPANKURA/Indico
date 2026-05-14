'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Settings, Camera, DollarSign, BarChart2, Video, 
  Sparkles, Layout, Trash2, CheckCircle2, User, 
  Users, Heart, FileText, ChevronRight, Edit2, Share2, 
  Calendar, Crown, MessageCircle, Grid3x3, Bookmark, Play, Lock
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
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'reels' | 'exclusive'>('posts');
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
      supabase.from('posts').select('*, is_exclusive').eq('author_id', user.id).is('community_id', null).order('created_at', { ascending: false }),
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
    <div style={{ width: '100%', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="animate-spin"><Sparkles size={32} color="var(--accent-primary)" /></div>
    </div>
  );

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Creator';
  const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'user';
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);

  return (
    <div style={{ maxWidth: '935px', margin: '0 auto', padding: '0 0 80px 0' }}>
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

      {/* Top Navigation Bar (Mobile Style) */}
      <div style={{ 
        height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px', position: 'relative', borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-primary)'
      }}>
        <button onClick={() => router.push('/studio')} style={{ position: 'absolute', left: '16px', color: 'var(--text-primary)' }}>
          <Video size={22} />
        </button>
        <div style={{ fontWeight: '700', fontSize: '1rem' }}>{username}</div>
        <button onClick={() => router.push('/settings')} style={{ position: 'absolute', right: '16px', color: 'var(--text-primary)' }}>
          <Settings size={22} />
        </button>
      </div>

      {/* Header Section (Instagram Style) */}
      <div style={{ padding: '16px 16px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          {/* Avatar */}
          <div style={{ marginRight: '28px', position: 'relative' }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              padding: '3px', position: 'relative'
            }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-primary)' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: '900' }}>
                  {displayName[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <button onClick={() => setShowEdit(true)} style={{ position: 'absolute', bottom: '0', right: '0', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-primary)', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Camera size={12} />
            </button>
          </div>

          {/* Stats Bar */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{posts.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Posts</div>
            </div>
            <div onClick={() => setShowFollows({ type: 'followers', userId: user.id })} style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{profile?.followers_count || 0}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Followers</div>
            </div>
            <div onClick={() => setShowFollows({ type: 'following', userId: user.id })} style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{profile?.following_count || 0}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Following</div>
            </div>
          </div>
        </div>

        {/* User Bio */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
            <span style={{ fontWeight: '700' }}>{displayName}</span>
            <CheckCircle2 size={14} style={{ color: '#8b5cf6' }} fill="#8b5cf6" />
            <div style={{ marginLeft: '4px', padding: '2px 6px', background: 'rgba(139,92,246,0.1)', borderRadius: '4px', color: '#8b5cf6', fontSize: '0.7rem', fontWeight: '700' }}>Creator</div>
          </div>
          <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
            {profile?.bio || 'Add a bio to your profile'}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button onClick={() => setShowEdit(true)} style={{ flex: 1, height: '32px', background: 'var(--bg-glass)', border: '1px solid var(--border-light)', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
            Edit Profile
          </button>
          <button onClick={() => router.push('/upload?exclusive=true')} style={{ flex: 1, height: '32px', background: 'rgba(138,43,226,0.1)', border: '1px solid var(--accent-primary)', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
            Upload Exclusive
          </button>
        </div>

        {/* Analytics Dashboard (Instagram Style) */}
        <div 
          onClick={() => router.push('/analytics')}
          style={{ 
            background: 'var(--bg-glass)', borderRadius: '12px', padding: '12px', border: '1px solid var(--border-light)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6,182,212,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={18} color="#06b6d4" />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700' }}>Analytics Dashboard</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>${totalEarnings.toFixed(2)} earned this month</div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
      </div>

      {/* Highlights Placeholder (Optional) */}
      <div style={{ display: 'flex', gap: '16px', padding: '0 16px 20px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px solid var(--border-light)', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={24} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '0.7rem', marginTop: '4px', color: 'var(--text-secondary)' }}>Highlight</div>
          </div>
        ))}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '24px' }}>+</span>
          </div>
          <div style={{ fontSize: '0.7rem', marginTop: '4px', color: 'var(--text-secondary)' }}>New</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
        {[
          { id: 'posts', icon: Grid3x3 },
          { id: 'reels', icon: Play },
          { id: 'exclusive', icon: Lock },
          { id: 'saved', icon: Bookmark },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{ 
              flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderTop: activeTab === tab.id ? '1.5px solid var(--text-primary)' : 'none',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            <tab.icon size={22} />
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px' }}>
        {(activeTab === 'posts' 
            ? posts.filter(p => !p.is_exclusive) 
            : activeTab === 'exclusive' 
              ? posts.filter(p => p.is_exclusive)
              : activeTab === 'reels'
                ? posts.filter(p => typeof p.media_urls?.[0] === 'string' && p.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/))
                : [] // saved tab not implemented yet
          ).length > 0 ? (
          (activeTab === 'posts' 
            ? posts.filter(p => !p.is_exclusive) 
            : activeTab === 'exclusive' 
              ? posts.filter(p => p.is_exclusive)
              : activeTab === 'reels'
                ? posts.filter(p => typeof p.media_urls?.[0] === 'string' && p.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/))
                : []
          ).map((post) => (
            <div 
              key={post.id}
              onClick={() => router.push(`/post/${post.id}`)}
              style={{ 
                aspectRatio: '1/1', background: 'var(--bg-secondary)', 
                position: 'relative', overflow: 'hidden', cursor: 'pointer' 
              }}
            >
              {post.media_urls?.[0] ? (
                typeof post.media_urls[0] === 'string' && post.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? (
                  <>
                    <video src={post.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}><Play size={14} color="white" fill="white" /></div>
                  </>
                ) : (
                  <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )
              ) : (
                <div style={{ padding: '8px', fontSize: '0.7rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  {post.content?.substring(0, 40)}...
                </div>
              )}
              {post.is_exclusive && (
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--accent-secondary)', padding: '4px', borderRadius: '50%', color: 'white' }}>
                  <Lock size={12} />
                </div>
              )}
              {post.moderation_status === 'pending' && (
                <div style={{ 
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.6rem', color: 'white', fontWeight: 'bold', gap: '4px', zIndex: 5
                }}>
                  <div className="animate-spin" style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
                  MODERATING
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={{ gridColumn: 'span 3', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              {activeTab === 'exclusive' ? <Lock size={40} /> : <Camera size={40} />}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>
              {activeTab === 'exclusive' ? 'No Exclusive Content' : activeTab === 'reels' ? 'No Reels Yet' : 'No Posts Yet'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {activeTab === 'exclusive' ? 'Unlock monetization by uploading exclusive content for your subscribers.' : 'When you share photos or videos, they\'ll appear on your profile.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
