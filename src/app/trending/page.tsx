'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { TrendingUp, Flame, Play } from 'lucide-react';
import ReelCard from '@/components/ReelCard';

export default function TrendingPage() {
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchReels = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          media_urls,
          like_count,
          comment_count,
          is_boosted,
          boost_coins,
          music_url, music_title, music_artist, music_start_time,
          music_volume, video_volume, video_trim_start, video_trim_end,
          profiles:author_id ( id, username, full_name, avatar_url )
        `)
        .not('media_urls', 'is', null)
        .is('community_id', null)
        .order('like_count', { ascending: false })
        .limit(10);

      if (data) {
        // Filter for videos (simple check by extension or presence of multiple URLs if we had better metadata)
        const videoPosts = data.filter(p => 
          p.media_urls?.[0]?.toLowerCase().match(/\.(mp4|webm|mov|m4v)$/) || 
          p.media_urls?.[0]?.includes('video')
        );
        setReels(videoPosts);
      }
      setLoading(false);
    };

    fetchReels();
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
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <TrendingUp size={28} style={{ color: 'var(--accent-secondary)' }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Trending Reels</h1>
      </div>

      {reels.length > 0 ? (
        <div 
          ref={containerRef}
          style={{ 
            height: 'calc(100vh - 180px)', 
            overflowY: 'scroll', 
            scrollSnapType: 'y mandatory',
            borderRadius: '20px'
          }}
          className="hide-scrollbar"
        >
          {reels.map((post, index) => (
            <div key={post.id} className="reel-item" data-index={index}>
              <ReelCard 
                isActive={index === activeIndex}
                post={{
                  id: post.id,
                  content: post.content,
                  mediaUrl: post.media_urls[0],
                  likes: post.like_count || 0,
                  comments: post.comment_count || 0,
                  isBoosted: post.is_boosted,
                  boostCoins: post.boost_coins,
                  author: {
                    id: post.profiles.id,
                    name: post.profiles.full_name || 'Creator',
                    username: post.profiles.username || 'user',
                    avatar: post.profiles.avatar_url || ''
                  },
                  musicUrl: post.music_url,
                  musicTitle: post.music_title,
                  musicArtist: post.music_artist,
                  musicStartTime: post.music_start_time,
                  musicVolume: post.music_volume,
                  videoVolume: post.video_volume,
                  videoTrimStart: post.video_trim_start,
                  videoTrimEnd: post.video_trim_end
                }}
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
