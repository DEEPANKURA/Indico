'use client';

import { useState, useEffect } from 'react';
import { Users, Lock, Globe, Loader2, Search } from 'lucide-react';
import { getCommunitiesAction, joinCommunityAction } from '@/app/actions/communities';
import CreateCommunityModal from '@/components/CreateCommunityModal';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchCommunities = async () => {
    setLoading(true);
    const res = await getCommunitiesAction();
    if (res.success) setCommunities(res.communities || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

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

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px', paddingBottom: '80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '12px', background: 'var(--accent-primary)22' }}>
            <Users size={28} style={{ color: 'var(--accent-primary)' }} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Communities</h1>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          + Create
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input 
          type="text" 
          placeholder="Search communities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ 
            width: '100%', padding: '14px 16px 14px 48px', borderRadius: '16px', 
            background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
            color: 'white', outline: 'none'
          }}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }} className="no-scrollbar">
        {['All', 'Music', 'Gaming', 'Art', 'Tech', 'Fitness'].map((tab) => (
          <button 
            key={tab} 
            onClick={() => setFilter(tab)}
            style={{
              padding: '8px 20px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600',
              background: filter === tab ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'var(--bg-glass)',
              border: '1px solid var(--border-light)', color: 'white', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : filteredCommunities.length > 0 ? (
          filteredCommunities.map((comm) => (
            <div key={comm.id} className="glass-card animate-fade-in" style={{ padding: '20px', borderRadius: '16px', borderLeft: `4px solid ${comm.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontWeight: '700', fontSize: '1rem' }}>{comm.name}</h3>
                    {comm.is_public
                      ? <Globe size={14} style={{ color: 'var(--text-secondary)' }} />
                      : <Lock size={14} style={{ color: 'var(--text-secondary)' }} />}
                    <span style={{ fontSize: '0.75rem', background: `${comm.color}22`, color: comm.color, padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>{comm.category}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px', lineHeight: '1.5' }}>{comm.description}</p>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <span>👥 {comm.member_count} members</span>
                    <span>✨ Founded {new Date(comm.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleJoin(comm.id)}
                  className="btn-secondary" 
                  style={{ marginLeft: '16px', padding: '8px 24px', flexShrink: 0, borderRadius: '12px' }}
                >
                  Join
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)', background: 'var(--bg-glass)', borderRadius: '24px' }}>
            <Users size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>No communities found. Why not create one?</p>
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
