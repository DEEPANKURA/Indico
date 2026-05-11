import { createClient } from '@/utils/supabase/server';
import PostCard from '@/components/PostCard';
import { Info } from 'lucide-react';
import CreatePost from '@/components/CreatePost';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  
  // Fetch posts with author profiles
  // Note: We're using a join to get author data. 
  // In a real app, you might use a view or a more complex query for performance.
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:profiles!posts_author_id_fkey(
        id,
        username,
        full_name,
        avatar_url,
        followers_count
      )
    `)
    .is('community_id', null) // Only show non-community posts on home feed
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching posts:', error);
  }

  return (
    <main style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {/* Algorithm Notice */}
      <div className="glass-card" style={{ 
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px', padding: '16px', marginBottom: '24px',
        display: 'flex', gap: '12px', alignItems: 'flex-start'
      }}>
        <Info size={20} className="text-gradient" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p className="text-sm">
          <span className="text-gradient" style={{ fontWeight: 'bold' }}>Fair Algorithm Active — </span> 
          Posts are currently ranked by content quality, watch time, and completion rate. New creators receive equal exposure testing.
        </p>
      </div>

      {/* Create Post */}
      <CreatePost />

      {/* Feed */}
      <div className="feed-container">
        {posts?.map((post: any) => (
          <PostCard 
            key={post.id} 
            post={{
              id: post.id,
              authorId: post.author_id,
              author: {
                name: post.author?.full_name || 'Anonymous',
                handle: `@${post.author?.username || 'unknown'}`,
                avatar: post.author?.avatar_url || '',
                isNew: (post.author?.followers_count || 0) < 100,
              },
              content: post.content,
              mediaUrl: post.media_urls?.[0] || undefined,
              mediaType: post.media_urls?.[0]?.toLowerCase().match(/\.(mp4|webm|ogg)/) ? 'video' : 'image',
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
              musicVolume: post.music_volume,
              videoVolume: post.video_volume,
              videoTrimStart: post.video_trim_start,
              videoTrimEnd: post.video_trim_end
            }} 
          />
        ))}
        {(!posts || posts.length === 0) && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            No posts yet. Be the first to post!
          </div>
        )}
      </div>
    </main>
  );
}
