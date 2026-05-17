import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const { id } = await params;
    
    if (!id || !UUID_REGEX.test(id)) {
      console.warn(`[Profile metadata] Invalid UUID provided: "${id}". Skipping DB lookup.`);
      return {
        title: 'User Not Found | Indico',
      };
    }

    const supabase = await createClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username, full_name, bio, avatar_url')
      .eq('id', id)
      .single();

    if (error || !profile) {
      if (error && error.code !== 'PGRST116') {
        console.error('[Profile metadata] Error fetching profile:', error);
      }
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
  } catch (error) {
    console.error('[Profile metadata] Critical error:', error);
    return {
      title: 'Profile | Indico',
    };
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  let profileId = '';
  try {
    const { id } = await params;
    profileId = id;

    if (!id || !UUID_REGEX.test(id)) {
      console.warn(`[Profile SSR Page] Invalid UUID provided: "${id}". Skipping DB fetch.`);
      return (
        <ProfileClient 
          params={{ id: id || '' }} 
          initialProfile={null} 
          initialPosts={[]} 
          initialIsFollowing={false}
          initialIsSubscribed={false}
        />
      );
    }

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

    if (profileRes.error && profileRes.error.code !== 'PGRST116') {
      console.error(`[Profile SSR Page] Profile fetch error for "${id}":`, profileRes.error);
    }
    if (postsRes.error) {
      console.error(`[Profile SSR Page] Posts fetch error for "${id}":`, postsRes.error);
    }

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
        initialProfile={profileRes.data || null} 
        initialPosts={postsRes.data || []}
        initialIsFollowing={initialFollow}
        initialIsSubscribed={initialSub}
      />
    );
  } catch (error) {
    console.error(`[Profile SSR Page] Critical edge exception for "${profileId}":`, error);
    return (
      <div style={{ maxWidth: '680px', margin: '60px auto', padding: '20px', textAlign: 'center', color: 'white' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '12px' }}>Application Error</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>A runtime exception occurred in the worker. This has been logged.</p>
        <a href="/" className="btn-secondary" style={{ padding: '10px 20px', textDecoration: 'none', borderRadius: '8px', display: 'inline-block' }}>
          Return Home
        </a>
      </div>
    );
  }
}
