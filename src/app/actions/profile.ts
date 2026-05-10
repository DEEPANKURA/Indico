'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfileAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const fullName = formData.get('fullName') as string;
    const username = formData.get('username') as string;
    const bio = formData.get('bio') as string;
    const website = formData.get('website') as string;

    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id,
        full_name: fullName, 
        username, 
        bio, 
        website, 
        updated_at: new Date().toISOString() 
      } as any);

    if (error) throw error;
    revalidatePath('/profile');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAvatarAction(avatarUrl: string, username?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Add a timestamp or version to the avatar URL to bust cache
    const avatarUrlWithVersion = `${avatarUrl}${avatarUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;

    // 1. Update the profile with the new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: avatarUrlWithVersion, 
        updated_at: new Date().toISOString() 
      } as any)
      .eq('id', user.id);

    if (updateError) {
      // If profile doesn't exist yet, upsert it
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          username: username,
          avatar_url: avatarUrlWithVersion, 
          updated_at: new Date().toISOString() 
        } as any);
      if (upsertError) throw upsertError;
    }

    revalidatePath('/profile');
    return { success: true, avatarUrl: avatarUrlWithVersion };
  } catch (error: any) {
    console.error('Avatar update error:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadPostAction(publicUrl: string, caption: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error: postError } = await supabase.from('posts').insert({
      author_id: user.id,
      content: caption,
      media_urls: [publicUrl],
      ai_safety_score: 100,
      is_flagged: false,
    } as any);

    if (postError) throw postError;
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createStoryAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const mediaUrl = formData.get('media_url') as string;
    const mediaType = formData.get('media_type') as 'image' | 'video';
    const overlayText = formData.get('overlay_text') as string;
    const textColor = formData.get('text_color') as string;
    const textX = Number(formData.get('text_x'));
    const textY = Number(formData.get('text_y'));
    const mentions = JSON.parse(formData.get('mentions') as string || '[]');

    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: user.id,
        media_url: mediaUrl,
        media_type: mediaType,
        overlay_text: overlayText,
        text_color: textColor,
        text_x: textX,
        text_y: textY,
        mentions: mentions,
        music_url: formData.get('music_url') as string || null,
        music_title: formData.get('music_title') as string || null,
        music_artist: formData.get('music_artist') as string || null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      } as any)
      .select('*, profiles:user_id(username, avatar_url)')
      .single();

    if (error) throw error;
    revalidatePath('/');
    return { success: true, story: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
