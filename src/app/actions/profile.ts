'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );
}

export async function updateProfileAction(formData: FormData) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const fullName = formData.get('full_name') as string;
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
      });

    if (error) throw error;
    revalidatePath('/profile');
    revalidatePath('/settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function uploadAvatarAction(formData: FormData) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const file = formData.get('avatar') as File;
    if (!file || file.size === 0) return { success: false, error: 'No file provided' };

    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id,
        avatar_url: publicUrl, 
        updated_at: new Date().toISOString() 
      });

    if (updateError) throw updateError;
    revalidatePath('/profile');
    revalidatePath('/settings');
    return { success: true, avatarUrl: publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function uploadMediaAction(formData: FormData) {
  try {
    const supabase = await getSupabase();
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
    const supabase = await getSupabase();
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
