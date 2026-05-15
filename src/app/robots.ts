import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://indico.live';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/settings/', '/studio/', '/upload/', '/messages/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
