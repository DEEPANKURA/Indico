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

    // Auto join as creator
    await supabase.from('community_members').insert({
      community_id: data.id,
      user_id: user.id
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

    const { error } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: user.id
      });

    if (error) throw error;

    revalidatePath('/communities');
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
      .select('*, community_members(user_id)')
      .order('member_count', { ascending: false });

    if (error) throw error;
    return { success: true, communities: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
