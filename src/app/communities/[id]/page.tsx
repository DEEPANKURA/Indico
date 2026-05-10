'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Users, Shield, Settings, Plus, Send, X, UserPlus, LogOut, Check, Trash2, Camera, UserMinus, ShieldCheck } from 'lucide-react';
import PostCard from '@/components/PostCard';
import CommunityChat from '@/components/CommunityChat';
import { getFollowingListForInviteAction, inviteToCommunityAction, kickMemberAction, setMemberRoleAction, deleteCommunityAction, leaveCommunityAction } from '@/app/actions/communities';

type Member = {
  id: string;
  user_id: string;
  role: 'owner' | 'moderator' | 'member';
  status: 'joined' | 'pending';
  profiles: {
    username: string;
    avatar_url: string;
    full_name: string;
  };
};

type Profile = {
  id: string;
  username: string;
  avatar_url: string;
  full_name: string;
};

export default function CommunityPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<'joined' | 'pending' | 'none'>('none');
  const [userRole, setUserRole] = useState<'owner' | 'moderator' | 'member' | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'chat' | 'members' | 'settings'>('posts');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteList, setInviteList] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Member[]>([]);

  const fetchCommunityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch community info
      const { data: commData } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!commData) {
        router.push('/communities');
        return;
      }
      setCommunity(commData);

      // Fetch members
      const { data: memberData } = await supabase
        .from('community_members')
        .select('*, profiles(username, avatar_url, full_name)')
        .eq('community_id', id);
      
      const castMembers = (memberData as unknown as Member[]) || [];
      setMembers(castMembers);

      // Check current user status
      const currentMember = castMembers.find(m => m.user_id === currentUser?.id);
      setIsMember(currentMember?.status === 'joined');
      setMembershipStatus(currentMember?.status || 'none');
      
      // Fallback: If they are the creator, they are the owner
      const effectiveRole = currentMember?.role || (commData.creator_id === currentUser?.id ? 'owner' : null);
      setUserRole(effectiveRole as any);

      // If owner/moderator, fetch pending requests
      if (effectiveRole && ['owner', 'moderator'].includes(effectiveRole)) {
        const { data: reqData } = await supabase
          .from('community_members')
          .select('*, profiles(username, avatar_url, full_name)')
          .eq('community_id', id)
          .eq('status', 'pending');
        setPendingRequests((reqData as unknown as Member[]) || []);

        // Also fetch following list for invite
        const inviteRes = await getFollowingListForInviteAction(id as string);
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
  }, [id, currentUser?.id]);

  const handleJoin = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    const { error } = await supabase
      .from('community_members')
      .insert({
        community_id: id as string,
        user_id: currentUser.id,
        status: community.is_private ? 'pending' : 'joined',
        role: 'member'
      });
    
    if (error) alert(error.message);
    else fetchCommunityData();
  };

  const handleLeave = async () => {
    if (!confirm('Are you sure you want to leave this community?')) return;
    const res = await leaveCommunityAction(id as string);
    if (res.success) fetchCommunityData();
    else alert(res.error);
  };

  const handleAcceptRequest = async (userId: string) => {
    const { error } = await supabase
      .from('community_members')
      .update({ status: 'joined' })
      .eq('community_id', id)
      .eq('user_id', userId);
    
    if (error) alert(error.message);
    else fetchCommunityData();
  };

  const handleInvite = async (userId: string) => {
    const res = await inviteToCommunityAction(id as string, userId);
    if (res.success) {
      alert('Invited successfully!');
      fetchCommunityData();
    } else {
      alert(res.error);
    }
  };

  const handleKick = async (userId: string) => {
    if (!confirm('Kick this member?')) return;
    const res = await kickMemberAction(id as string, userId);
    if (res.success) fetchCommunityData();
    else alert(res.error);
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const nextRole = currentRole === 'moderator' ? 'member' : 'moderator';
    const res = await setMemberRoleAction(id as string, userId, nextRole);
    if (res.success) fetchCommunityData();
    else alert(res.error);
  };

  const handleDeleteCommunity = async () => {
    if (!confirm('PERMANENTLY DELETE this community? This cannot be undone.')) return;
    const res = await deleteCommunityAction(id as string);
    if (res.success) router.push('/communities');
    else alert(res.error);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
      <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Community Header */}
      <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ height: '200px', background: community.cover_url ? `url(${community.cover_url})` : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div style={{ padding: '24px', marginTop: '-60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '30px', 
              background: 'var(--bg-secondary)', border: '4px solid var(--bg-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3rem', overflow: 'hidden'
            }}>
              {community.name?.[0].toUpperCase()}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              {!isMember && membershipStatus === 'none' && (
                <button onClick={handleJoin} className="btn-primary" style={{ padding: '10px 24px' }}>
                  {community.is_private ? 'Request to Join' : 'Join Community'}
                </button>
              )}
              {membershipStatus === 'pending' && (
                <button disabled className="btn-secondary" style={{ padding: '10px 24px', opacity: 0.7 }}>
                  Request Pending
                </button>
              )}
              {isMember && (
                <>
                  <button onClick={() => setShowInviteModal(true)} className="btn-secondary" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserPlus size={18} /> Invite
                  </button>
                  {userRole !== 'owner' && (
                    <button onClick={handleLeave} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }}>
                      Leave
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>{community.name}</h1>
            {community.is_private && <Shield size={20} style={{ color: 'var(--accent-secondary)' }} />}
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '20px', maxWidth: '600px' }}>{community.description}</p>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              <Users size={18} /> <strong>{members.filter(m => m.status === 'joined').length}</strong> Members
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--border-light)', padding: '0 24px' }}>
          {(['posts', 'chat', 'members'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '16px 24px', border: 'none', background: 'none', color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', borderBottom: `2px solid ${activeTab === tab ? 'var(--accent-primary)' : 'transparent'}`,
                transition: 'all 0.2s', textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
          {['owner', 'moderator'].includes(userRole || '') && (
             <button
              onClick={() => setActiveTab('settings')}
              style={{
                padding: '16px 24px', border: 'none', background: 'none', color: activeTab === 'settings' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', borderBottom: `2px solid ${activeTab === 'settings' ? 'var(--accent-primary)' : 'transparent'}`,
                transition: 'all 0.2s'
              }}
            >
              Settings
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'posts' && (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {isMember ? (
            <>
              <div className="glass-card" style={{ padding: '16px', borderRadius: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-secondary)' }} />
                <input 
                  type="text" placeholder={`Post something to ${community.name}...`} 
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'white' }}
                  onClick={() => router.push('/upload')}
                />
                <button onClick={() => router.push('/upload')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}>
                  <Camera size={20} />
                </button>
              </div>
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </>
          ) : (
            <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderRadius: '24px' }}>
              <Shield size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>Join to View Posts</h3>
              <p style={{ color: 'var(--text-secondary)' }}>This community's posts are only visible to members.</p>
              <button onClick={handleJoin} className="btn-primary" style={{ marginTop: '20px', padding: '10px 24px' }}>Join Community</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'chat' && (
        <div style={{ height: '600px', marginBottom: '24px' }}>
          {isMember ? (
            <CommunityChat communityId={id as string} />
          ) : (
             <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '24px' }}>
              <Shield size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
              <h3>Join to Chat</h3>
              <button onClick={handleJoin} className="btn-primary" style={{ marginTop: '20px', padding: '10px 24px' }}>Join Community</button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
          <h2 style={{ marginBottom: '20px' }}>Community Members</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {members.filter(m => m.status === 'joined').map(member => (
              <div key={member.id} style={{ padding: '16px', borderRadius: '16px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={member.profiles.avatar_url} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontWeight: '700' }}>{member.profiles.full_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      @{member.profiles.username} 
                      {member.role === 'owner' && <ShieldCheck size={14} style={{ color: 'var(--accent-secondary)' }} />}
                      {member.role === 'moderator' && <Shield size={14} style={{ color: 'var(--accent-primary)' }} />}
                    </div>
                  </div>
                </div>
                {['owner', 'moderator'].includes(userRole || '') && member.user_id !== currentUser?.id && member.role !== 'owner' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {userRole === 'owner' && (
                       <button 
                        onClick={() => handleToggleRole(member.user_id, member.role)}
                        style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                        title={member.role === 'moderator' ? "Demote to Member" : "Promote to Moderator"}
                      >
                        <Shield size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleKick(member.user_id)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}
                      title="Kick Member"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="glass-card" style={{ padding: '32px', borderRadius: '24px' }}>
          <h2 style={{ marginBottom: '32px' }}>Community Settings</h2>
          
          {pendingRequests.length > 0 && (
             <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', color: 'var(--accent-secondary)' }}>Pending Join Requests ({pendingRequests.length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pendingRequests.map(req => (
                    <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: '16px', background: 'var(--bg-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={req.profiles.avatar_url} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        <div>
                          <div style={{ fontWeight: '700' }}>{req.profiles.full_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{req.profiles.username}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => handleAcceptRequest(req.user_id)}
                          style={{ padding: '8px 16px', borderRadius: '10px', background: 'var(--accent-primary)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => handleKick(req.user_id)}
                          style={{ padding: '8px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {userRole === 'owner' && (
            <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.02)' }}>
              <h3 style={{ color: '#ef4444', marginTop: 0 }}>Danger Zone</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>Once you delete a community, there is no going back. Please be certain.</p>
              <button 
                onClick={handleDeleteCommunity}
                style={{ 
                  width: '100%', padding: '12px', borderRadius: '12px', 
                  background: 'rgba(239,68,68,0.1)', color: '#ef4444', 
                  border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                  fontWeight: '700', transition: 'all 0.2s'
                }}
                className="hover-scale"
              >
                Delete Community
              </button>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={u.avatar_url} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
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
