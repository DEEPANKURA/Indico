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
          avatar: p.author?.avatar_url || '',
          isNew: false
        },
        authorId: p.author_id,
        likes: (p.like_count || 0).toLocaleString(),
        comments: (p.comment_count || 0).toLocaleString(),
        shares: '0',
        tags: p.tags || [],
        mentions: p.mentions || [],
        overlays: p.overlays
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

  const handleJoin = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }
    const res = await joinCommunityAction(id);
    if (res.success) {
      fetchCommunityData();
    } else {
      alert(res.error);
    }
  };

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this community?')) {
      const res = await leaveCommunityAction(id);
      if (res.success) {
        fetchCommunityData();
      }
    }
  };

  const handleAcceptDecline = async (userId: string, accept: boolean) => {
    const res = await handleJoinRequestAction(id, userId, accept);
    if (res.success) {
      fetchCommunityData();
    }
  };

  const handleInvite = async (userId: string) => {
    const res = await inviteToCommunityAction(id, userId);
    if (res.success) {
      setInviteList(prev => prev.filter(u => u.id !== userId));
      alert('Invite sent!');
    }
  };

  const handleDelete = async () => {
    if (confirm('PERMANENTLY DELETE this community? This cannot be undone.')) {
      const res = await deleteCommunityAction(id);
      if (res.success) router.push('/communities');
    }
  };

  const handleKick = async (userId: string) => {
    if (confirm('Kick this member?')) {
      const res = await kickMemberAction(id, userId);
      if (res.success) fetchCommunityData();
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'moderator' ? 'member' : 'moderator';
    const res = await setMemberRoleAction(id, userId, newRole);
    if (res.success) fetchCommunityData();
  };

  if (loading) return (
    <div style={{ padding: '100px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <Loader2 className="animate-spin" style={{ margin: '0 auto 12px' }} />
      Loading community...
    </div>
  );

  if (!community) return null;

  const isOwner = userRole === 'owner' || community.creator_id === user?.id;
  const isMod = isOwner || userRole === 'moderator';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px' }}>
      <div style={{ marginBottom: '24px' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '700' }}>
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0', borderRadius: '32px', marginBottom: '32px', overflow: 'hidden' }}>
        <div style={{ height: '160px', background: community.color || 'var(--accent-primary)', opacity: 0.8, position: 'relative' }}>
          <div style={{ position: 'absolute', bottom: '-40px', left: '32px', width: '100px', height: '100px', borderRadius: '28px', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: '4px solid var(--bg-primary)' }}>
            <Users size={48} style={{ color: community.color || 'var(--accent-primary)' }} />
          </div>
        </div>

        <div style={{ padding: '60px 32px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1, minWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900' }}>{community.name}</h1>
                {community.is_public ? <Globe size={20} style={{ color: 'var(--text-muted)' }} /> : <Lock size={20} style={{ color: 'var(--accent-secondary)' }} />}
              </div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '600px' }}>{community.description || 'Welcome to our community!'}</p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={16} /> {community.member_count || 0} members
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {community.is_public ? <Globe size={16} /> : <Lock size={16} />} 
                  {community.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {isMod && (
                <button onClick={() => setShowInviteModal(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '16px' }}>
                  <UserPlus size={18} /> Invite
                </button>
              )}
              
              {membershipStatus === 'joined' ? (
                <button onClick={handleLeave} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '16px', color: '#ef4444' }}>
                  <LogOut size={18} /> Leave
                </button>
              ) : membershipStatus === 'pending' ? (
                <button disabled className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '16px', opacity: 0.7 }}>
                  <Loader2 size={18} className="animate-spin" /> Pending
                </button>
              ) : membershipStatus === 'invited' ? (
                <button onClick={handleJoin} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '16px' }}>
                  <Check size={18} /> Accept Invite
                </button>
              ) : (
                <button onClick={handleJoin} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', borderRadius: '16px', fontSize: '1rem', fontWeight: '800', boxShadow: `0 10px 20px ${community.color || 'var(--accent-primary)'}44` }}>
                  {community.is_public ? 'Join Community' : 'Request to Join'}
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
                <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(139,92,246,0.05), transparent)' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Lock size={32} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '8px' }}>Private Feed</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto 20px' }}>
                    Only members can see posts in this community.
                  </p>
                  {membershipStatus === 'none' && (
                    <button onClick={handleJoin} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '12px' }}>Request Access</button>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Shield size={20} style={{ color: 'var(--accent-secondary)' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>Rules</h3>
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>Be respectful to all members</li>
              <li>No spam or self-promotion</li>
              <li>Post relevant content only</li>
              <li>Follow platform guidelines</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '450px', padding: '32px', borderRadius: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ margin: 0, fontWeight: '900' }}>Invite Followers</h3>
              <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }} className="no-scrollbar">
              {inviteList.length > 0 ? inviteList.map((f) => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={f.avatar_url || ''} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{f.full_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{f.username}</div>
                    </div>
                  </div>
                  <button onClick={() => handleInvite(f.id)} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>Invite</button>
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No followers available to invite.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
