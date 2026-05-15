'use server';

import { createClient } from '@/utils/supabase/server';

export async function tipCreatorAction(postId: string, creatorId: string, amount: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // Simple transaction record
    const { error } = await supabase.from('transactions').insert({
      sender_id: user.id,
      recipient_id: creatorId,
      amount: amount,
      type: 'tip',
      transaction_type: 'tip',
      status: 'completed'
    });

    if (error) throw error;
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
