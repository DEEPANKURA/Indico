'use client';

import { useState, useEffect } from 'react';
import { X, Search, Send, Check, Loader2, Users } from 'lucide-react';
import { getFriendsAction, searchUsersAction, sendDirectMessageAction, getJoinedCommunitiesAction, sendCommunityMessageAction } from '@/app/actions/social';

interface ShareModalProps {
  postId: string;
  onClose: () => void;
}

export default function ShareModal({ postId, onClose }: ShareModalProps) {
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [activeType, setActiveType] = useState<'people' | 'communities'>('people');

  useEffect(() => {
    const fetchData = async () => {
      const [fRes, cRes] = await Promise.all([
        getFriendsAction(),
        getJoinedCommunitiesAction()
      ]);
      if (fRes.success) setFriends(fRes.users || []);
      if (cRes.success) setCommunities(cRes.communities || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      setResults([]);
      return;
    }
    const res = await searchUsersAction(val);
    if (res.success) {
      setResults(res.users || []);
    }
  };

  const handleSend = async (id: string, type: 'person' | 'community') => {
    setSending(id);
    const postUrl = `${window.location.origin}/post/${postId}`;
    let res;
    if (type === 'person') {
      res = await sendDirectMessageAction(id, `Check out this post: ${postUrl}`, postId);
    } else {
      res = await sendCommunityMessageAction(id, `Check out this post: ${postUrl}`, postId);
    }
    
    if (res.success) {
      setSent(prev => new Set(prev).add(id));
    } else {
      alert('Failed to send');
    }
    setSending(null);
  };

  const displayItems = query ? (activeType === 'people' ? results : []) : (activeType === 'people' ? friends : communities);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 3000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }} onClick={onClose}>
      <div 
        style={{
          width: '100%', maxWidth: '440px', maxHeight: '600px',
          background: 'var(--bg-secondary)', borderRadius: '24px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          border: '1px solid var(--border-light)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontWeight: '800', fontSize: '1.2rem' }}>Share to</h2>
          <button onClick={onClose} style={{ color: 'var(--text-secondary)' }}><X size={24} /></button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)' }}>
          <button 
            onClick={() => setActiveType('people')}
            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeType === 'people' ? 'white' : 'var(--text-secondary)', fontWeight: 'bold', borderBottom: activeType === 'people' ? '2px solid white' : 'none', cursor: 'pointer' }}
          >
            People
          </button>
          <button 
            onClick={() => setActiveType('communities')}
            style={{ flex: 1, padding: '12px', background: 'none', border: 'none', color: activeType === 'communities' ? 'white' : 'var(--text-secondary)', fontWeight: 'bold', borderBottom: activeType === 'communities' ? '2px solid white' : 'none', cursor: 'pointer' }}
          >
            Communities
          </button>
        </div>

        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', borderRadius: '12px', padding: '10px 16px' }}>
            <Search size={18} style={{ color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder={activeType === 'people' ? "Search people..." : "Search your communities..."} 
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.95rem' }} 
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 20px 8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
          ) : displayItems.length > 0 ? (
            displayItems.map((item) => (
              <div key={item.id} style={{
                padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center',
                borderRadius: '16px', transition: 'all 0.2s'
              }} className="hover-glass">
                <div style={{ 
                  width: '44px', height: '44px', borderRadius: '50%', 
                  background: activeType === 'people' ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : (item.color || 'var(--accent-primary)'), 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' 
                }}>
                  {activeType === 'people' ? (
                    item.avatar_url ? <img src={item.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : item.full_name?.[0]
                  ) : (
                    <Users size={20} color="white" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{activeType === 'people' ? item.full_name : item.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {activeType === 'people' ? `@${item.username}` : `${item.member_count} members`}
                  </div>
                </div>
                <button 
                  onClick={() => !sent.has(item.id) && handleSend(item.id, activeType === 'people' ? 'person' : 'community')}
                  className={sent.has(item.id) ? "btn-secondary" : "btn-primary"}
                  style={{ 
                    padding: '8px 20px', fontSize: '0.85rem', minWidth: '80px',
                    opacity: sent.has(item.id) ? 0.7 : 1
                  }}
                  disabled={sending === item.id}
                >
                  {sending === item.id ? <Loader2 size={16} className="animate-spin" /> : 
                   sent.has(item.id) ? <Check size={16} /> : "Send"}
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {query ? "No results found" : (activeType === 'people' ? "No friends found." : "No communities joined yet.")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
