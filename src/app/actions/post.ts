'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function createPostAction(
  content: string, 
  mediaUrls: string[] = [], 
  communityId?: string,
  musicInfo?: { url: string; title: string; artist: string; startTime?: number }
) {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'You must be logged in to post' };
    }

    // Safety check for content
    const containsBannedWords = ['bannedword1', 'bannedword2'].some(word => 
      content.toLowerCase().includes(word)
    );

    if (containsBannedWords) {
      // In a real app, we'd log this or use a more sophisticated AI moderation service
    }

    const { data: post, error: insertError } = await supabase.from('posts').insert({
      author_id: user.id,
      content,
      media_urls: mediaUrls,
      community_id: communityId || null,
      music_url: musicInfo?.url || null,
      music_title: musicInfo?.title || null,
      music_artist: musicInfo?.artist || null,
      music_start_time: musicInfo?.startTime || 0
    }).select().single();

    if (insertError) throw insertError;

    // Trigger AI Moderation background check (mocking the flow)
    // In a real implementation, this would call a moderation Edge Function
    const isFlagged = content.length > 500; // Mock flag for long content

    if (isFlagged) {
      await supabase.from('posts').update({ is_flagged: true }).eq('id', post.id);
    }

    revalidatePath('/');
    if (communityId) revalidatePath(`/communities/${communityId}`);

    return { 
      success: true, 
      post, 
      isFlagged 
    };
  } catch (error: any) {
    console.error('Create post error:', error);
    return { success: false, error: error.message };
  }
}

export async function getPostsAction(communityId?: string) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('posts')
      .select('*, author:profiles(username, avatar_url)')
      .order('created_at', { ascending: false });

    if (communityId) {
      query = query.eq('community_id', communityId);
    } else {
      query = query.is('community_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { success: true, posts: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
