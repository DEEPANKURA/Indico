import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import PostCard from '@/components/PostCard';
import { Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const { data: postData, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles:author_id(id, username, full_name, avatar_url, is_creator)
    `)
    .eq('id', id)
    .single();

  if (error || !postData) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser();

  // If exclusive, check subscription or ownership
  if (postData.is_exclusive) {
    if (!user) {
      redirect('/auth');
    }
    
    if (user.id !== postData.author_id) {
      // Check active subscription
      const { data: subData } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('subscriber_id', user.id)
        .eq('creator_id', postData.author_id)
        .is('community_id', null)
        .eq('status', 'active')
        .maybeSingle();
        
      if (!subData) {
        // Render lock screen
        return (
          <div style={{ maxWidth: '680px', margin: '0 auto', paddingTop: '60px', textAlign: 'center' }}>
            <div className="glass-card" style={{ padding: '60px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(138,43,226,0.1), rgba(0,255,255,0.05))' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(138,43,226,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--accent-secondary)' }}>
                <Lock size={40} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>Exclusive Content</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>This post is exclusively available to {postData.profiles?.full_name}'s subscribers.</p>
              <a href={`/profile/${postData.author_id}`} className="btn-primary" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                View Profile to Subscribe
              </a>
            </div>
          </div>
        );
      }
    }
  }

  // Transform to match PostCard expectations
  const post = postData as any;
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
    mediaType: (typeof post.media_urls?.[0] === 'string' && post.media_urls[0].includes('mp4') ? 'video' : 'image') as "image" | "video",
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
