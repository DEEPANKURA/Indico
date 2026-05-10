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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>{community.name}</h1>
                {!community.is_public && <Lock size={20} style={{ color: 'var(--accent-secondary)' }} />}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '16px', maxWidth: '600px' }}>
                {community.description || 'Welcome to our community!'}
              </p>
              <div style={{ display: 'flex', gap: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={18} />
                  <strong>{members.filter(m => m.status === 'joined').length}</strong> members
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={18} />
                  {community.is_public ? 'Public' : 'Private'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {membershipStatus === 'joined' ? (
                <button 
                  onClick={handleJoinLeave}
                  className="btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
                >
                  <LogOut size={18} /> Leave
                </button>
              ) : membershipStatus === 'pending' ? (
                <button disabled className="btn-secondary" style={{ opacity: 0.6, padding: '10px 24px' }}>
                  Request Pending
                </button>
              ) : (
                <button 
                  onClick={handleJoinLeave}
                  className="btn-primary" 
                  style={{ padding: '10px 24px' }}
                >
                  {community.is_public ? 'Join Community' : 'Request to Join'}
                </button>
              )}
              {isMod && (
                <button 
                  onClick={() => setShowInviteModal(true)}
                  className="btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'var(--accent-secondary)' }}
                >
                  <UserPlus size={18} /> Invite
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Community Tabs */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)', padding: '0 24px' }}>
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
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'Feed' && (
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
    </div>
  );
}
