'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { X, UserPlus, UserCheck, Search } from 'lucide-react';
import Link from 'next/link';

interface FollowsModalProps {
  type: 'followers' | 'following';
  userId: string;
  onClose: () => void;
}

export default function FollowsModal({ type, userId, onClose }: FollowsModalProps) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchFollows = async () => {
      setLoading(true);
      
      let query;
      if (type === 'followers') {
        query = supabase
          .from('follows')
          .select('follower:profiles!follows_follower_id_fkey(*)')
          .eq('following_id', userId);
      } else {
        query = supabase
          .from('follows')
          .select('following:profiles!follows_following_id_fkey(*)')
          .eq('follower_id', userId);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching follows:', error);
      } else {
        const formattedData = data.map((item: any) => type === 'followers' ? item.follower : item.following);
        setList(formattedData);
      }
      setLoading(false);
    };

    fetchFollows();
  }, [type, userId]);

  const filteredList = list.filter(item => 
    item.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(8px)'
    }} onClick={onClose}>
      <div className="glass-card" style={{
        width: '100%', maxWidth: '440px', maxHeight: '80vh',
        borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          padding: '20px', borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '800', textTransform: 'capitalize' }}>
            {type}
          </h3>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-secondary)',
            width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)' }}>
          <div style={{
            position: 'relative', display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '0 12px'
          }}>
            <Search size={18} style={{ color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'none', border: 'none', color: 'white', padding: '12px',
                width: '100%', outline: 'none', fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading...
            </div>
          ) : filteredList.length > 0 ? (
            filteredList.map((item) => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                borderRadius: '16px', transition: 'background 0.2s', cursor: 'pointer'
              }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                 onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                 onClick={() => { onClose(); window.location.href = `/profile/${item.id}`; }}>
                
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-secondary)', flexShrink: 0 }}>
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))', color: 'white', fontWeight: 'bold'
                    }}>
                      {item.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.full_name || item.username}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    @{item.username}
                  </div>
                </div>

                {/* Follow Button Placeholder */}
                <button style={{
                  padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-light)',
                  background: 'transparent', color: 'var(--text-primary)', fontSize: '0.8rem', fontWeight: '600'
                }}>
                  View
                </button>
              </div>
            ))
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No {type} found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
