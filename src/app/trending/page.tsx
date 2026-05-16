'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TrendingUp, Play, AlertTriangle } from 'lucide-react';
import ReelCard from '@/components/ReelCard';

export default function TrendingPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchReels = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      
      const { data: reelsData, error: rpcError } = await supabase.rpc('get_trending_reels', { limit_count: 20 });

      if (rpcError) {
        console.error('Error fetching trending reels:', rpcError);
        setError(rpcError.message);
        setLoading(false);
        return;
      }

      if (reelsData) {
        setReels(reelsData.map((p: any) => ({
          id: p.id,
          content: p.content,
          mediaUrl: p.media_urls[0],
          likes: p.like_count,
          comments: p.comment_count,
          isBoosted: p.is_boosted,
          boostCoins: p.boost_coins,
          initialIsLiked: p.is_liked,
          initialIsFollowing: p.is_following,
          currentUserId: user?.id || null,
          author: {
            id: p.author_id,
            name: p.author_full_name,
            username: p.author_username,
            avatar: p.author_avatar_url
          },
          musicUrl: p.music_url,
          musicTitle: p.music_title,
          musicArtist: p.music_artist,
          musicStartTime: p.music_start_time,
          musicVolume: p.music_volume,
          videoVolume: p.video_volume,
          videoTrimStart: p.video_trim_start,
          videoTrimEnd: p.video_trim_end
        })));
      }
      setLoading(false);
    };

    fetchReels();

    const channel = supabase
      .channel('trending_reels')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchReels();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setActiveIndex(index);
          }
        });
      },
      {
        threshold: 0.4, // Lower threshold for better response
        root: containerRef.current
      }
    );

    const elements = containerRef.current.querySelectorAll('.reel-item');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [reels]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: 'var(--text-secondary)' }}>
        <div className="animate-spin" style={{ width: '30px', height: '30px', border: '3px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '680px', margin: '0 auto', paddingTop: '0' }}>

      {error ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderRadius: '20px', border: '1px solid #ef4444' }}>
          <AlertTriangle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
          <h2 style={{ fontWeight: '700', marginBottom: '8px' }}>Feed Error</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-secondary" style={{ marginTop: '20px' }}>Try Again</button>
        </div>
      ) : reels.length > 0 ? (
        <div 
          ref={containerRef}
          style={{ 
            height: 'calc(100dvh - 64px)', 
            overflowY: 'scroll', 
            scrollSnapType: 'y mandatory',
          }}
          className="hide-scrollbar"
        >
          {reels.map((post, index) => (
            <div key={post.id} className="reel-item" data-index={index}>
              <ReelCard 
                isActive={index === activeIndex}
                post={post}
              />
          </div>
          ))}
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', borderRadius: '20px' }}>
          <Play size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h2 style={{ fontWeight: '700', marginBottom: '8px' }}>No Trending Reels Yet</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Be the first to upload a video and start a trend!</p>
          <a href="/upload" className="btn-primary" style={{ display: 'inline-block', marginTop: '20px', textDecoration: 'none', padding: '10px 24px' }}>Upload Reel</a>
        </div>
      )}

      {/* CSS to hide scrollbar */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
