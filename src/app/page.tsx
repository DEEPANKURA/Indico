import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { Info } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      id,
      content,
      media_urls,
      like_count,
      comment_count,
      created_at,
      profiles:author_id ( id, username, full_name, avatar_url, is_creator )
    `)
    .order('created_at', { ascending: false });

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      {/* Header / Feed Tabs */}
      <div className="glass-card feed-tabs" style={{ 
        display: 'flex', alignItems: 'center', gap: '8px', 
        padding: '8px', marginBottom: '24px', position: 'sticky', top: '10px', zIndex: 10 
      }}>
        <button className="btn-primary" style={{ flex: 1 }}>For You</button>
        <button className="btn-secondary" style={{ flex: 1, border: 'none', background: 'transparent' }}>Following</button>
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
              authorId: post.profiles?.id,
              author: {
                name: post.profiles?.full_name || 'Anonymous',
                handle: `@${post.profiles?.username || 'unknown'}`,
                avatar: post.profiles?.avatar_url || '',
                isNew: post.profiles?.is_creator ? false : true,
              },
              content: post.content,
              mediaUrl: post.media_urls?.[0] || undefined,
              mediaType: post.media_urls?.[0]?.includes('mp4') ? 'video' : 'image',
              likes: post.like_count?.toString() || "0",
              comments: post.comment_count?.toString() || "0",
              shares: "0",
              tags: [],
              timeAgo: new Date(post.created_at).toLocaleDateString()
            }} 
          />
        ))}
        {(!posts || posts.length === 0) && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            No posts yet. Be the first to post!
          </div>
        )}
      </div>
    </div>
  );
}
