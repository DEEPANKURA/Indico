import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import PostCard from '@/components/PostCard';

export default async function PostPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:user_id(username, full_name, avatar_url)
    `)
    .eq('id', params.id)
    .single();

  if (error || !post) {
    notFound();
  }

  // Transform to match PostCard expectations
  const formattedPost = {
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
    shares: post.shares_count?.toString() || "0",
    tags: [],
    timeAgo: new Date(post.created_at).toLocaleDateString()
  };

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '10px' }}>
      <PostCard post={formattedPost} />
    </div>
  );
}
