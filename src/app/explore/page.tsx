'use client';

import { useState, useEffect, useRef } from 'react';
import { Compass, Search, Flame, Music, Gamepad2, Camera, Palette, BookOpen, Dumbbell, User, Loader2, PlayCircle, TrendingUp, ArrowLeft } from 'lucide-react';
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
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [searchMode, setSearchMode] = useState<'users' | 'posts'>('users');
  const [postResults, setPostResults] = useState<any[]>([]);
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
        .is('community_id', null)
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
        shares: "0",
        tags: p.tags || [],
        mentions: p.mentions || [],
        overlays: p.overlays,
        timeAgo: new Date(p.created_at).toLocaleDateString(),
        musicUrl: p.music_url,
        musicTitle: p.music_title,
        musicArtist: p.music_artist,
        musicStartTime: p.music_start_time,
        musicVolume: p.music_volume,
        videoVolume: p.video_volume,
        videoTrimStart: p.video_trim_start,
        videoTrimEnd: p.video_trim_end
      }));
      setTrendingPosts(mappedPosts);
    };
    load();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { 
      setResults([]); 
      setPostResults([]);
      return; 
    }
    
    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      const trimmedQuery = query.trim();
      
      // Parallel search for speed
      const [userRes, postRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, followers_count, bio')
          .or(`username.ilike.%${trimmedQuery}%,full_name.ilike.%${trimmedQuery}%`)
          .limit(10),
        supabase
          .from('posts')
          .select('*, author:profiles(id, username, avatar_url, full_name)')
          .is('community_id', null)
          .ilike('content', `%${trimmedQuery}%`)
          .limit(10)
      ]);

      setResults(userRes.data || []);
      
      // Map posts for PostCard
      const mapped = (postRes.data || []).map(p => ({
        ...p,
        authorId: p.author.id,
        author: {
          name: p.author.full_name || p.author.username,
          handle: p.author.username,
          avatar: p.author.avatar_url
        },
        likes: p.like_count || 0,
        comments: p.comment_count || 0,
        shares: "0",
        tags: p.tags || [],
        mentions: p.mentions || [],
        overlays: p.overlays,
        timeAgo: new Date(p.created_at).toLocaleDateString(),
        musicUrl: p.music_url,
        musicTitle: p.music_title,
        musicArtist: p.music_artist,
        musicStartTime: p.music_start_time,
        musicVolume: p.music_volume,
        videoVolume: p.video_volume,
        videoTrimStart: p.video_trim_start,
        videoTrimEnd: p.video_trim_end
      }));
      setPostResults(mapped);
      
      setSearching(false);
    }, 400);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {/* Search Header */}
      <div style={{ position: 'sticky', top: '0', zIndex: 100, background: 'rgba(10, 10, 15, 0.8)', backdropFilter: 'blur(12px)', padding: '10px 0 20px' }}>
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search creators, topics, or hashtags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 16px 16px 50px',
              borderRadius: '16px',
              border: '1px solid var(--border-light)',
              background: 'rgba(255, 255, 255, 0.05)',
              color: 'white',
              fontSize: '1rem',
              outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          {searching && (
            <Loader2 size={18} className="animate-spin" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-neon)' }} />
          )}
        </div>

        {/* Quick Categories Bar */}
        <div style={{ 
          display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px',
          scrollbarWidth: 'none', msOverflowStyle: 'none'
        }} className="no-scrollbar">
          {['Trending', ...categories.map(c => c.label)].map((cat) => (
            <button 
              key={cat}
              onClick={() => { setActiveCategory(cat); setQuery(''); }}
              style={{ 
                padding: '8px 18px', borderRadius: '40px', border: '1px solid var(--border-light)',
                background: activeCategory === cat && !query ? 'var(--accent-primary)' : 'var(--bg-glass)',
                color: 'white', whiteSpace: 'nowrap', fontWeight: '700', cursor: 'pointer',
                transition: 'all 0.2s', fontSize: '0.85rem'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      {query.trim() && (
        <div style={{ marginTop: '20px' }}>
          {/* Search Tabs */}
          <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border-light)', marginBottom: '20px' }}>
            <button 
              onClick={() => setSearchMode('users')}
              style={{ 
                padding: '10px 4px', background: 'none', border: 'none', color: searchMode === 'users' ? 'var(--accent-neon)' : 'var(--text-secondary)',
                fontWeight: '700', borderBottom: searchMode === 'users' ? '2px solid var(--accent-neon)' : 'none', cursor: 'pointer'
              }}
            >
              Users ({results.length})
            </button>
            <button 
              onClick={() => setSearchMode('posts')}
              style={{ 
                padding: '10px 4px', background: 'none', border: 'none', color: searchMode === 'posts' ? 'var(--accent-neon)' : 'var(--text-secondary)',
                fontWeight: '700', borderBottom: searchMode === 'posts' ? '2px solid var(--accent-neon)' : 'none', cursor: 'pointer'
              }}
            >
              Content ({postResults.length})
            </button>
          </div>

          {searchMode === 'users' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {results.length > 0 ? results.map((u) => (
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
              )) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No users found for "{query}"
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {postResults.length > 0 ? postResults.map((post) => (
                <PostCard key={post.id} post={post} />
              )) : (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                  No content found for "{query}"
                </div>
              )}
            </div>
          )}
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

              {/* Trending Posts Grid */}
              <div>
                <h2 style={{ fontWeight: '800', fontSize: '1.2rem', margin: '24px 0 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <TrendingUp size={20} style={{ color: 'var(--accent-neon)' }} /> Popular Right Now
                </h2>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '4px',
                  margin: '0 -16px' 
                }}>
                  {trendingPosts.map((post) => (
                    <div 
                      key={post.id} 
                      onClick={() => setSelectedPost(post)}
                      style={{ 
                        aspectRatio: '1/1', 
                        position: 'relative', 
                        cursor: 'pointer',
                        overflow: 'hidden',
                        background: '#000'
                      }}
                      className="hover-scale"
                    >
                      {post.media_urls?.[0] ? (
                        <>
                          {post.media_urls[0].includes('mp4') ? (
                            <video src={post.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                          ) : (
                            <img src={post.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          {post.media_urls[0].includes('mp4') && (
                            <PlayCircle size={20} color="white" style={{ position: 'absolute', top: '8px', right: '8px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                          )}
                        </>
                      ) : (
                        <div style={{ padding: '8px', fontSize: '0.7rem', color: '#666', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {post.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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

      {/* Full Screen Post Modal */}
      {selectedPost && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.98)', zIndex: 10000,
          display: 'flex', flexDirection: 'column',
          animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ 
            padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)',
            position: 'absolute', top: 0, width: '100%', zIndex: 10
          }}>
            <button onClick={() => setSelectedPost(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
              <ArrowLeft size={28} />
            </button>
            <div style={{ color: 'white', fontWeight: 'bold' }}>Trending Content</div>
            <div style={{ width: '28px' }} />
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 0 120px 0' }}>
            {selectedPost.media_urls?.[0] ? (
               <div style={{ width: '100%', maxHeight: '70vh', position: 'relative' }}>
                  {selectedPost.media_urls[0].includes('mp4') ? (
                    <video src={selectedPost.media_urls[0]} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} controls autoPlay loop />
                  ) : (
                    <img src={selectedPost.media_urls[0]} style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
                  )}
               </div>
            ) : (
              <div style={{ padding: '40px', color: 'white', textAlign: 'center', fontSize: '1.2rem' }}>
                {selectedPost.content}
              </div>
            )}
          </div>

          <div style={{ 
            position: 'absolute', bottom: 0, width: '100%', padding: '30px 20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <img src={selectedPost.author.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPost.author.handle}`} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white' }} />
              <div>
                <div style={{ color: 'white', fontWeight: 'bold' }}>{selectedPost.author.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>@{selectedPost.author.handle}</div>
              </div>
            </div>

            {selectedPost.musicUrl && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                background: 'rgba(255,255,255,0.1)', borderRadius: '12px',
                marginBottom: '16px', color: 'white'
              }}>
                <Music size={16} color="var(--accent-primary)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedPost.musicTitle}</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>{selectedPost.musicArtist}</div>
                </div>
                <audio autoPlay src={selectedPost.musicUrl} loop />
              </div>
            )}

            <p style={{ color: 'white', marginBottom: '20px', fontSize: '0.95rem' }}>{selectedPost.content}</p>
            <button 
              onClick={() => { setSelectedPost(null); router.push(`/post/${selectedPost.id}`); }}
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontWeight: '800' }}
            >
              View Full Interaction & Comments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
