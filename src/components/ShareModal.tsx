'use client';

import { useState, useEffect } from 'react';
import { X, Search, Send, Check, Loader2 } from 'lucide-react';
import { getFriendsAction, searchUsersAction, sendDirectMessageAction } from '@/app/actions/social';

interface ShareModalProps {
  postId: string;
  onClose: () => void;
}

export default function ShareModal({ postId, onClose }: ShareModalProps) {
  const [query, setQuery] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFriends = async () => {
      const res = await getFriendsAction();
      if (res.success) {
        setFriends(res.users || []);
      }
      setLoading(false);
    };
    fetchFriends();
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

  const handleSend = async (userId: string) => {
    setSending(userId);
    const postUrl = `${window.location.origin}/post/${postId}`;
    const res = await sendDirectMessageAction(userId, `Check out this post: ${postUrl}`, postId);
    if (res.success) {
      setSent(prev => new Set(prev).add(userId));
    } else {
      alert('Failed to send');
    }
    setSending(null);
  };

  const displayUsers = query ? results : friends;

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

        <div style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', borderRadius: '12px', padding: '10px 16px' }}>
            <Search size={18} style={{ color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search people..." 
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '0.95rem' }} 
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 20px 8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><Loader2 className="animate-spin" /></div>
          ) : displayUsers.length > 0 ? (
            displayUsers.map((user) => (
              <div key={user.id} style={{
                padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center',
                borderRadius: '16px', transition: 'all 0.2s'
              }} className="hover-glass">
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', overflow: 'hidden' }}>
                  {user.avatar_url ? <img src={user.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.full_name?.[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{user.full_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>@{user.username}</div>
                </div>
                <button 
                  onClick={() => !sent.has(user.id) && handleSend(user.id)}
                  className={sent.has(user.id) ? "btn-secondary" : "btn-primary"}
                  style={{ 
                    padding: '8px 20px', fontSize: '0.85rem', minWidth: '80px',
                    opacity: sent.has(user.id) ? 0.7 : 1
                  }}
                  disabled={sending === user.id}
                >
                  {sending === user.id ? <Loader2 size={16} className="animate-spin" /> : 
                   sent.has(user.id) ? <Check size={16} /> : "Send"}
                </button>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {query ? "No users found" : "No friends found. Use search to find people!"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
