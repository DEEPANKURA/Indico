'use client';

import { useState, useEffect, useRef } from 'react';
import { Compass, Search, Flame, Music, Gamepad2, Camera, Palette, BookOpen, Dumbbell, User, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

const categories = [
  { icon: Flame,    label: 'Viral',         color: '#f97316' },
  { icon: Music,    label: 'Music',         color: '#8b5cf6' },
  { icon: Gamepad2, label: 'Gaming',        color: '#06b6d4' },
  { icon: Camera,   label: 'Photography',   color: '#ec4899' },
  { icon: Palette,  label: 'Art & Design',  color: '#10b981' },
  { icon: BookOpen, label: 'Education',     color: '#f59e0b' },
  { icon: Dumbbell, label: 'Fitness',       color: '#ef4444' },
];

export default function ExplorePage() {
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [risingCreators, setRisingCreators] = useState<any[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load real rising creators on mount
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, followers_count, is_creator')
        .order('followers_count', { ascending: false })
        .limit(6);
      setRisingCreators(data || []);
    };
    load();
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, followers_count, bio')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
      setResults(data || []);
      setSearching(false);
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Compass size={28} style={{ color: 'var(--accent-secondary)' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Explore</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>Discover creators and content</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '28px', position: 'relative' }}>
        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, topics, hashtags..."
          style={{
            width: '100%', padding: '14px 20px 14px 46px',
            background: 'var(--bg-glass)', border: '1px solid var(--border-light)',
            borderRadius: '40px', color: 'var(--text-primary)', outline: 'none',
            fontSize: '1rem', boxSizing: 'border-box', fontFamily: 'inherit',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
        />
        {searching && (
          <Loader2 size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)', animation: 'spin 1s linear infinite' }} />
        )}
      </div>

      {/* Search Results */}
      {query.trim() && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontWeight: '700', marginBottom: '14px', fontSize: '1.05rem' }}>
            {searching ? 'Searching...' : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
          </h2>
          {results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.map((u) => (
                <a key={u.id} href={`/profile/${u.id}`}
                  style={{ textDecoration: 'none' }}>
                  <div className="glass-card" style={{ padding: '14px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 'bold', fontSize: '1.1rem', color: 'white',
                      }}>
                        {(u.full_name || u.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{u.full_name || u.username}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>@{u.username} · {(u.followers_count || 0).toLocaleString()} followers</div>
                      {u.bio && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.bio}</div>}
                    </div>
                    <User size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                </a>
              ))}
            </div>
          ) : !searching ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
              No users found for "{query}"
            </div>
          ) : null}
        </div>
      )}

      {/* Categories — hide during search */}
      {!query.trim() && (
        <>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '1.1rem' }}>Browse Categories</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {categories.map((cat) => (
                <div key={cat.label} className="glass-card" style={{
                  padding: '14px 16px', borderRadius: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  border: `1px solid ${cat.color}22`,
                }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <cat.icon size={22} style={{ color: cat.color }} />
                  </div>
                  <div style={{ fontWeight: '700' }}>{cat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Rising Creators */}
          <div>
            <h2 style={{ fontWeight: '700', marginBottom: '16px', fontSize: '1.1rem' }}>🔥 Rising Creators</h2>
            {risingCreators.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {risingCreators.map((c) => (
                  <a key={c.id} href={`/profile/${c.id}`} style={{ textDecoration: 'none' }}>
                    <div className="glass-card" style={{ padding: '14px 16px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt="" style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{
                            width: '46px', height: '46px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 'bold', fontSize: '1.2rem', color: 'white',
                          }}>
                            {(c.full_name || c.username || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: '700' }}>{c.full_name || c.username}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>@{c.username} · {(c.followers_count || 0).toLocaleString()} followers</div>
                        </div>
                      </div>
                      <button className="btn-secondary" style={{ padding: '5px 14px', fontSize: '0.8rem' }}>Follow</button>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                No creators yet — be the first to sign up!
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
