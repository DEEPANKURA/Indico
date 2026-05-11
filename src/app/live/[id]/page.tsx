import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import LivePlayer from './LivePlayer';

export default async function WatchLivePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch session on server
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch stream data on server
  const { data: stream, error } = await supabase
    .from('live_streams')
    .select(`
      *,
      profiles:streamer_id(username, full_name, avatar_url, bio)
    `)
    .eq('id', id)
    .single();

  if (error || !stream) {
    redirect('/live');
  }

  // Generate the video source URL securely on the server
  // This way the token is part of a URL string but not a separate state variable in the client
  const vimeoToken = process.env.VIMEO_SAMPLE_TOKEN || '57447761';
  const videoSource = `https://player.vimeo.com/external/494449711.sd.mp4?s=0cf2e434850d53c6145326771d9d784a861f6eb2&profile_id=165&oauth2_token_id=${vimeoToken}`;

  return (
    <LivePlayer 
      id={id} 
      stream={stream} 
      videoSource={videoSource} 
      initialViewers={stream.viewer_count || 0}
      currentUser={user}
    />
  );
}
