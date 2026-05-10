'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabase() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase environment variables are missing');
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
      },
    },
  });
}

export async function createCommunityAction(formData: {
  name: string;
  description: string;
  category: string;
  isPublic: boolean;
  color: string;
}) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('communities')
      .insert({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        is_public: formData.isPublic,
        color: formData.color,
        creator_id: user.id
      })
      .select()
      .single();

    if (error) throw error;

    // Auto join as creator with owner role
    await supabase.from('community_members').insert({
      community_id: data.id,
      user_id: user.id,
      role: 'owner',
      status: 'joined'
    });

    revalidatePath('/communities');
    return { success: true, community: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function joinCommunityAction(communityId: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Check if community is public or private
    const { data: community, error: commError } = await supabase
      .from('communities')
      .select('is_public')
      .eq('id', communityId)
      .single();

    if (commError) throw commError;

    const { error } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: user.id,
        status: community.is_public ? 'joined' : 'pending',
        role: 'member'
      });

    if (error) throw error;

    revalidatePath(`/communities/${communityId}`);
    return { success: true, status: community.is_public ? 'joined' : 'pending' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function leaveCommunityAction(communityId: string) {
  try {
    console.log('leaveCommunityAction called for:', communityId);
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('leaveCommunityAction: No user found');
      return { success: false, error: 'Unauthorized' };
    }
    console.log('leaveCommunityAction: User is', user.id);

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);

    if (error) {
      console.error('leaveCommunityAction Error:', error);
      throw error;
    }

    console.log('leaveCommunityAction: Success');
    revalidatePath(`/communities/${communityId}`);
    revalidatePath('/communities');
    return { success: true };
  } catch (error: any) {
    console.error('leaveCommunityAction Catch Error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteCommunityAction(communityId: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Delete members first
    await supabase.from('community_members').delete().eq('community_id', communityId);
    
    // Delete posts
    await supabase.from('posts').delete().eq('community_id', communityId);

    // Delete community
    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId)
      .eq('creator_id', user.id);

    if (error) throw error;

    revalidatePath('/communities');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPendingRequestsAction(communityId: string) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('community_members')
      .select('*, profiles(username, avatar_url, full_name)')
      .eq('community_id', communityId)
      .eq('status', 'pending');

    if (error) throw error;
    return { success: true, requests: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function handleJoinRequestAction(communityId: string, userId: string, accept: boolean) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify current user is owner/moderator or the creator
    const [{ data: member }, { data: community }] = await Promise.all([
      supabase.from('community_members').select('role').eq('community_id', communityId).eq('user_id', user.id).single(),
      supabase.from('communities').select('creator_id').eq('id', communityId).single()
    ]);

    const isAuthorized = (member && ['owner', 'moderator'].includes(member.role)) || (community?.creator_id === user.id);

    if (!isAuthorized) {
      return { success: false, error: 'Only owners or moderators can manage requests' };
    }

    if (accept) {
      const { error } = await supabase
        .from('community_members')
        .update({ status: 'joined' })
        .eq('community_id', communityId)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('community_members')
        .delete()
        .eq('community_id', communityId)
        .eq('user_id', userId);
      if (error) throw error;
    }

    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFollowingListForInviteAction(communityId: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Get people user follows
    const { data: following, error } = await supabase
      .from('follows')
      .select('following_id, profiles!follows_following_id_fkey(id, username, avatar_url, full_name)')
      .eq('follower_id', user.id);

    if (error) throw error;

    // Get existing members to filter them out
    const { data: existingMembers } = await supabase
      .from('community_members')
      .select('user_id')
      .eq('community_id', communityId);

    const memberIds = new Set(existingMembers?.map(m => m.user_id) || []);
    
    const inviteable = following
      ?.map(f => f.profiles)
      .filter((p: any) => p && !memberIds.has(p.id)) || [];

    return { success: true, users: inviteable };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function inviteToCommunityAction(communityId: string, userId: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify current user is owner/moderator or the creator
    const [{ data: member }, { data: community }] = await Promise.all([
      supabase.from('community_members').select('role').eq('community_id', communityId).eq('user_id', user.id).single(),
      supabase.from('communities').select('creator_id').eq('id', communityId).single()
    ]);

    const isAuthorized = (member && ['owner', 'moderator'].includes(member.role)) || (community?.creator_id === user.id);

    if (!isAuthorized) {
      return { success: false, error: 'Only owners or moderators can invite members' };
    }

    const { error } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: userId,
        status: 'joined', // Directly add them for now as requested "add members from following lists"
        role: 'member'
      });

    if (error) throw error;

    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function kickMemberAction(communityId: string, userId: string) {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;
    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function setMemberRoleAction(communityId: string, userId: string, role: 'owner' | 'moderator' | 'member') {
  try {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { error } = await supabase
      .from('community_members')
      .update({ role })
      .eq('community_id', communityId)
      .eq('user_id', userId);

    if (error) throw error;
    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCommunitiesAction() {
  try {
    const supabase = await getSupabase();
    
    const { data, error } = await supabase
      .from('communities')
      .select('*, community_members(user_id, status)')
      .order('member_count', { ascending: false });

    if (error) throw error;
    
    return { success: true, communities: data || [] };
  } catch (error: any) {
    console.error('getCommunitiesAction error:', error);
    return { success: false, error: error.message };
  }
}
