import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import PostCard from '@/components/PostCard';
import { Lock, AlertTriangle, Home } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    if (!id) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'white' }}>
          <AlertTriangle size={48} color="var(--accent-secondary)" style={{ marginBottom: '20px' }} />
          <h2>Invalid Post ID</h2>
          <Link href="/" className="btn-primary" style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Home size={18} /> Back Home
          </Link>
        </div>
      );
    }

    const supabase = await createClient();

    // 1. Fetch post data first
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!posts_author_id_fkey(id, username, full_name, avatar_url, is_creator)
      `)
      .eq('id', id)
      .maybeSingle();

    if (postError) {
      console.error('Database Error:', postError);
      throw new Error(postError.message);
    }

    if (!postData) {
      return (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'white' }}>
          <AlertTriangle size={48} color="var(--accent-secondary)" style={{ marginBottom: '20px' }} />
          <h2>Post Not Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>The post you're looking for doesn't exist or has been removed.</p>
          <Link href="/" className="btn-primary" style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <Home size={18} /> Back Home
          </Link>
        </div>
      );
    }

    // 2. Get user session
    const { data: { user } } = await supabase.auth.getUser();

    // 3. Handle interaction status
    let initialIsLiked = false;
    let initialIsFollowing = false;
    
    if (user) {
      const [{ data: likeData }, { data: followData }] = await Promise.all([
        supabase.from('likes').select('id').eq('post_id', id).eq('user_id', user.id).maybeSingle(),
        supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', postData.author_id).maybeSingle()
      ]);
      initialIsLiked = !!likeData;
      initialIsFollowing = !!followData;
    }

    // 4. Handle exclusive content logic
    if (postData.is_exclusive) {
      if (!user) {
        redirect('/auth');
      }
      
      if (user.id !== postData.author_id) {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('subscriber_id', user.id)
          .eq('creator_id', postData.author_id)
          .is('community_id', null)
          .eq('status', 'active')
          .maybeSingle();
          
        if (!subData) {
          return (
            <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '60px', textAlign: 'center' }}>
              <div className="glass-card" style={{ padding: '60px', borderRadius: '24px', background: 'var(--bg-glass)', border: '1px solid var(--border-light)' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(138,43,226,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-secondary)' }}>
                  <Lock size={40} />
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>Exclusive Content</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>This post is exclusively available to {postData.author?.full_name || 'the creator'}'s subscribers.</p>
                <Link href={`/profile/${postData.author_id}`} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px' }}>
                  View Profile to Subscribe
                </Link>
              </div>
            </div>
          );
        }
      }
    }

    // 5. Format post data for PostCard
    const post = postData as any;
    
    // Handle potential array result from join
    const authorData = Array.isArray(post.author) ? post.author[0] : post.author;
    const firstMedia = Array.isArray(post.media_urls) && post.media_urls.length > 0 ? post.media_urls[0] : null;
    
    const formattedPost = {
      id: post.id,
      authorId: post.author_id,
      author: {
        name: authorData?.full_name || 'Anonymous',
        handle: `@${authorData?.username || 'unknown'}`,
        avatar: authorData?.avatar_url || '',
        isNew: authorData?.is_creator ? false : true,
      },
      content: post.content || '',
      mediaUrl: firstMedia as string | undefined,
      mediaType: ((typeof firstMedia === 'string' && (firstMedia.toLowerCase().includes('mp4') || firstMedia.toLowerCase().includes('video'))) ? 'video' : 'image') as 'video' | 'image',
      likes: post.like_count?.toString() || "0",
      comments: post.comment_count?.toString() || "0",
      shares: "0",
      tags: (post.tags || []) as string[],
      mentions: (post.mentions || []) as string[],
      overlays: post.overlays || undefined,
      timeAgo: post.created_at ? new Date(post.created_at).toLocaleDateString() : 'recently',
      musicUrl: post.music_url,
      musicTitle: post.music_title,
      musicArtist: post.music_artist,
      musicStartTime: post.music_start_time,
      musicVolume: post.music_volume,
      videoVolume: post.video_volume,
      videoTrimStart: post.video_trim_start,
      videoTrimEnd: post.video_trim_end,
      moderationStatus: post.moderation_status as any,
      initialIsLiked,
      initialIsFollowing,
      currentUserId: user?.id || null
    };

    return (
      <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
        <PostCard post={formattedPost} />
      </div>
    );
  } catch (error: any) {
    console.error('Critical Runtime Error on PostPage:', error);
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'white' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '20px' }} />
        <h2>Application Error</h2>
        <p style={{ color: 'var(--text-secondary)' }}>A runtime exception occurred in the worker. This has been logged.</p>
        <div style={{ 
          marginTop: '20px', padding: '12px', background: 'rgba(255,0,0,0.1)', 
          borderRadius: '8px', fontSize: '0.8rem', fontFamily: 'monospace', color: '#ef4444' 
        }}>
          {error?.message || 'Unknown Worker Exception (1101)'}
        </div>
        <Link href="/" className="btn-secondary" style={{ marginTop: '20px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Home size={18} /> Return Home
        </Link>
      </div>
    );
  }
}
