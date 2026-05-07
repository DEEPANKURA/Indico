'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function tipCreatorAction(postId: string, creatorId: string, amount: number) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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
