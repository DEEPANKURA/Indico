'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
  joinCommunityAction,
  leaveCommunityAction,
  getPendingRequestsAction,
  handleJoinRequestAction,
  getFollowingListForInviteAction,
  inviteToCommunityAction,
  deleteCommunityAction,
  kickMemberAction,
  setMemberRoleAction
} from '@/app/actions/communities';
import {
  createRazorpayOrderAction,
  verifyRazorpayPaymentAction
} from '@/app/actions/monetize';
import {
  Users, Globe, Lock, ArrowLeft, Loader2, MessageSquare,
  Shield, Settings, Info, Check, X, UserPlus,
  LogOut, ShieldCheck, Mail, UserMinus
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import CommunityChat from '@/components/CommunityChat';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  full_name: string | null;
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean | null;
  color: string | null;
  subscription_price?: number | null;
  member_count: number | null;
  creator_id: string;
  created_at: string | null;
  creator?: {
    username: string;
    avatar_url: string | null;
  };
}

interface Member {
  user_id: string;
  status: 'pending' | 'joined' | 'invited' | 'rejected' | 'none' | null;
  role: 'owner' | 'moderator' | 'member' | null;
  profiles: Profile | null;
}

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<'joined' | 'pending' | 'invited' | 'rejected' | 'none'>('none');
  const [userRole, setUserRole] = useState<'owner' | 'moderator' | 'member' | null>(null);
  const [activeTab, setActiveTab] = useState('Feed');
  const [user, setUser] = useState<any>(null);
  const [pendingRequests, setPendingRequests] = useState<Member[]>([]);
  const [inviteList, setInviteList] = useState<Profile[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showRzpModal, setShowRzpModal] = useState(false);
  const [rzpProcessing, setRzpProcessing] = useState(false);
  const [rzpSuccess, setRzpSuccess] = useState(false);
  const [rzpOrderId, setRzpOrderId] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      // Fetch community details
      const { data: commData } = await supabase
        .from('communities')
        .select('*, creator:profiles!communities_creator_id_fkey(username, avatar_url)')
        .eq('id', id)
        .single();

      if (!commData) {
        router.push('/communities');
        return;
      }

      setCommunity(commData);

      // Fetch members
      const { data: memData } = await supabase
        .from('community_members')
        .select('user_id, status, role, profiles(username, avatar_url, full_name)')
        .eq('community_id', id);

      const castMembers = (memData as unknown as Member[]) || [];
      setMembers(castMembers);

      const currentMember = castMembers.find(m => m.user_id === currentUser?.id);
      if (currentMember) {
        setIsMember(currentMember.status === 'joined');
        setMembershipStatus(currentMember.status as any);
        setUserRole(currentMember.role);
      } else {
        setIsMember(false);
        setMembershipStatus('none');
        setUserRole(null);
      }

      // If owner/moderator, fetch pending requests
      const role = currentMember?.role;
      if (role === 'owner' || role === 'moderator' || commData.creator_id === currentUser?.id) {
        const { data: reqData } = await supabase
          .from('community_members')
          .select('*, profiles(username, avatar_url, full_name)')
          .eq('community_id', id)
          .eq('status', 'pending');
        setPendingRequests((reqData as unknown as Member[]) || []);

        // Also fetch inviteable users
        const inviteRes = await getFollowingListForInviteAction(id);
        if (inviteRes.success) {
          setInviteList(inviteRes.users as Profile[]);
        }
      }

      // Fetch posts
      const { data: postData } = await supabase
        .from('posts')
        .select('*, author:profiles(username, avatar_url)')
        .eq('community_id', id)
        .order('created_at', { ascending: false });

      const mappedPosts = postData?.map((p: any) => ({
        ...p,
        author: {
          name: p.author?.username || 'Anonymous',
          handle: `@${p.author?.username || 'anon'}`,
          avatar: p.author?.avatar_url || '',
          isNew: false
        },
        authorId: p.author_id,
        likes: (p.like_count || 0).toLocaleString(),
        comments: (p.comment_count || 0).toLocaleString(),
        shares: '0',
        tags: p.tags || [],
        mentions: p.mentions || [],
        overlays: p.overlays || undefined,
        timeAgo: new Date(p.created_at).toLocaleDateString(),
        mediaUrl: p.media_urls?.[0],
        mediaType: typeof p.media_urls?.[0] === 'string' && p.media_urls[0].match(/\.(mp4|webm|ogg|mov)/i) ? 'video' : 'image',
        musicUrl: p.music_url,
        musicTitle: p.music_title,
        musicArtist: p.music_artist,
        musicStartTime: p.music_start_time,
        musicVolume: p.music_volume,
        videoVolume: p.video_volume,
        videoTrimStart: p.video_trim_start,
        videoTrimEnd: p.video_trim_end,
      })) || [];

      setPosts(mappedPosts);
    } catch (err) {
      console.error('Error fetching community data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [id]);

  const handleJoinLeave = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    if (isMember) {
      const res = await leaveCommunityAction(id);
      if (res.success) fetchCommunityData();
    } else {
      const res = await joinCommunityAction(id);
      if (res.success) fetchCommunityData();
    }
  };

  const handleAcceptDecline = async (userId: string, accept: boolean) => {
    const res = await handleJoinRequestAction(id, userId, accept);
    if (res.success) fetchCommunityData();
  };

  const handleInvite = async (userId: string) => {
    const res = await inviteToCommunityAction(id as string, userId);
    if (res.success) {
      fetchCommunityData();
      setInviteList(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleKick = async (userId: string) => {
    if (!confirm('Are you sure you want to kick this member?')) return;
    const res = await kickMemberAction(id, userId);
    if (res.success) fetchCommunityData();
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'moderator' ? 'member' : 'moderator';
    const res = await setMemberRoleAction(id, userId, nextRole);
    if (res.success) fetchCommunityData();
  };

  const startSubscribeCheckout = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    const price = community?.subscription_price || 0;
    const res = await createRazorpayOrderAction(price, 'subscribe_community', id);
    if (res.success) {
      setRzpOrderId(res.orderId || null);
      setRzpSuccess(false);
      setShowRzpModal(true);
    } else {
      alert('Error initiating checkout: ' + res.error);
    }
  };

  const processSubscribePayment = async () => {
    if (!rzpOrderId) return;
    setRzpProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    const res = await verifyRazorpayPaymentAction(rzpOrderId, 'pay_comm_' + Date.now());
    if (res.success) {
      setRzpSuccess(true);
      fetchCommunityData();
    } else {
      alert('Payment authorization failed: ' + res.error);
    }
    setRzpProcessing(false);
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this community? This cannot be undone.')) {
      const res = await deleteCommunityAction(id);
      if (res.success) router.push('/communities');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <Loader2 className="animate-spin" size={40} style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  if (!community) return null;

  const isOwner = userRole === 'owner' || community.creator_id === user?.id;
  const isMod = userRole === 'moderator' || isOwner;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      {/* Community Header */}
      <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ 
          height: '240px', 
          background: community.color || 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Users size={80} color="white" style={{ opacity: 0.3 }} />
        </div>
        
        <div style={{ padding: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900' }}>{community.name}</h1>
                {community.is_public ? <Globe size={18} style={{ color: 'var(--text-muted)' }} /> : <Lock size={18} style={{ color: 'var(--text-muted)' }} />}
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{community.description}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', fontWeight: '700' }}>
                  <Users size={16} />
                  <span>{community.member_count} members</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {isMod && (
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="hover-glass"
                  style={{ background: 'var(--bg-secondary)', border: 'none', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <UserPlus size={18} /> Invite
                </button>
              )}
              {membershipStatus === 'joined' ? (
                <button 
                  onClick={handleJoinLeave}
                  className="btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '12px', fontWeight: '800' }}
                >
                  <LogOut size={18} /> Leave
                </button>
              ) : membershipStatus === 'pending' ? (
                <button disabled className="btn-secondary" style={{ opacity: 0.6, padding: '10px 24px', borderRadius: '12px', fontWeight: '800' }}>
                  Pending
                </button>
              ) : (community.subscription_price || 0) > 0 ? (
                <button 
                  onClick={startSubscribeCheckout}
                  className="btn-primary" 
                  style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: '800', background: 'linear-gradient(135deg, #10b981, #059669)' }}
                >
                  Subscribe Monthly (₹{community.subscription_price})
                </button>
              ) : (
                <button 
                  onClick={handleJoinLeave}
                  className="btn-primary" 
                  style={{ padding: '10px 24px', borderRadius: '12px', fontWeight: '800' }}
                >
                  {community.is_public ? 'Join' : 'Request Access'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Community Tabs - Restricted for Private Communities */}
        {(!community.is_public && !isMember) ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-light)' }}>
            <Lock size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>This community is private. Join to see posts and members.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)', padding: '0 24px', overflowX: 'auto' }} className="no-scrollbar">
            {['Feed', 'Chat', 'Members', 'Settings'].map((tab) => {
              if (tab === 'Settings' && !isMod) return null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '16px 24px',
                    border: 'none',
                    background: 'none',
                    color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    borderBottom: `2px solid ${activeTab === tab ? 'var(--accent-primary)' : 'transparent'}`,
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="community-content-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '24px' 
      }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'Feed' && (
            <>
              {(!community.is_public && !isMember) ? (
                <div className="glass-card animate-fade-in" style={{ padding: '48px 32px', textAlign: 'center', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(138,43,226,0.05))', border: '2px solid rgba(16,185,129,0.3)', position: 'relative', overflow: 'hidden' }}>
                  {/* Glowing decorative indicator banner */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6)', height: '5px' }} />
                  <span style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontSize: '0.7rem', fontWeight: '900', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Razorpay Gateway Secured
                  </span>

                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(138,43,226,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px rgba(16,185,129,0.2)' }}>
                    <Lock size={36} style={{ color: '#10b981' }} />
                  </div>
                  
                  <h3 style={{ fontSize: '1.6rem', fontWeight: '900', color: '#fff', marginBottom: '8px' }}>Exclusive Premium Channel</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '420px', margin: '0 auto 16px', lineHeight: '1.5' }}>
                    Unlock full VIP access to view hidden updates, exclusive exclusive reels drops, and interact directly in active creator group chats.
                  </p>

                  <div style={{ background: 'var(--bg-glass)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', maxWidth: '460px', margin: '0 auto 24px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Creator Payout Split</span>
                      <strong style={{ fontSize: '1.05rem', color: '#10b981', fontWeight: '900' }}>70% Direct INR</strong>
                    </div>
                    <div style={{ width: '1px', height: '28px', background: 'var(--border-light)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Platform Split</span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--accent-secondary)', fontWeight: '900' }}>30% Indico Share</strong>
                    </div>
                    <div style={{ width: '1px', height: '28px', background: 'var(--border-light)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Referral Rewards</span>
                      <strong style={{ fontSize: '1.05rem', color: '#f59e0b', fontWeight: '900' }}>100c Welcome Bonus</strong>
                    </div>
                  </div>

                  {membershipStatus === 'none' && (
                    (community.subscription_price || 0) > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                        <button onClick={startSubscribeCheckout} className="btn-primary hover-scale" style={{ padding: '16px 40px', fontSize: '1.1rem', fontWeight: '900', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 10px 25px rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span>Subscribe Monthly Access</span>
                          <span style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '8px', fontSize: '1rem' }}>₹{community.subscription_price}</span>
                        </button>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🔒 Fully secured verification via Razorpay • Supports UPI & Cards</span>
                      </div>
                    ) : (
                      <button onClick={handleJoinLeave} className="btn-primary hover-scale" style={{ padding: '14px 36px', borderRadius: '16px', fontSize: '1rem', fontWeight: '800' }}>Request Direct Access</button>
                    )
                  )}
                </div>
              ) : (
                <>
                  {isMember && <CreatePost communityId={id} onPostCreated={fetchCommunityData} />}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                    {posts.length === 0 && (
                      <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderRadius: '24px' }}>
                        <p style={{ color: 'var(--text-muted)' }}>No posts in this community yet.</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'Chat' && (
            <div className="glass-card" style={{ height: '600px', borderRadius: '24px', overflow: 'hidden' }}>
              <CommunityChat communityId={id} />
            </div>
          )}

          {activeTab === 'Members' && (
            <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
              <h3 style={{ marginBottom: '20px' }}>Members</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                {members.filter(m => m.status === 'joined').map((member) => (
                  <div key={member.user_id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-primary)', overflow: 'hidden' }}>
                      {member.profiles?.avatar_url && <img src={member.profiles.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{member.profiles?.full_name || member.profiles?.username}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        @{member.profiles?.username}
                        {member.role === 'owner' && <ShieldCheck size={14} style={{ color: 'var(--accent-secondary)' }} />}
                      </div>
                    </div>
                    {isMod && member.user_id !== user?.id && member.role !== 'owner' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleToggleRole(member.user_id, member.role || 'member')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Change Role">
                          <Shield size={16} />
                        </button>
                        <button onClick={() => handleKick(member.user_id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Kick Member">
                          <UserMinus size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'Settings' && isMod && (
            <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
              <h3 style={{ marginBottom: '24px' }}>Community Settings</h3>
              
              {pendingRequests.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h4 style={{ color: 'var(--accent-secondary)', marginBottom: '16px' }}>Join Requests</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pendingRequests.map((req) => (
                      <div key={req.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={req.profiles?.avatar_url || ''} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                          <div>
                            <div style={{ fontWeight: '700' }}>{req.profiles?.full_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{req.profiles?.username}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => handleAcceptDecline(req.user_id, true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Accept</button>
                          <button onClick={() => handleAcceptDecline(req.user_id, false)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Decline</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isOwner && (
                <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
                  <h4 style={{ color: '#ef4444', marginTop: 0 }}>Danger Zone</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Deleting a community is permanent. All posts, chats, and member data will be wiped.</p>
                  <button 
                    onClick={handleDelete}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Delete Community
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Info size={20} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>About</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                  {community.creator?.avatar_url && <img src={community.creator.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created by</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>@{community.creator?.username}</div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Member since {new Date(community.created_at || '').toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px', borderRadius: '20px' }}>
             <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: '800' }}>Rules</h3>
             <ul style={{ margin: 0, padding: '0 0 0 16px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
               <li>Be respectful to all members.</li>
               <li>No spam or self-promotion.</li>
               <li>Post relevant content only.</li>
             </ul>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowInviteModal(false)}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: '400px', padding: '24px', borderRadius: '24px',
            maxHeight: '80vh', overflowY: 'auto'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', margin: 0 }}>Invite Followers</h2>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Add people you follow directly to {community.name}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inviteList.length > 0 ? inviteList.map((u) => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '12px' }} className="hover-glass">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={u.avatar_url || ''} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{u.username}</span>
                  </div>
                  <button 
                    onClick={() => handleInvite(u.id)}
                    style={{ background: 'var(--accent-primary)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              )) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No more people to invite.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simulated Premium Razorpay Gateway Dialog Overlay */}
      {showRzpModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            width: '100%', maxWidth: '440px', padding: '0', borderRadius: '24px', overflow: 'hidden',
            border: '1px solid rgba(16,185,129,0.4)', background: '#0f172a',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
          }}>
            <div style={{ background: 'linear-gradient(90deg, #10b981, #059669)', padding: '20px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, display: 'block', fontWeight: '700' }}>Secured Gateway</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Razorpay Subscription</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' }}>
                ₹{community.subscription_price} / mo
              </div>
            </div>

            <div style={{ padding: '28px 24px' }}>
              {!rzpSuccess ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Exclusive Community Access</span>
                    <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fff', marginTop: '2px' }}>
                      {community.name}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'block', marginTop: '4px' }}>✓ 70% Creator / 30% Platform Split applied</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Select Payment Method</span>
                    {[
                      { name: 'UPI AutoPay', desc: 'Instant recurring setup via UPI', icon: '⚡' },
                      { name: 'Credit / Debit Card', desc: 'Supports automated monthly charges', icon: '💳' },
                    ].map((m, i) => (
                      <div key={i} style={{ padding: '14px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} className="hover-glass">
                        <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                        <div>
                          <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', display: 'block' }}>{m.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      onClick={() => setShowRzpModal(false)} 
                      className="btn-secondary" 
                      style={{ flex: 1, padding: '12px' }}
                      disabled={rzpProcessing}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={processSubscribePayment} 
                      className="btn-primary" 
                      style={{ flex: 2, padding: '12px', background: 'linear-gradient(90deg, #10b981, #059669)' }}
                      disabled={rzpProcessing}
                    >
                      {rzpProcessing ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Loader2 className="animate-spin" size={18} /> Processing...
                        </div>
                      ) : (
                        `Pay ₹${community.subscription_price} Now`
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#10b981' }}>
                    <Check size={36} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Subscription Active!</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                    Welcome to the private community. Access to exclusive posts and member chat unlocked.
                  </p>
                  <button 
                    onClick={() => setShowRzpModal(false)}
                    className="btn-primary"
                    style={{ width: '100%', background: '#10b981' }}
                  >
                    Enter Community
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
