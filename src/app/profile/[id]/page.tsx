import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, full_name, bio, avatar_url')
    .eq('id', id)
    .single();

  if (!profile) {
    return {
      title: 'User Not Found | Indico',
    };
  }

  const name = profile.full_name || profile.username || 'Creator';
  const description = profile.bio ? profile.bio.substring(0, 160) : `Check out ${name}'s profile on Indico.`;

  return {
    title: `${name} (@${profile.username}) | Indico`,
    description,
    openGraph: {
      title: `${name} on Indico`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${name} (@${profile.username})`,
      description,
      images: profile.avatar_url ? [profile.avatar_url] : [],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch all necessary data in parallel on the server
  const { data: { user } } = await supabase.auth.getUser();
  
  const [profileRes, postsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('posts')
      .select('id, content, like_count, comment_count, created_at, media_urls, music_url, music_title, music_artist, music_start_time, music_volume, video_volume, video_trim_start, video_trim_end, is_exclusive, is_encrypted, moderation_status')
      .eq('author_id', id)
      .eq('moderation_status', 'approved')
      .is('community_id', null)
      .order('created_at', { ascending: false })
  ]);

  let initialFollow = false;
  let initialSub = false;

  if (user && user.id !== id) {
    const [followRes, subRes] = await Promise.all([
      supabase.from('follows').select('id').eq('follower_id', user.id).eq('following_id', id).single(),
      supabase.from('subscriptions').select('id').eq('subscriber_id', user.id).eq('creator_id', id).is('community_id', null).eq('status', 'active').single()
    ]);
    initialFollow = !!followRes.data;
    initialSub = !!subRes.data;
  }

  return (
    <ProfileClient 
      params={{ id }} 
      initialProfile={profileRes.data} 
      initialPosts={postsRes.data || []}
      initialIsFollowing={initialFollow}
      initialIsSubscribed={initialSub}
    />
  );
}
