'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { analyzeContentSafety } from '@/utils/moderation';

export async function createPostAction(
  content: string, 
  mediaUrls: string[], 
  communityId?: string,
  musicInfo?: { url: string; title: string; artist: string; startTime?: number; volume?: number },
  videoEditing?: { volume?: number; trimStart?: number; trimEnd?: number },
  tags: string[] = [],
  mentions: string[] = [],
  overlays: any = null,
  isExclusive: boolean = false
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    console.log('Inserting post with:', { author_id: user.id, community_id: communityId, is_exclusive: isExclusive });
    
    const { data: post, error: dbError } = await supabase.from('posts').insert({
      author_id: user.id,
      content,
      media_urls: mediaUrls,
      moderation_status: 'pending', // Always start as pending
      ai_confidence_score: 0,
      ai_safety_score: 100,
      is_flagged: false,
      community_id: communityId || null,
      is_exclusive: isExclusive,
      music_url: musicInfo?.url,
      music_title: musicInfo?.title,
      music_artist: musicInfo?.artist,
      music_start_time: musicInfo?.startTime || 0,
      music_volume: musicInfo?.volume ?? 0.5,
      video_volume: videoEditing?.volume ?? 1.0,
      video_trim_start: videoEditing?.trimStart ?? 0,
      video_trim_end: videoEditing?.trimEnd ?? null,
      tags: tags,
      mentions: mentions,
      overlays: overlays
    } as any).select().single();

    if (dbError) {
      console.error('Database insertion error:', dbError);
      return { success: false, error: `Database error: ${dbError.message}` };
    }

    return { success: true, isFlagged: false, postId: post.id };

    revalidatePath('/');
    revalidatePath('/studio');
    revalidatePath('/profile');
    revalidatePath('/trending');
    revalidatePath('/explore');
    return { success: true, isFlagged };
  } catch (error: any) {
    console.error('Create post error:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePostAction(postId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) return { success: false, error: error.message };
    
    revalidatePath('/');
    revalidatePath('/studio');
    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
