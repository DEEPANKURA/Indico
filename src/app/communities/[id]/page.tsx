import { Metadata, ResolvingMetadata } from 'next';
import { createClient } from '@/utils/supabase/server';
import CommunityClient from './CommunityClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: community } = await supabase
    .from('communities')
    .select('name, description, color, banner_url, is_public, is_exclusive, category')
    .eq('id', id)
    .single();

  if (!community) {
    return {
      title: 'Community Not Found | Indico',
    };
  }

  const name = community.name || 'Community';
  const description = community.description ? community.description.substring(0, 160) : `Join the ${name} community on Indico.`;

  const isSensitiveCategory = ['swimwear', 'beachwear', 'fitness', 'fashion', 'modeling', 'artistic', 'adult', 'nsfw'].includes(
    (community.category || '').toLowerCase()
  );

  const sensitiveKeywords = ['nudity', 'sensual', 'bikini', 'bikinis', 'swimwear', 'beachwear', 'artistic photography', 'fashion modeling', '18+', 'nsfw', 'adult'];
  const hasSensitiveKeywords = sensitiveKeywords.some(keyword => 
    (community.name || '').toLowerCase().includes(keyword) || 
    (community.description || '').toLowerCase().includes(keyword)
  );

  const isSensitive = !community.is_public || community.is_exclusive || isSensitiveCategory || hasSensitiveKeywords;

  return {
    title: `${name} Community | Indico`,
    description,
    robots: isSensitive ? {
      index: false,
      follow: false,
    } : undefined,
    openGraph: {
      title: `${name} on Indico`,
      description,
      images: community.banner_url ? [community.banner_url] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} Community`,
      description,
      images: community.banner_url ? [community.banner_url] : [],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <CommunityClient params={resolvedParams} />;
}
