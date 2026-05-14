'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useParams, useRouter } from 'next/navigation';
import { Grid3x3, Heart, MessageCircle, DollarSign, Camera, ArrowLeft, Music, Lock, Loader2 } from 'lucide-react';
import { toggleFollowAction } from '@/app/actions/social';
import { createRazorpayOrderAction, verifyRazorpayPaymentAction } from '@/app/actions/monetize';
import FollowsModal from '@/components/FollowsModal';

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
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFollows, setShowFollows] = useState<{ type: 'followers' | 'following', userId: string } | null>(null);
  
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'exclusive'>('public');

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
      const { data: { user } } = await supabase.auth.getUser();

      if (user && user.id === userId) {
        router.replace('/profile');
        return;
      }

      const [{ data: profileData }, { data: postsData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('posts')
          .select('id, content, like_count, comment_count, created_at, media_urls, music_url, music_title, music_artist, is_exclusive, moderation_status')
          .eq('author_id', userId)
          .eq('moderation_status', 'approved')
          .is('community_id', null)
          .order('created_at', { ascending: false }),
      ]);

      if (!profileData) {
        setLoading(false);
        return;
      }

      setProfile(profileData);
      setFollowerCount(profileData.followers_count || 0);
      setPosts(postsData || []);

      if (user) {
        const [{ data: followData }, { data: subData }] = await Promise.all([
          supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', userId).single(),
          supabase.from('subscriptions').select('id').eq('subscriber_id', user.id).eq('creator_id', userId).is('community_id', null).eq('status', 'active').maybeSingle()
        ]);
        
        setIsFollowing(!!followData);
        setIsSubscribed(!!subData);
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
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {showFollows && (
        <FollowsModal
          type={showFollows.type}
          userId={showFollows.userId}
          onClose={() => setShowFollows(null)}
        />
      )}
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
              
              {profile.profile_subscription_price > 0 && !isSubscribed && (
                <button 
                  onClick={handleSubscribeClick}
                  className="btn-primary" 
                  style={{ padding: '7px 16px', fontSize: '0.9rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                >
                  ⭐ Subscribe (₹{profile.profile_subscription_price})
                </button>
              )}
              {profile.profile_subscription_price > 0 && isSubscribed && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 16px', fontSize: '0.9rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '12px', fontWeight: '700', border: '1px solid rgba(16,185,129,0.2)' }}>
                  ⭐ Subscribed
                </span>
              )}
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
            onClick={() => setShowFollows({ type: 'followers', userId: userId })}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{followerCount.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Followers</div>
          </div>
          <div 
            style={{ textAlign: 'center', cursor: 'pointer' }} 
            onClick={() => setShowFollows({ type: 'following', userId: userId })}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{(profile.following_count || 0).toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Following</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '800' }}>{totalLikes.toLocaleString()}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Likes</div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '16px' }}>
          <button 
            onClick={() => setActiveTab('public')}
            style={{ 
              flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: '700', color: activeTab === 'public' ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'public' ? '2px solid var(--text-primary)' : '2px solid transparent'
            }}
          >
            Public ({publicPosts.length})
          </button>
          {profile.profile_subscription_price > 0 && (
            <button 
              onClick={() => setActiveTab('exclusive')}
              style={{ 
                flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
                fontWeight: '700', color: activeTab === 'exclusive' ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'exclusive' ? '2px solid var(--accent-secondary)' : '2px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              ⭐ Exclusive ({exclusivePosts.length})
            </button>
          )}
        </div>
        
        {activeTab === 'exclusive' && !isSubscribed ? (
          <div className="glass-card" style={{ padding: '48px', textAlign: 'center', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(138,43,226,0.1), rgba(0,255,255,0.05))', border: '1px solid var(--accent-secondary)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(138,43,226,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent-secondary)' }}>
              <Lock size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>Exclusive Content</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Subscribe to {displayName} to view {exclusivePosts.length} exclusive posts.</p>
            <button 
              onClick={handleSubscribeClick}
              className="btn-primary" 
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', padding: '10px 24px' }}
            >
              Subscribe for ₹{profile.profile_subscription_price}/month
            </button>
          </div>
        ) : (
          visiblePosts.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '4px',
              marginBottom: '40px'
            }}>
              {visiblePosts.map((post) => (
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
                    typeof post.media_urls[0] === 'string' && post.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? (
                      <video src={post.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )
                  ) : (
                    <div style={{ padding: '8px', fontSize: '0.75rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {post.content.substring(0, 50)}...
                    </div>
                  )}

                  {post.music_url && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                      <Music size={14} color="white" />
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
              <p style={{ color: 'var(--text-secondary)' }}>No {activeTab} posts yet.</p>
            </div>
          )
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
              maxHeight: isMobile ? '40vh' : 'none', position: 'relative'
            }}>
              {selectedPost.media_urls?.[0] ? (
                typeof selectedPost.media_urls[0] === 'string' && selectedPost.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? (
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
                  {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : profile.username[0].toUpperCase()}
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{profile.username}</div>
              </div>
              
              <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.5' }}>{selectedPost.content}</p>
                <div style={{ marginTop: '12px' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>{new Date(selectedPost.created_at).toLocaleDateString()}</div>
                  
                  {selectedPost.music_url && (
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                      background: 'rgba(var(--accent-primary-rgb), 0.05)', borderRadius: '12px',
                      marginBottom: '16px'
                    }}>
                      <Music size={16} color="var(--accent-primary)" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedPost.music_title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{selectedPost.music_artist}</div>
                      </div>
                      <audio autoPlay src={selectedPost.music_url} loop />
                    </div>
                  )}
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
