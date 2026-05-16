'use client';

import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { Info, Sparkles, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Stories from "@/components/Stories";
import NotificationBell from "@/components/NotificationBell";
import { useEffect, useState } from "react";

export default function HomeClient({ 
  initialPosts, 
  initialUser 
}: { 
  initialPosts: any[], 
  initialUser: any 
}) {
  const supabase = createClient();
  const [user, setUser] = useState<any>(initialUser);
  const [posts, setPosts] = useState<any[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'viral' | 'following'>('viral');

  useEffect(() => {
    if (!initialUser) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
      });
    }
  }, [initialUser]);

  useEffect(() => {
    // Only fetch if not the initial load or if tab changed
    if (activeTab === 'viral' && initialPosts === posts) return;
    fetchFeed();
  }, [activeTab]);

  const fetchFeed = async () => {
    setLoading(true);
    const rpcName = activeTab === 'viral' ? 'get_viral_feed' : 'get_following_feed';
    const { data, error } = await (supabase.rpc as any)(rpcName, { limit_count: 20 });

    if (error) {
      console.error(`Error fetching ${activeTab} feed:`, error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 className="text-gradient-primary" style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Indico</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <NotificationBell />
        </div>
      </div>

      {/* Stories */}
      <Stories />

      {/* Header / Feed Tabs */}
      <div className="glass-card feed-tabs" style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', 
        padding: '8px', marginBottom: '24px', position: 'sticky', top: '10px', zIndex: 10 
      }}>
        <button 
          className={activeTab === 'viral' ? "btn-primary" : "btn-secondary"} 
          style={{ flex: 1, border: activeTab === 'viral' ? '' : 'none', background: activeTab === 'viral' ? '' : 'transparent' }}
          onClick={() => setActiveTab('viral')}
        >
          For You
        </button>
        <button 
          className={activeTab === 'following' ? "btn-primary" : "btn-secondary"} 
          style={{ flex: 1, border: activeTab === 'following' ? '' : 'none', background: activeTab === 'following' ? '' : 'transparent' }}
          onClick={() => setActiveTab('following')}
        >
          Following
        </button>
        <Link href="/communities" style={{ flex: 1, display: 'flex' }}>
          <button className="btn-secondary" style={{ width: '100%', border: 'none', background: 'transparent' }}>Community</button>
        </Link>
        <Link href="/live" style={{ flex: 1, display: 'flex' }}>
          <button className="btn-secondary" style={{ width: '100%', border: 'none', background: 'transparent' }}>Go Live</button>
        </Link>
      </div>

      {/* Info Banner */}
      <div style={{ 
        background: 'rgba(0, 255, 255, 0.05)', 
        border: '1px solid rgba(0, 255, 255, 0.2)',
        borderRadius: '12px', padding: '16px', marginBottom: '24px',
        display: 'flex', gap: '12px', alignItems: 'flex-start'
      }}>
        <Info size={20} className="text-gradient" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p className="text-sm">
          <span className="text-gradient" style={{ fontWeight: 'bold' }}>Fair Algorithm Active — </span> 
          {activeTab === 'viral' 
            ? 'Posts are currently ranked by content quality, watch time, and completion rate.' 
            : 'You are viewing latest posts from creators you follow.'}
        </p>
      </div>

      {/* Create Post */}
      <CreatePost />

      {/* Feed */}
      <div className="feed-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="animate-spin text-gradient" size={32} />
          </div>
        ) : (
          <>
            {posts.map((post: any) => (
              <PostCard 
                key={post.id}
                post={{
                  id: post.id,
                  authorId: post.author_id,
                  author: {
                    name: post.author_full_name || 'Anonymous',
                    handle: `@${post.author_username || 'unknown'}`,
                    avatar: post.author_avatar_url || '',
                    isNew: post.author_followers_count < 100,
                  },
                  content: post.content,
                  mediaUrl: post.media_urls?.[0] || undefined,
                  mediaType: typeof post.media_urls?.[0] === 'string' && post.media_urls[0].toLowerCase().match(/\.(mp4|webm|ogg)/) ? 'video' : 'image',
                  likes: post.like_count?.toString() || "0",
                  comments: post.comment_count?.toString() || "0",
                  shares: "0",
                  tags: post.tags || [],
                  mentions: post.mentions || [],
                  overlays: post.overlays || undefined,
                  timeAgo: new Date(post.created_at).toLocaleDateString(),
                  musicUrl: post.music_url,
                  musicTitle: post.music_title,
                  musicArtist: post.music_artist,
                  musicStartTime: post.music_start_time,
                  videoVolume: post.video_volume,
                  videoTrimStart: post.video_trim_start,
                  videoTrimEnd: post.video_trim_end,
                  moderationStatus: post.moderation_status,
                  initialIsLiked: post.is_liked,
                  initialIsFollowing: post.is_following,
                  isEncrypted: post.is_encrypted,
                  isExclusive: post.is_exclusive,
                  isSubscribed: post.is_subscribed,
                  currentUserId: user?.id || null
                }} 
              />
            ))}
            {posts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Sparkles size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <h3>No posts yet.</h3>
                <p>{activeTab === 'following' ? "Try following some creators to see their posts here!" : "Be the first to post!"}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
