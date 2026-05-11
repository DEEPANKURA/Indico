'use client';

import { useState, useEffect } from 'react';
import { Play, Flame, Search } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import ReelCard from '@/components/ReelCard';
import Link from 'next/link';

export default function TrendingPage() {
  const supabase = createClient();
  const [reels, setReels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchReels = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(id, username, full_name, avatar_url)')
        .is('community_id', null)
        .order('engagement_score', { ascending: false })
        .limit(20);

      if (data) setReels(data);
      setLoading(false);
    };

    fetchReels();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.reels-container');
      if (scrollContainer) {
        const index = Math.round(scrollContainer.scrollTop / scrollContainer.clientHeight);
        setActiveIndex(index);
      }
    };

    const scrollContainer = document.querySelector('.reels-container');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }
    return () => scrollContainer?.removeEventListener('scroll', handleScroll);
  }, [reels]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontWeight: '800', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Flame color="#ef4444" /> Trending Reels
        </h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link href="/explore">
            <button className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '12px' }}>
              <Search size={18} />
            </button>
          </Link>
        </div>
      </div>

      {reels.length > 0 ? (
        <div 
          className="reels-container no-scrollbar"
          style={{ 
            height: 'calc(100vh - 120px)', 
            overflowY: 'scroll', 
            scrollSnapType: 'y mandatory',
            borderRadius: '20px'
          }}
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .reel-item { scroll-snap-align: start; height: 100%; }
      `}</style>
    </div>
  );
}
