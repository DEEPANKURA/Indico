import { createClient } from '@/utils/supabase/server';
import PostCard from '@/components/PostCard';
import { notFound } from 'next/navigation';

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  const { data: post, error } = await supabase
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
    .eq('id', params.id)
    .single();

  if (error || !post) {
    return notFound();
  }

  // Format post for PostCard
  const formattedPost = {
    id: post.id,
    authorId: post.author_id,
    author: {
      name: post.author?.full_name || post.author?.username || 'Anonymous',
      handle: `@${post.author?.username || 'unknown'}`,
      avatar: post.author?.avatar_url || '',
      isNew: (post.author?.followers_count || 0) < 100,
    },
    content: post.content,
    mediaUrl: post.media_urls?.[0],
    mediaType: (post.media_urls?.[0]?.toLowerCase().match(/\.(mp4|webm|ogg)/) ? 'video' : 'image') as 'video' | 'image',
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
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <PostCard post={formattedPost} />
    </div>
  );
}
