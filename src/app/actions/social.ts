'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { Database } from '@/lib/database.types';

async function getSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
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
      .maybeSingle();

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
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (existingFollow) {
      await supabase
        .from('follows')
        .delete()
        .match({ follower_id: user.id, following_id: targetUserId });
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

export async function addCommentAction(postId: string, content: string, parentId?: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('comments')
      .insert({ 
        post_id: postId, 
        user_id: user.id,
        content: content,
        parent_id: parentId
      })
      .select('*, profiles:user_id(full_name, avatar_url, username)')
      .single();

    if (error) throw error;
    return { success: true, comment: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCommentsAction(postId: string) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles:user_id(full_name, avatar_url, username)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true }); // Ascending for logical flow

    if (error) throw error;
    return { success: true, comments: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function searchUsersAction(query: string) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);

    if (error) throw error;
    return { success: true, users: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFriendsAction() {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Get following
    const { data: following } = await supabase
      .from('follows')
      .select('profiles:following_id(id, username, full_name, avatar_url)')
      .eq('follower_id', user.id);

    // Get followers
    const { data: followers } = await supabase
      .from('follows')
      .select('profiles:follower_id(id, username, full_name, avatar_url)')
      .eq('following_id', user.id);

    const friends = new Map();
    following?.forEach(f => {
      const profile = Array.isArray(f.profiles) ? f.profiles[0] : (f.profiles as any);
      if (profile?.id) friends.set(profile.id, profile);
    });
    followers?.forEach(f => {
      const profile = Array.isArray(f.profiles) ? f.profiles[0] : (f.profiles as any);
      if (profile?.id) friends.set(profile.id, profile);
    });

    return { success: true, users: Array.from(friends.values()) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendDirectMessageAction(recipientId: string, content: string, postId?: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: content,
        post_id: postId
      });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deletePostAction(postId: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Check ownership
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .maybeSingle();

    if (!post) return { success: false, error: 'Post not found' };
    if (post.author_id !== user.id) return { success: false, error: 'Unauthorized' };

    // Delete from DB
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/profile');
    revalidatePath('/explore');

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getJoinedCommunitiesAction() {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('community_members')
      .select('communities(*)')
      .eq('user_id', user.id);

    if (error) throw error;
    
    // Normalize data
    const communities = data?.map(d => {
      const comm = Array.isArray(d.communities) ? d.communities[0] : (d.communities as any);
      return comm;
    }).filter(Boolean);

    return { success: true, communities };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendCommunityMessageAction(communityId: string, content: string, postId?: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        community_id: communityId,
        content: content,
        post_id: postId || null
      });

    if (error) throw error;
    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
