import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://indicosocial.in';
  const supabase = await createClient();

  // Static routes
  const staticRoutes = [
    '',
    '/explore',
    '/trending',
    '/communities',
    '/auth',
    '/live',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Dynamic Profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .limit(100);

  const profileRoutes = (profiles || []).map((p) => ({
    url: `${baseUrl}/profile/${p.id}`,
    lastModified: new Date(p.updated_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // Dynamic Posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, created_at')
    .eq('moderation_status', 'approved')
    .is('community_id', null)
    .limit(100);

  const postRoutes = (posts || []).map((p) => ({
    url: `${baseUrl}/post/${p.id}`,
    lastModified: new Date(p.created_at || new Date()),
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  return [...staticRoutes, ...profileRoutes, ...postRoutes];
}
