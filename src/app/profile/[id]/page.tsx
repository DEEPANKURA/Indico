'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Grid3x3, Heart, MessageCircle, DollarSign, Camera, ArrowLeft } from 'lucide-react';
import { toggleFollowAction } from '@/app/actions/social';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.id === userId) {
        router.replace('/profile');
        return;
      }

      const [{ data: profileData }, { data: postsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('posts').select('id, content, like_count, comment_count, created_at, media_urls').eq('author_id', userId).order('created_at', { ascending: false }),
      ]);

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setFollowerCount(profileData.followers_count || 0);
      setPosts(postsData || []);

      if (user) {
        const { data: followData } = await supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).single();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    };
    fetchData();
  }, [userId, router]);

  if (loading) return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      Loading profile...
    </div>
  );

  if (!profile) return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      User not found.
    </div>
  );

  const displayName = profile.full_name || 'Creator';
  const username = profile.username || 'user';
  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);

  const handleFollow = async () => {
    setIsTogglingFollow(true);
    const res = await toggleFollowAction(userId);
    setIsTogglingFollow(false);
    if (res.success) {
      setIsFollowing(res.following!);
      setFollowerCount(prev => res.following ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {/* Back button */}
      <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
        <ArrowLeft size={20} /> Back
      </button>

      {/* Profile Header */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: '20px', marginBottom: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {profile.avatar_url ? (
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
          </div>

          <div style={{ flex: 1, minWidth: '0' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '2px' }}>{displayName}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>@{username}</p>
            {profile.bio
              ? <p style={{ fontSize: '0.9rem', marginBottom: '12px', lineHeight: '1.5' }}>{profile.bio}</p>
              : <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', fontStyle: 'italic' }}>No bio yet</p>
            }
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', marginBottom: '12px', display: 'block' }}>
                🔗 {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button 
                onClick={handleFollow} 
                disabled={isTogglingFollow}
                className={isFollowing ? "btn-secondary" : "btn-primary"} 
                style={{ padding: '7px 24px', fontSize: '0.9rem', width: '120px' }}>
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
          {[
            { label: 'Posts', value: posts.length },
            { label: 'Followers', value: followerCount },
            { label: 'Following', value: profile.following_count || 0 },
            { label: 'Likes', value: totalLikes },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{stat.value.toLocaleString()}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Grid3x3 size={20} style={{ color: 'var(--accent-secondary)' }} />
          <h2 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Posts</h2>
        </div>
        {posts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {posts.map((post) => (
              <div key={post.id} className="glass-card" style={{ padding: '16px', borderRadius: '14px' }}>
                {post.media_urls?.[0] && (
                  <div style={{ marginBottom: '12px', borderRadius: '10px', overflow: 'hidden' }}>
                    <img src={post.media_urls[0]} alt="" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                  </div>
                )}
                <p style={{ marginBottom: '12px', lineHeight: '1.6', fontSize: '0.95rem' }}>{post.content}</p>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={14} /> {post.like_count || 0}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MessageCircle size={14} /> {post.comment_count || 0}</span>
                  <span style={{ marginLeft: 'auto' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
