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
  const resolvedParams = await params;
  return <ProfileClient params={resolvedParams} />;
}
