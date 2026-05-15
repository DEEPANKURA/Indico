import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://indicosocial.in';
  
  // Static routes are always safe
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/explore',
    '/trending',
    '/communities',
    '/auth',
    '/live',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    const supabase = await createClient();

    // Fetch Dynamic Profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .limit(100);

    const profileRoutes = (profiles || []).map((p) => ({
      url: `${baseUrl}/profile/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    // Fetch Dynamic Posts
    const { data: posts } = await supabase
      .from('posts')
      .select('id, created_at')
      .eq('moderation_status', 'approved')
      .is('community_id', null)
      .limit(100);

    const postRoutes = (posts || []).map((p) => ({
      url: `${baseUrl}/post/${p.id}`,
      lastModified: p.created_at ? new Date(p.created_at) : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }));

    return [...staticRoutes, ...profileRoutes, ...postRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // If database fails, at least return static routes so the sitemap isn't empty or an error page
    return staticRoutes;
  }
}
