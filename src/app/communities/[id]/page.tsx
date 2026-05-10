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
  inviteMemberAction
} from '@/app/actions/communities';
import {
  Users, Globe, Lock, ArrowLeft, Loader2, MessageSquare,
  Shield, Settings, Info, Check, X, UserPlus,
  LogOut, ShieldCheck, Mail
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
  status: 'pending' | 'joined' | 'invited' | 'rejected' | null;
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

      setMembers((memData as unknown as Member[]) || []);

      const currentMember = (memData as any[])?.find(m => m.user_id === currentUser?.id);
      setIsMember(currentMember?.status === 'joined');
      setMembershipStatus(currentMember?.status || 'none');
      setUserRole(currentMember?.role || null);

      // If owner/moderator, fetch pending requests
      if (currentMember && currentMember.role && ['owner', 'moderator'].includes(currentMember.role)) {
        const { data: reqData } = await supabase
          .from('community_members')
          .select('*, profiles(username, avatar_url, full_name)')
          .eq('community_id', id)
          .eq('status', 'pending');
        setPendingRequests((reqData as unknown as Member[]) || []);

        // Also fetch following list for invite
        const inviteRes = await getFollowingListForInviteAction(id);
        if (inviteRes.success && inviteRes.users) {
          setInviteList(inviteRes.users as unknown as Profile[]);
        }
      }

      // Fetch posts
      const { data: postData } = await supabase
        .from('posts')
        .select('*, author:profiles(username, avatar_url)')
        .eq('community_id', id)
        .order('created_at', { ascending: false });

      const mappedPosts = postData?.map(p => ({
        ...p,
        author: {
          name: p.author?.username || 'Anonymous',
          handle: `@${p.author?.username || 'anon'}`,
          avatar: p.author?.avatar_url,
          isNew: false
        },
        authorId: p.author_id,
        likes: (p.like_count || 0).toLocaleString(),
        comments: (p.comment_count || 0).toLocaleString(),
        shares: '0',
        tags: [],
        timeAgo: new Date(p.created_at).toLocaleDateString(),
        mediaUrl: p.media_urls?.[0],
        mediaType: p.media_urls?.[0]?.match(/\.(mp4|webm|ogg|mov)/i) ? 'video' : 'image',
        musicUrl: p.music_url,
        musicTitle: p.music_title,
        musicArtist: p.music_artist
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

    // Realtime for posts in this community
    const channel = supabase
      .channel(`community_${id}_posts`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `community_id=eq.${id}`
      }, () => {
        fetchCommunityData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleJoin = async () => {
    const res = await joinCommunityAction(id);
    if (res.success) {
      fetchCommunityData();
    }
  };

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this community?')) {
      const res = await leaveCommunityAction(id);
      if (res.success) {
        fetchCommunityData();
        setActiveTab('Feed');
      }
    }
  };

  const handleRequestAction = async (userId: string, accept: boolean) => {
    const res = await handleJoinRequestAction(id, userId, accept);
    if (res.success) {
      fetchCommunityData();
    }
  };

  const handleInvite = async (userId: string) => {
    const res = await inviteMemberAction(id, userId);
    if (res.success) {
      fetchCommunityData();
      // Remove from local invite list
      setInviteList(prev => prev.filter(u => u.id !== userId));
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--text-secondary)' }}>
      <Loader2 className="animate-spin" size={40} style={{ marginBottom: '16px' }} />
      <span>Loading Community...</span>
    </div>
  );

  if (!community) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--text-secondary)' }}>
      <Info size={40} style={{ marginBottom: '16px' }} />
      <span>Community not found</span>
    </div>
  );

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '100px' }}>
      {/* Community Header */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <button
          onClick={() => router.push('/communities')}
          style={{
            position: 'absolute', top: '10px', left: '-50px',
            background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
            padding: '8px', borderRadius: '50%', color: 'white', cursor: 'pointer'
          }}
          className="hover-scale"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="glass-card" style={{
          padding: '40px 24px 24px', borderRadius: '24px', overflow: 'hidden',
          borderTop: `8px solid ${community.color || 'var(--accent-primary)'}`
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, width: '200px', height: '200px',
            background: community.color || 'var(--accent-primary)', opacity: 0.1, borderRadius: '50%', filter: 'blur(60px)'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '900', margin: 0 }}>{community.name}</h1>
                {community.is_public ? <Globe size={20} style={{ color: '#10b981' }} /> : <Lock size={20} style={{ color: '#f59e0b' }} />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={16} /> {community.member_count} members
                </span>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-light)' }} />
                <span>Founded {community.created_at ? new Date(community.created_at).toLocaleDateString() : 'Recently'}</span>
              </div>
            </div>
            {membershipStatus === 'none' ? (
              <button onClick={handleJoin} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '16px', fontWeight: '800' }}>
                {community.is_public ? 'Join Community' : 'Request to Join'}
              </button>
            ) : membershipStatus === 'pending' ? (
              <button className="btn-secondary" style={{ padding: '12px 32px', borderRadius: '16px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'default' }}>
                Request Pending
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleLeave}
                  className="btn-secondary"
                  style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Check size={18} style={{ color: '#10b981' }} /> Joined
                </button>
                {userRole && ['owner', 'moderator'].includes(userRole) && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn-primary"
                    style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <UserPlus size={18} /> Invite
                  </button>
                )}
                {community.creator_id === user?.id && (
                  <button className="btn-secondary" style={{ padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                    <Settings size={20} />
                  </button>
                )}
              </div>
            )}
          </div>

          <p style={{ marginTop: '20px', color: 'var(--text-primary)', fontSize: '1.05rem', lineHeight: '1.6', maxWidth: '90%' }}>
            {community.description}
          </p>

          <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', marginLeft: '4px' }}>
              {members.slice(0, 5).map((m, i) => (
                <img
                  key={i}
                  src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.profiles?.username}`}
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: '2px solid var(--bg-primary)', marginLeft: i === 0 ? 0 : '-12px'
                  }}
                />
              ))}
              {members.length > 5 && (
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-glass-hover)',
                  border: '2px solid var(--bg-primary)', marginLeft: '-12px', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '800'
                }}>
                  +{members.length - 5}
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {community.creator?.username ? `Created by @${community.creator.username}` : 'Community managed by Indico'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '24px', gap: '32px', overflowX: 'auto' }} className="no-scrollbar">
        {['Feed', 'Chat', 'Members', 'About', ...(userRole && ['owner', 'moderator'].includes(userRole) ? ['Moderation'] : [])].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 4px', borderBottom: activeTab === tab ? '3px solid var(--accent-secondary)' : 'none',
              background: 'none', color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {tab}
            {tab === 'Chat' && isMember && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} className="animate-pulse" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isMember && <CreatePost communityId={id} onPostCreated={fetchCommunityData} />}

          {posts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', borderRadius: '24px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
              }}>
                <MessageSquare size={32} style={{ opacity: 0.3 }} />
              </div>
              <h3 style={{ marginBottom: '8px' }}>No posts yet</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Be the first to start a conversation in {community.name}!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isMember ? (
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderRadius: '24px' }}>
              <Lock size={32} style={{ marginBottom: '16px', color: 'var(--text-secondary)' }} />
              <h3 style={{ marginBottom: '8px' }}>Chat is for members only</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Join this community to participate in the conversation!</p>
              <button onClick={handleJoin} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '12px' }}>Join Community</button>
            </div>
          ) : (
            <CommunityChat communityId={id} />
          )}
        </div>
      )}

      {activeTab === 'Members' && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} /> Community Members
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {members.map((member, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '12px' }} className="hover-glass">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={member.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.profiles?.username}`}
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: '700' }}>{member.profiles?.full_name || member.profiles?.username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{member.profiles?.username}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {member.user_id === community.creator_id ? (
                    <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-secondary)', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={12} /> OWNER
                    </span>
                  ) : member.role === 'moderator' ? (
                    <span style={{ fontSize: '0.7rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={12} /> MOD
                    </span>
                  ) : null}
                  {member.user_id !== user?.id && (
                    <button
                      onClick={() => router.push(`/messages?userId=${member.user_id}`)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px' }}
                    >
                      Message
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Moderation' && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={20} /> Join Requests
          </h2>
          {pendingRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingRequests.map((req, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={req.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.profiles?.username}`}
                      style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: '700' }}>{req.profiles?.full_name || req.profiles?.username}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{req.profiles?.username}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleRequestAction(req.user_id, true)}
                      style={{ padding: '8px 16px', borderRadius: '10px', background: '#10b981', color: 'white', border: 'none', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Check size={16} /> Accept
                    </button>
                    <button
                      onClick={() => handleRequestAction(req.user_id, false)}
                      style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <X size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Mail size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>No pending join requests</p>
            </div>
          )}
        </div>
      )}

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
              {inviteList.length > 0 ? inviteList.map((u, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '12px' }} className="hover-glass">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                      style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                    />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{u.full_name || u.username}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>@{u.username}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleInvite(u.id)}
                    className="btn-primary"
                    style={{ padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem' }}
                  >
                    Add
                  </button>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                  {inviteList.length === 0 && 'No followers to invite'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
