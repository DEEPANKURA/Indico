'use client';

import { useState, useEffect, useRef } from 'react';
import { Compass, Search, Flame, Music, Gamepad2, Camera, Palette, BookOpen, Dumbbell, User, Loader2, PlayCircle, TrendingUp } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import PostCard from '@/components/PostCard';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [risingCreators, setRisingCreators] = useState<any[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('Trending');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load real rising creators on mount
  useEffect(() => {
    const load = async () => {
      // Fetch creators
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, followers_count, is_creator')
        .order('followers_count', { ascending: false })
        .limit(8);
      setRisingCreators(profiles || []);

      // Fetch trending posts
      const { data: posts } = await supabase
        .from('posts')
        .select('*, author:profiles(username, avatar_url, full_name)')
        .order('engagement_score', { ascending: false })
        .limit(10);
      
      // Map posts to match PostCard expectations
      const mappedPosts = (posts || []).map(p => ({
        ...p,
        authorId: p.author_id,
        author: {
          name: p.author.full_name || p.author.username,
          handle: p.author.username,
          avatar: p.author.avatar_url
        },
        likes: p.like_count || 0,
        comments: p.comment_count || 0,
        timestamp: new Date(p.created_at).toLocaleDateString()
      }));
      setTrendingPosts(mappedPosts);
    };
    load();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {/* Quick Categories Bar */}
      <div style={{ 
        display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', marginBottom: '24px',
        scrollbarWidth: 'none', msOverflowStyle: 'none'
      }} className="no-scrollbar">
        {['Trending', ...categories.map(c => c.label)].map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              padding: '10px 20px', borderRadius: '40px', border: '1px solid var(--border-light)',
              background: activeCategory === cat ? 'var(--accent-primary)' : 'var(--bg-glass)',
              color: 'white', whiteSpace: 'nowrap', fontWeight: '700', cursor: 'pointer',
              transition: 'all 0.2s', fontSize: '0.9rem'
            }}
          >
            {cat}
          </button>
        ))}
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
                <div key={u.id} onClick={() => router.push(`/profile/${u.id}`)}
                  style={{ cursor: 'pointer' }}>
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
                    </div>
                    <User size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : !searching ? (
            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
              No users found for "{query}"
            </div>
          ) : null}
        </div>
      )}

      {/* Main Explore Content — hide during search */}
      {!query.trim() && (
        <>
          {activeCategory === 'Trending' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {/* Rising Creators Horizontal Scroll */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                   <h2 style={{ fontWeight: '800', fontSize: '1.2rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <Flame size={20} style={{ color: '#ef4444' }} /> Rising Stars
                   </h2>
                </div>
                <div style={{ 
                  display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px',
                  scrollbarWidth: 'none', msOverflowStyle: 'none'
                }} className="no-scrollbar">
                  {risingCreators.map((c) => (
                    <div key={c.id} onClick={() => router.push(`/profile/${c.id}`)} style={{ 
                      minWidth: '130px', textAlign: 'center', cursor: 'pointer',
                      padding: '16px', borderRadius: '20px', background: 'var(--bg-glass)',
                      border: '1px solid var(--border-light)'
                    }}>
                      <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 12px' }}>
                        <img 
                          src={c.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`} 
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)' }} 
                        />
                        <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--accent-primary)', borderRadius: '50%', padding: '2px' }}>
                          <TrendingUp size={12} color="white" />
                        </div>
                      </div>
                      <div style={{ fontWeight: '800', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.full_name || c.username}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>@{c.username}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Trending Posts Feed */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontWeight: '800', fontSize: '1.2rem', margin: '8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <TrendingUp size={20} style={{ color: 'var(--accent-neon)' }} /> Popular Right Now
                </h2>
                {trendingPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          ) : (
             <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
                <PlayCircle size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p>Coming Soon: Dynamic {activeCategory} Feed</p>
                <button onClick={() => setActiveCategory('Trending')} className="btn-secondary" style={{ marginTop: '12px' }}>Back to Trending</button>
             </div>
          )}
        </>
      )}
    </div>
  );
}
