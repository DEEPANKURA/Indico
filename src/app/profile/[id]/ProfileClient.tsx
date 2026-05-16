'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Grid3x3, Heart, MessageCircle, DollarSign, Camera, ArrowLeft, Music, Lock, Loader2, ShieldCheck, Play, CheckCircle2, Sparkles } from 'lucide-react';
import { toggleFollowAction } from '@/app/actions/social';
import { createRazorpayOrderAction, verifyRazorpayPaymentAction } from '@/app/actions/monetize';
import FollowsModal from '@/components/FollowsModal';
import PostCard from '@/components/PostCard';

export default function ProfileClient({ 
  params,
  initialProfile,
  initialPosts,
  initialIsFollowing = false,
  initialIsSubscribed = false
}: { 
  params: { id: string },
  initialProfile?: any,
  initialPosts?: any[],
  initialIsFollowing?: boolean,
  initialIsSubscribed?: boolean
}) {
  const router = useRouter();
  const userId = params.id;
  const supabase = createClient();

  const [profile, setProfile] = useState<any>(initialProfile || null);
  const [posts, setPosts] = useState<any[]>(initialPosts || []);
  const [loading, setLoading] = useState(!initialProfile);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [followerCount, setFollowerCount] = useState(initialProfile?.followers_count || 0);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFollows, setShowFollows] = useState<{ type: 'followers' | 'following', userId: string } | null>(null);
  
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [activeTab, setActiveTab] = useState<'public' | 'exclusive' | 'reels'>('public');

  // Checkout modal
  const [rzpModal, setRzpModal] = useState<{
    show: boolean;
    amount: number;
    orderId?: string;
    processing: boolean;
    step: 'options' | 'success';
  }>({
    show: false,
    amount: 0,
    processing: false,
    step: 'options'
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // If we already have initial data, we don't need to block rendering, 
      // but we might want to refresh it in the background if it's stale.
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) console.error('[Profile] Auth error:', userError);

        if (user && user.id === userId) {
          router.replace('/profile');
          return;
        }

        const [{ data: profileData, error: profError }, { data: postsData, error: postsError }] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', userId).single(),
          supabase.from('posts')
            .select('id, content, like_count, comment_count, created_at, media_urls, music_url, music_title, music_artist, music_start_time, music_volume, video_volume, video_trim_start, video_trim_end, is_exclusive, is_encrypted, moderation_status')
            .eq('author_id', userId)
            .eq('moderation_status', 'approved')
            .is('community_id', null)
            .order('created_at', { ascending: false }),
        ]);

        if (profError && profError.code !== 'PGRST116') throw profError;
        if (postsError) console.error('[Profile] Posts fetch error:', postsError);

        if (!profileData) {
          setProfile(null);
          setLoading(false);
          return;
        }

        setProfile(profileData);
        setFollowerCount(profileData.followers_count || 0);
        setPosts(postsData || []);

        if (user) {
          try {
            const [followRes, subRes] = await Promise.all([
              supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).single(),
              supabase.from('subscriptions').select('id').eq('subscriber_id', user.id).eq('creator_id', userId).is('community_id', null).eq('status', 'active').single()
            ]);
            
            if (followRes.error && followRes.error.code !== 'PGRST116') console.error(followRes.error);
            if (subRes.error && subRes.error.code !== 'PGRST116') console.error(subRes.error);

            setIsFollowing(!!followRes.data);
            setIsSubscribed(!!subRes.data);
          } catch (innerError) {
            console.error('[Profile] Interaction data error:', innerError);
          }
        }
      } catch (err) {
        console.error('[Profile] Critical fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    // If we have initial profile, we can fetch in background
    if (!initialProfile) {
      fetchData();
    } else {
      // Just check auth/interaction in background
      const refreshInteractions = async () => {
         const { data: { user } } = await supabase.auth.getUser();
         if (user && user.id !== userId) {
            const [followRes, subRes] = await Promise.all([
              supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).single(),
              supabase.from('subscriptions').select('id').eq('subscriber_id', user.id).eq('creator_id', userId).is('community_id', null).eq('status', 'active').single()
            ]);
            setIsFollowing(!!followRes.data);
            setIsSubscribed(!!subRes.data);
         }
      };
      refreshInteractions();
    }

    // Live sync for profile updates (followers, new posts)
    const channel = supabase
      .channel(`profile_${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      const nowFollowing = !!res.following;
      setIsFollowing(nowFollowing);
      setFollowerCount(prev => nowFollowing ? prev + 1 : Math.max(0, prev - 1));
    }
  };

  const handleSubscribeClick = async () => {
    const amount = profile.profile_subscription_price || 0;
    if (amount <= 0) return;
    const orderRes = await createRazorpayOrderAction(amount, 'subscribe_profile', userId);
    if (orderRes.success) {
      setRzpModal({
        show: true,
        amount,
        orderId: orderRes.orderId,
        processing: false,
        step: 'options'
      });
    } else {
      alert('Failed to initialize subscription checkout: ' + orderRes.error);
    }
  };

  const processPayment = async () => {
    if (!rzpModal.orderId) return;
    setRzpModal(prev => ({ ...prev, processing: true }));
    await new Promise(r => setTimeout(r, 1500));
    const verifyRes = await verifyRazorpayPaymentAction(rzpModal.orderId, 'pay_mock_' + Date.now());
    if (verifyRes.success) {
      setRzpModal(prev => ({ ...prev, step: 'success', processing: false }));
      setIsSubscribed(true);
    } else {
      alert('Payment failed: ' + verifyRes.error);
      setRzpModal(prev => ({ ...prev, show: false }));
    }
  };

  const publicPosts = posts.filter(p => !p.is_exclusive);
  const exclusivePosts = posts.filter(p => p.is_exclusive);
  const visiblePosts = activeTab === 'public' ? publicPosts : exclusivePosts;

  return (
    <div style={{ maxWidth: '935px', margin: '0 auto', padding: '0 0 80px 0' }}>
      {showFollows && (
        <FollowsModal
          type={showFollows.type}
          userId={showFollows.userId}
          onClose={() => setShowFollows(null)}
        />
      )}

      {/* Top Navigation Bar */}
      <div style={{ 
        height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px', position: 'relative', borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-primary)'
      }}>
        <button onClick={() => router.back()} style={{ position: 'absolute', left: '16px', color: 'var(--text-primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ fontWeight: '700', fontSize: '1rem' }}>{username}</div>
      </div>

      {/* Header Section */}
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
          </div>

          {/* Stats Bar */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{posts.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Posts</div>
            </div>
            <div onClick={() => setShowFollows({ type: 'followers', userId: userId })} style={{ cursor: 'pointer' }}>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{followerCount}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Followers</div>
            </div>
            <div onClick={() => setShowFollows({ type: 'following', userId: userId })} style={{ cursor: 'pointer' }}>
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
            {profile?.bio || 'No bio yet'}
          </div>
          {profile?.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', display: 'block', marginTop: '4px' }}>
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button 
            onClick={handleFollow} 
            disabled={isTogglingFollow}
            style={{ 
              flex: 1, height: '32px', 
              background: isFollowing ? 'var(--bg-glass)' : 'var(--accent-primary)', 
              color: isFollowing ? 'var(--text-primary)' : 'white',
              border: isFollowing ? '1px solid var(--border-light)' : 'none', 
              borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
          
          <button 
            onClick={() => router.push(`/messages?user=${userId}`)}
            style={{ flex: 1, height: '32px', background: 'var(--bg-glass)', border: '1px solid var(--border-light)', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--text-primary)' }}
          >
            Message
          </button>

          {profile.profile_subscription_price > 0 && (
            <button 
              onClick={handleSubscribeClick}
              disabled={isSubscribed}
              style={{ 
                flex: 1, height: '32px', 
                background: isSubscribed ? 'rgba(16,185,129,0.1)' : 'rgba(138,43,226,0.1)', 
                border: isSubscribed ? '1px solid rgba(16,185,129,0.2)' : '1px solid var(--accent-primary)', 
                borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem', 
                color: isSubscribed ? '#10b981' : 'var(--accent-primary)',
                cursor: isSubscribed ? 'default' : 'pointer'
              }}
            >
              {isSubscribed ? 'Subscribed' : `Subscribe (₹${profile.profile_subscription_price})`}
            </button>
          )}
        </div>
      </div>

      {/* Highlights Placeholder */}
      <div style={{ display: 'flex', gap: '16px', padding: '0 16px 20px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', border: '1px solid var(--border-light)', background: 'var(--bg-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={24} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: '0.7rem', marginTop: '4px', color: 'var(--text-secondary)' }}>Highlight</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)' }}>
        {[
          { id: 'public', icon: Grid3x3 },
          { id: 'reels', icon: Play },
          { id: 'exclusive', icon: Lock },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{ 
              flex: 1, height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderTop: activeTab === tab.id ? '1.5px solid var(--text-primary)' : 'none',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              background: 'none', border: 'none', cursor: 'pointer'
            }}
          >
            <tab.icon size={22} />
          </button>
        ))}
      </div>

      {/* Posts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px' }}>
        {(activeTab === 'public' 
            ? posts.filter(p => !p.is_exclusive) 
            : activeTab === 'exclusive' 
              ? (isSubscribed ? posts.filter(p => p.is_exclusive) : [])
              : activeTab === 'reels'
                ? posts.filter(p => typeof p.media_urls?.[0] === 'string' && p.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/))
                : []
          ).length > 0 ? (
          (activeTab === 'public' 
            ? posts.filter(p => !p.is_exclusive) 
            : activeTab === 'exclusive' 
              ? (isSubscribed ? posts.filter(p => p.is_exclusive) : [])
              : activeTab === 'reels'
                ? posts.filter(p => typeof p.media_urls?.[0] === 'string' && p.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/))
                : []
          ).map((post) => (
            <div 
              key={post.id}
              onClick={() => setSelectedPost(post)}
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
              {post.is_encrypted && (
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--accent-primary)', padding: '4px', borderRadius: '50%', color: 'white', zIndex: 10 }}>
                  <ShieldCheck size={12} />
                </div>
              )}
              {post.is_exclusive && !post.is_encrypted && (
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'var(--accent-secondary)', padding: '4px', borderRadius: '50%', color: 'white', zIndex: 10 }}>
                  <Lock size={12} />
                </div>
              )}
            </div>
          ))
        ) : (
          !(activeTab === 'exclusive' && !isSubscribed) && (
            <div style={{ gridColumn: 'span 3', padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                {activeTab === 'exclusive' ? <Lock size={40} /> : <Camera size={40} />}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                {activeTab === 'exclusive' ? 'No Exclusive Content' : activeTab === 'reels' ? 'No Reels Yet' : 'No Posts Yet'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {activeTab === 'exclusive' ? 'Subscribe to see exclusive content from this creator.' : 'This creator hasn\'t posted anything yet.'}
              </p>
            </div>
          )
        )}
      </div>

      {activeTab === 'exclusive' && !isSubscribed && posts.filter(p => p.is_exclusive).length > 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-glass)', marginTop: '1px' }}>
           <Lock size={32} style={{ marginBottom: '16px', color: 'var(--accent-secondary)' }} />
           <h3 style={{ fontWeight: '800', marginBottom: '8px' }}>Subscribers Only</h3>
           <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>Subscribe to unlock {posts.filter(p => p.is_exclusive).length} exclusive posts.</p>
           <button onClick={handleSubscribeClick} className="btn-primary" style={{ padding: '10px 24px' }}>
              Subscribe for ₹{profile.profile_subscription_price}/month
           </button>
        </div>
      )}


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
            <PostCard 
              post={{
                id: selectedPost.id,
                authorId: userId,
                author: {
                  name: displayName,
                  handle: `@${username}`,
                  avatar: profile.avatar_url || '',
                  isNew: false
                },
                content: selectedPost.content,
                mediaUrl: selectedPost.media_urls?.[0],
                mediaType: typeof selectedPost.media_urls?.[0] === 'string' && selectedPost.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? 'video' : 'image',
                likes: selectedPost.like_count || 0,
                comments: selectedPost.comment_count || 0,
                shares: 0,
                tags: [],
                mentions: [],
                timeAgo: new Date(selectedPost.created_at).toLocaleDateString(),
                musicUrl: selectedPost.music_url,
                musicTitle: selectedPost.music_title,
                musicArtist: selectedPost.music_artist,
                musicStartTime: selectedPost.music_start_time,
                musicVolume: selectedPost.music_volume,
                videoVolume: selectedPost.video_volume,
                videoTrimStart: selectedPost.video_trim_start,
                videoTrimEnd: selectedPost.video_trim_end,
                isEncrypted: selectedPost.is_encrypted,
                isExclusive: selectedPost.is_exclusive,
                isSubscribed: isSubscribed,
                currentUserId: undefined // Allow PostCard to fetch/handle
              }} 
            />
          </div>
        </div>
      )}

      {/* Simulated Premium Razorpay Gateway Dialog Overlay */}
      {rzpModal.show && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%', maxWidth: '440px', padding: '0', borderRadius: '24px', overflow: 'hidden',
            border: '1px solid rgba(59,130,246,0.4)', background: '#0f172a',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            {/* Razorpay branded header */}
            <div style={{ background: 'linear-gradient(90deg, #0284c7, #2563eb)', padding: '20px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, display: 'block', fontWeight: '700' }}>Secured Gateway</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Razorpay Checkout</span>
              </div>
            </div>

            <div style={{ padding: '28px 24px' }}>
              {rzpModal.step === 'options' ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Payable Amount</span>
                    <div style={{ fontSize: '2.5rem', fontWeight: '900', color: '#fff', marginTop: '2px' }}>
                      ₹{rzpModal.amount}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'block', marginTop: '4px' }}>Profile Subscription</span>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => setRzpModal(prev => ({ ...prev, show: false }))} 
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '12px' }}
                      disabled={rzpModal.processing}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={processPayment} 
                      className="btn-primary" 
                      style={{ flex: 2, padding: '12px', background: 'linear-gradient(90deg, #0284c7, #2563eb)' }}
                      disabled={rzpModal.processing}
                    >
                      {rzpModal.processing ? <Loader2 className="animate-spin" size={18} /> : `Authorize Pay ₹${rzpModal.amount}`}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981' }}>
                    <Lock size={36} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Payment Successful!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    You now have access to exclusive content.
                  </p>
                  <button 
                    onClick={() => setRzpModal(prev => ({ ...prev, show: false }))} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '12px', background: '#10b981' }}
                  >
                    View Exclusive Content
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
