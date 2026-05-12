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
      } as any);

    if (error) throw error;
    revalidatePath('/profile');
    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    console.error('Update Profile Error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateAvatarUrlAction(url: string) {
  try {
    const supabase = await createClient();
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: url, 
        updated_at: new Date().toISOString() 
      } as any)
      .eq('id', user.id);

    if (updateError) throw updateError;

    await supabase.auth.updateUser({
      data: { avatar_url: url }
    });
    
    revalidatePath('/profile');
    revalidatePath('/settings');
    revalidatePath('/');
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function uploadAvatarAction(formData: FormData) {
  // Legacy server-side upload updated to use Cloudinary directly
  try {
    const supabase = await createClient();
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;
    if (!user) return { success: false, error: 'Unauthorized' };

    const file = formData.get('avatar');
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: 'No valid image file provided' };
    }

    // File size limit: 10MB (but Netlify might reject at 6MB)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size too large. Max 10MB allowed.' };
    }

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${file.type};base64,${base64Data}`;

    const { getCloudinarySignatureAction } = await import('./cloudinary');
    const sigData = await getCloudinarySignatureAction('avatars');
    if (!sigData.success) {
      return { success: false, error: sigData.error };
    }

    const cdFormData = new FormData();
    cdFormData.append('file', dataUri);
    cdFormData.append('api_key', sigData.apiKey!);
    cdFormData.append('timestamp', sigData.timestamp!.toString());
    cdFormData.append('signature', sigData.signature!);
    cdFormData.append('folder', 'avatars');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${sigData.cloudName}/auto/upload`;
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: cdFormData,
    });
    const resultData = await response.json();
    if (!response.ok) {
      throw new Error(resultData.error?.message || 'Cloudinary upload failed');
    }

    const secureUrl = resultData.secure_url;
    const optimizedUrl = secureUrl.includes('/upload/') 
      ? secureUrl.replace('/upload/', '/upload/f_auto,q_auto/') 
      : secureUrl;
    const avatarUrlWithVersion = `${optimizedUrl}?v=${Date.now()}`;

    return await updateAvatarUrlAction(avatarUrlWithVersion);
  } catch (err: any) {
    console.error('Avatar Upload Error:', err);
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
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
