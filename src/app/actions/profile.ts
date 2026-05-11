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

    // File size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'File size too large. Max 10MB allowed.' };
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${user.id}/avatar_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrlWithVersion = `${publicUrl}?v=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        avatar_url: avatarUrlWithVersion, 
        updated_at: new Date().toISOString() 
      } as any)
      .eq('id', user.id);

    if (updateError) {
      const username = user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 5)}`;
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
