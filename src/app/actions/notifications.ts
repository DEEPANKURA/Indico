'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getNotificationsAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:actor_id(full_name, avatar_url, username)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return { success: false, error: error.message };
  return { success: true, notifications: data as any[] };
}

export async function markNotificationsAsReadAction() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true } as any)
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return { success: false, error: error.message };
  revalidatePath('/');
  return { success: true };
}

export async function saveSubscriptionAction(subscription: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ 
      user_id: user.id, 
      subscription 
    }, { onConflict: 'user_id,subscription' });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
