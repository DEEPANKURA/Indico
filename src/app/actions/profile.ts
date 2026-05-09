'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfileAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const fullName = formData.get('full_name') as string;
    let username = formData.get('username') as string;
    const bio = formData.get('bio') as string;
    const website = formData.get('website') as string;

    // Ensure username is not empty and remove @ if present
    username = username?.replace('@', '').trim();
    if (!username) {
      username = user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 5)}`;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id,
        full_name: fullName, 
        username, 
        bio, 
        website, 
        updated_at: new Date().toISOString() 
      });

    if (error) throw error;
    revalidatePath('/profile');
    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    console.error('Update Profile Error:', err);
    return { success: false, error: err.message };
  }
}

export async function uploadAvatarAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const file = formData.get('avatar');
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: 'No valid image file provided' };
    }

    // File size limit: 2MB (Next.js config also updated to 4MB to be safe)
    if (file.size > 2 * 1024 * 1024) {
      return { success: false, error: 'File size too large. Max 2MB allowed.' };
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${user.id}/avatar_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    // Add a cache-buster to the URL itself
    const avatarUrlWithVersion = `${publicUrl}?v=${Date.now()}`;

    // ROOT CAUSE FIX: Use .update() instead of .upsert() if possible, 
    // or ensure we don't overwrite other fields by only targeting specific columns.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: avatarUrlWithVersion, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', user.id);

    if (updateError) {
      // If update fails (e.g. profile doesn't exist yet), try upsert as fallback
      const username = user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 5)}`;
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          username: username,
          avatar_url: avatarUrlWithVersion, 
          updated_at: new Date().toISOString() 
        });
      if (upsertError) throw upsertError;
    }

    // Update Auth Metadata so all components see the change
    await supabase.auth.updateUser({
      data: { avatar_url: avatarUrlWithVersion }
    });
    
    revalidatePath('/profile');
    revalidatePath('/settings');
    revalidatePath('/');
    
    return { success: true, avatarUrl: avatarUrlWithVersion };
  } catch (err: any) {
    console.error('Avatar Upload Error:', err);
    return { success: false, error: err.message };
  }
}

export async function uploadMediaAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    const type = formData.get('type') as string; // 'photo' | 'video' | 'reel'

    if (!file || file.size === 0) return { success: false, error: 'No file provided' };

    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);

    // Create the post with media
    const isVideo = ['mp4', 'webm', 'mov', 'quicktime'].includes(ext?.toLowerCase() || '');
    const { error: postError } = await supabase.from('posts').insert({
      author_id: user.id,
      content: caption,
      media_urls: [publicUrl],
      ai_safety_score: 100,
      is_flagged: false,
    });

    if (postError) throw postError;
    revalidatePath('/');
    revalidatePath('/profile');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
export async function createStoryAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const mediaUrl = formData.get('media_url') as string;
    const mediaType = formData.get('media_type') as string;
    const overlayText = formData.get('overlay_text') as string;
    const textColor = formData.get('text_color') as string;
    const textX = parseFloat(formData.get('text_x') as string || '50');
    const textY = parseFloat(formData.get('text_y') as string || '50');
    const mentionsStr = formData.get('mentions') as string;
    const mentions = mentionsStr ? mentionsStr.split(',') : [];

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
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select('*, profiles:user_id(username, avatar_url)')
      .single();

    if (error) throw error;
    revalidatePath('/');
    return { success: true, story: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
