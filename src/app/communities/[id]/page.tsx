'use client';

import { useState, useEffect, use } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Users, Globe, Lock, ArrowLeft, Loader2, MessageSquare, Shield, Settings, Info } from 'lucide-react';
import PostCard from '@/components/PostCard';
import CreatePost from '@/components/CreatePost';
import { joinCommunityAction } from '@/app/actions/communities';

export default function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [activeTab, setActiveTab] = useState('Feed');
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();
  const router = useRouter();

  const fetchCommunityData = async () => {
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
      .select('user_id, profiles(username, avatar_url, full_name)')
      .eq('community_id', id);

    setMembers(memData || []);
    setIsMember(memData?.some(m => m.user_id === currentUser?.id) || false);

    // Fetch posts
    const { data: postData } = await supabase
      .from('posts')
      .select('*, author:profiles(username, avatar_url)')
      .eq('community_id', id)
      .order('created_at', { ascending: false });

    setPosts(postData || []);
    setLoading(false);
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

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', color: 'var(--text-secondary)' }}>
      <Loader2 className="animate-spin" size={40} style={{ marginBottom: '16px' }} />
      <span>Loading Community...</span>
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
                <span>Founded {new Date(community.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {!isMember ? (
              <button onClick={handleJoin} className="btn-primary" style={{ padding: '12px 32px', borderRadius: '16px', fontWeight: '800' }}>
                Join Community
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn-secondary" style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                  Joined
                </button>
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

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '24px', gap: '32px' }}>
        {['Feed', 'Members', 'About'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ 
              padding: '12px 4px', borderBottom: activeTab === tab ? '3px solid var(--accent-secondary)' : 'none',
              background: 'none', color: activeTab === tab ? 'white' : 'var(--text-secondary)',
              fontWeight: '700', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Feed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isMember && <CreatePost communityId={id} onPostCreated={fetchCommunityData} />}
          
          {posts.length > 0 ? (
            posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))
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

      {activeTab === 'Members' && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={20} /> Community Members
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {members.map((member, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                {member.user_id === community.creator_id && (
                  <span style={{ fontSize: '0.7rem', background: 'rgba(139,92,246,0.1)', color: 'var(--accent-secondary)', padding: '4px 10px', borderRadius: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={12} /> OWNER
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'About' && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Info size={20} /> About this Community
          </h2>
          <div style={{ color: 'var(--text-primary)', lineHeight: '1.7', fontSize: '1rem' }}>
            {community.description}
          </div>
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Category</span>
              <span style={{ fontWeight: '700' }}>{community.category}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Privacy</span>
              <span style={{ fontWeight: '700' }}>{community.is_public ? 'Public' : 'Private'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Member Count</span>
              <span style={{ fontWeight: '700' }}>{community.member_count}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
