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

export async function toggleLikeAction(postId: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Check if liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      await supabase.from('likes').delete().eq('id', existingLike.id);
      return { success: true, liked: false };
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      return { success: true, liked: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleFollowAction(targetUserId: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    if (user.id === targetUserId) return { success: false, error: 'Cannot follow yourself' };

    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .single();

    if (existingFollow) {
      await supabase.from('follows').delete().eq('id', existingFollow.id);
      revalidatePath('/profile/' + targetUserId);
      return { success: true, following: false };
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
      revalidatePath('/profile/' + targetUserId);
      return { success: true, following: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
