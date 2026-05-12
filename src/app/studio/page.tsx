'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Video, Eye, Heart, MessageCircle, TrendingUp, BarChart2, Plus, Sparkles, AlertCircle, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function StudioPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isLive, setIsLive] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }
    setUser(user);

    const { data } = await supabase
      .from('posts')
      .select('id, content, like_count, comment_count, created_at, ai_safety_score, is_flagged, media_urls, music_url, music_title, music_artist, music_start_time, music_volume, video_volume, video_trim_start, video_trim_end, tags, mentions, overlays')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Use a unique suffix to avoid channel name collisions in Strict Mode
    const suffix = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`studio_updates_${user.id}_${suffix}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'posts',
        filter: `author_id=eq.${user.id}`
      }, (payload) => {
        console.log('Real-time update in Studio:', payload);
        setIsLive(true);
        setTimeout(() => setIsLive(false), 2000);
        
        if (payload.eventType === 'INSERT') {
          setPosts(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setPosts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
        } else if (payload.eventType === 'DELETE') {
          setPosts(prev => prev.filter(p => p.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (loading) return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <RefreshCcw className="animate-spin" style={{ margin: '0 auto 12px' }} />
      Loading Studio...
    </div>
  );

  const totalLikes = posts.reduce((s, p) => s + (p.like_count || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comment_count || 0), 0);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Video size={28} style={{ color: 'var(--accent-secondary)' }} />
            {isLive && (
              <span style={{
                position: 'absolute', top: '-5px', right: '-5px',
                width: '10px', height: '10px', borderRadius: '50%',
                background: '#10b981', border: '2px solid var(--bg-primary)',
                boxShadow: '0 0 10px #10b981'
              }} />
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>Creator Studio</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: isLive ? '#10b981' : 'var(--text-secondary)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLive ? '#10b981' : '#6b7280' }} />
              {isLive ? 'Live Updates Active' : 'Real-time Connected'}
            </div>
          </div>
        </div>
        <Link href="/upload" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', padding: '10px 18px', borderRadius: '12px' }}>
          <Plus size={18} /> New Post
        </Link>
      </div>

      {/* Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '16px', 
        marginBottom: '32px' 
      }}>
        {[
          { label: 'Total Content', value: posts.length, icon: BarChart2, color: '#8b5cf6', gradient: 'linear-gradient(135deg, rgba(139,92,246,0.2), transparent)' },
          { label: 'Total Likes', value: totalLikes, icon: Heart, color: '#ec4899', gradient: 'linear-gradient(135deg, rgba(236,72,153,0.2), transparent)' },
          { label: 'Total Comments', value: totalComments, icon: MessageCircle, color: '#06b6d4', gradient: 'linear-gradient(135deg, rgba(6,182,212,0.2), transparent)' },
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ 
            padding: '20px 16px', borderRadius: '20px', textAlign: 'center',
            background: stat.gradient, border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <stat.icon size={24} style={{ color: stat.color, marginBottom: '8px' }} />
            <div style={{ fontSize: '1.6rem', fontWeight: '800' }}>{stat.value.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions / Tips */}
      <div className="glass-card" style={{ 
        padding: '16px', borderRadius: '16px', marginBottom: '32px',
        display: 'flex', alignItems: 'center', gap: '16px',
        background: 'linear-gradient(90deg, rgba(139,92,246,0.1), rgba(6,182,212,0.1))',
        border: '1px solid rgba(139,92,246,0.2)'
      }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>Creator Tip: Quality over Quantity</div>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Posts with high watch time are 5x more likely to go viral on the Indico feed.</p>
        </div>
      </div>

      {/* Content Feed */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>Content Performance</h2>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sorted by Newest</div>
      </div>

      {posts.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {posts.map((post) => (
            <div key={post.id} className="glass-card" style={{ 
              padding: '20px', borderRadius: '18px', 
              borderLeft: post.is_flagged ? '4px solid #ef4444' : '4px solid var(--accent-secondary)',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'}
               onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
               onClick={() => router.push(`/post/${post.id}`)}>
              
              <div style={{ display: 'flex', gap: '16px', flexDirection: 'row', flexWrap: 'wrap' }}>
                {post.media_urls?.[0] && (
                  <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
                    {post.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? (
                      <video src={post.media_urls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <p style={{ margin: 0, lineHeight: '1.5', fontSize: '0.95rem', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {post.content?.slice(0, 100)}{(post.content?.length || 0) > 100 ? '...' : ''}
                    </p>
                    {post.is_flagged && (
                      <span style={{ 
                        background: 'rgba(239,68,68,0.15)', color: '#fca5a5', 
                        fontSize: '0.7rem', padding: '3px 8px', borderRadius: '10px', 
                        whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px',
                        border: '1px solid rgba(239,68,68,0.3)'
                      }}>
                        <AlertCircle size={12} /> Flagged
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: post.like_count > 0 ? 'var(--accent-neon)' : 'inherit' }}>
                      <Heart size={16} fill={post.like_count > 0 ? 'var(--accent-neon)' : 'none'} /> 
                      <strong>{post.like_count || 0}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageCircle size={16} /> 
                      <strong>{post.comment_count || 0}</strong>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: post.ai_safety_score < 70 ? '#fca5a5' : '#10b981' }}>
                      <TrendingUp size={16} /> 
                      Score: {post.ai_safety_score || 100}%
                    </span>
                  </div>
                  
                  <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Posted {new Date(post.created_at).toLocaleDateString()}</span>
                    <span>View Analytics →</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '60px 40px', textAlign: 'center', borderRadius: '24px' }}>
          <div style={{ 
            width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px'
          }}>
            <Video size={40} style={{ color: 'var(--text-secondary)' }} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>No content shared yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem', maxWidth: '300px', margin: '0 auto 24px' }}>
            Upload your first post to start tracking your performance and growing your audience.
          </p>
          <Link href="/upload" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 32px', borderRadius: '12px' }}>
            Upload First Post
          </Link>
        </div>
      )}
    </div>
  );
}
