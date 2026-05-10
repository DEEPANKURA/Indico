'use client';

import { useState, useEffect } from 'react';
import { Users, Lock, Globe, Loader2, Search, Plus, Sparkles, TrendingUp, ShieldCheck, MapPin } from 'lucide-react';
import { getCommunitiesAction, joinCommunityAction } from '@/app/actions/communities';
import CreateCommunityModal from '@/components/CreateCommunityModal';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [user, setUser] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  const fetchCommunities = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    setUser(currentUser);
    
    const res = await getCommunitiesAction();
    if (res.success) {
      setCommunities(res.communities || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Real-time updates for communities
    const suffix = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`communities_live_${suffix}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'communities' }, () => {
        setIsLive(true);
        fetchCommunities();
        setTimeout(() => setIsLive(false), 2000);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_members' }, () => {
        setIsLive(true);
        fetchCommunities();
        setTimeout(() => setIsLive(false), 2000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleJoin = async (id: string) => {
    const res = await joinCommunityAction(id);
    if (res.success) {
      fetchCommunities();
    }
  };

  const filteredCommunities = communities.filter(c => {
    const matchesFilter = filter === 'All' || c.category === filter;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = [
    { name: 'All', icon: Users },
    { name: 'Music', icon: Sparkles },
    { name: 'Gaming', icon: TrendingUp },
    { name: 'Art', icon: Sparkles },
    { name: 'Tech', icon: ShieldCheck },
    { name: 'Fitness', icon: MapPin }
  ];

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px', paddingBottom: '100px' }}>
      {/* Header section with live status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            padding: '10px', borderRadius: '16px', 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            boxShadow: '0 8px 16px -4px rgba(139,92,246,0.3)'
          }}>
            <Users size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Communities</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isLive ? '#10b981' : 'var(--text-secondary)' }}>
              <span className={isLive ? "animate-pulse" : ""} style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLive ? '#10b981' : '#6b7280' }} />
              {isLive ? 'Live Updates Active' : 'Real-time Discovering'}
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}
        >
          <Plus size={18} /> Create
        </button>
      </div>

      {/* Search with modern glass effect */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Search for vibes, topics, or creators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            width: '100%', padding: '16px 16px 16px 48px', borderRadius: '18px', 
            background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
            color: 'white', outline: 'none', fontSize: '1rem',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      </div>

      {/* Filter tabs with icons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '12px' }} className="no-scrollbar">
        {categories.map((cat) => (
          <button 
            key={cat.name} 
            onClick={() => setFilter(cat.name)}
            style={{
              padding: '10px 20px', borderRadius: '24px', fontSize: '0.85rem', fontWeight: '700',
              background: filter === cat.name ? 'white' : 'var(--bg-glass)',
              border: filter === cat.name ? '1px solid white' : '1px solid var(--border-light)', 
              color: filter === cat.name ? 'black' : 'white', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: filter === cat.name ? '0 4px 12px rgba(255,255,255,0.2)' : 'none'
            }}
          >
            <cat.icon size={14} />
            {cat.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <Loader2 className="animate-spin" size={40} style={{ marginBottom: '16px', color: 'var(--accent-primary)' }} />
            <span>Finding the best communities...</span>
          </div>
        ) : filteredCommunities.length > 0 ? (
          filteredCommunities.map((comm) => {
            const membership = comm.community_members?.find((m: any) => m.user_id === user?.id);
            const isJoined = membership?.status === 'joined';
            const isPending = membership?.status === 'pending';
            return (
              <div key={comm.id} className="glass-card animate-fade-in" style={{ 
                padding: '24px', borderRadius: '24px', position: 'relative', overflow: 'hidden',
                borderLeft: `6px solid ${comm.color || 'var(--accent-primary)'}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }} onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 12px 24px -8px ${comm.color}44`;
              }} onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }} onClick={() => router.push(`/communities/${comm.id}`)}>
                {/* Background glow based on community color */}
                <div style={{ 
                  position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', 
                  background: comm.color || 'var(--accent-primary)', opacity: 0.05, borderRadius: '50%', filter: 'blur(40px)' 
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <h3 style={{ fontWeight: '800', fontSize: '1.2rem', margin: 0 }}>{comm.name}</h3>
                      {comm.is_public ? <Globe size={14} style={{ color: '#10b981' }} /> : <Lock size={14} style={{ color: '#f59e0b' }} />}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ 
                        fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: `${comm.color}15` || 'rgba(139,92,246,0.1)', 
                        color: comm.color || 'var(--accent-primary)', 
                        padding: '4px 10px', borderRadius: '20px', fontWeight: '800' 
                      }}>
                        {comm.category}
                      </span>
                      {comm.member_count > 10 && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
                          🔥 Trending
                        </span>
                      )}
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: '1.6', maxWidth: '90%' }}>
                      {comm.description || "A space for creators to connect and share their latest work."}
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                        <Users size={16} /> {comm.member_count} members
                      </div>
                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--border-light)' }} />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Active {new Date(comm.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!membership) handleJoin(comm.id);
                    }}
                    className={isJoined ? "btn-secondary" : isPending ? "btn-secondary" : "btn-primary"} 
                    style={{ 
                      marginLeft: '16px', padding: '10px 24px', flexShrink: 0, borderRadius: '14px',
                      background: isJoined ? 'rgba(255,255,255,0.05)' : isPending ? 'rgba(245,158,11,0.1)' : (comm.color || 'var(--accent-primary)'),
                      border: isJoined ? '1px solid var(--border-light)' : isPending ? '1px solid #f59e0b' : 'none',
                      color: isJoined ? 'var(--text-secondary)' : isPending ? '#f59e0b' : 'white',
                      fontWeight: '700', fontSize: '0.9rem',
                      cursor: (isJoined || isPending) ? 'default' : 'pointer'
                    }}
                    disabled={isJoined || isPending}
                  >
                    {isJoined ? 'Joined' : isPending ? 'Pending' : comm.is_public ? 'Join' : 'Request'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ 
            textAlign: 'center', padding: '80px 40px', color: 'var(--text-secondary)', 
            background: 'var(--bg-glass)', borderRadius: '32px', border: '1px dashed var(--border-light)' 
          }}>
            <div style={{ 
              width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
            }}>
              <Search size={32} style={{ opacity: 0.3 }} />
            </div>
            <h3 style={{ color: 'white', marginBottom: '8px' }}>No communities found</h3>
            <p style={{ maxWidth: '300px', margin: '0 auto 24px' }}>Try adjusting your filters or search terms to find what you're looking for.</p>
            <button onClick={() => {setFilter('All'); setSearch('');}} style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}>
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCommunityModal 
          onClose={() => setShowCreate(false)} 
          onSuccess={fetchCommunities} 
        />
      )}
    </div>
  );
}
