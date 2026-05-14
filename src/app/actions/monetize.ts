'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getMonetizationDataAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const db = supabase as any;

    // Fetch user profile
    const { data: rawProfile, error: profError } = await db
      .from('profiles')
      .select('id, username, full_name, avatar_url, coins, referral_code, referred_by, total_earnings, is_creator, wallet_balance, payout_account')
      .eq('id', user.id)
      .single();

    if (profError) throw profError;
    const profile = rawProfile as any;

    // Ensure referral code exists
    let refCode = profile.referral_code;
    if (!refCode) {
      refCode = `${profile.username || 'user'}_${Math.random().toString(36).substring(2, 6)}`.toUpperCase();
      await db.from('profiles').update({ referral_code: refCode }).eq('id', user.id);
      profile.referral_code = refCode;
    }

    // Fetch user's communities to configure pricing
    const { data: communities } = await db
      .from('communities')
      .select('*')
      .eq('creator_id', user.id);

    // Fetch user's active subscriptions to communities
    const { data: subscriptions } = await db
      .from('subscriptions')
      .select('*, community:communities(name, color, subscription_price)')
      .eq('subscriber_id', user.id)
      .eq('status', 'active');

    // Fetch platform posts created by user to boost
    const { data: posts } = await db
      .from('posts')
      .select('id, content, media_urls, like_count, comment_count, is_boosted, boost_coins, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    // Fetch total subscription payouts earned as a creator
    const { data: subscriberCount } = await db
      .from('subscriptions')
      .select('id', { count: 'exact' })
      .eq('creator_id', user.id)
      .eq('status', 'active');

    return { 
      success: true, 
      profile, 
      communities: communities || [], 
      subscriptions: subscriptions || [],
      posts: posts || [],
      subscriberCount: subscriberCount || 0
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function applyFriendReferralAction(friendCode: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const db = supabase as any;
    const cleanCode = friendCode.trim().toUpperCase();

    // Fetch current user profile
    const { data: rawCurrentUser } = await db.from('profiles').select('referred_by, referral_code, coins').eq('id', user.id).single();
    const currentUser = rawCurrentUser as any;
    if (!currentUser) return { success: false, error: 'Profile not found' };

    if (currentUser.referred_by) {
      return { success: false, error: 'You have already used a referral code!' };
    }

    if (currentUser.referral_code?.toUpperCase() === cleanCode) {
      return { success: false, error: 'You cannot refer yourself!' };
    }

    // Find friend profile
    const { data: rawFriendProfile } = await db
      .from('profiles')
      .select('id, coins')
      .ilike('referral_code', cleanCode)
      .single();
    const friendProfile = rawFriendProfile as any;

    if (!friendProfile) {
      return { success: false, error: 'Invalid referral code. Please check and try again.' };
    }

    // Reward both users with 100 coins each!
    // Update current user
    await db.from('profiles').update({ 
      referred_by: friendProfile.id,
      coins: (currentUser.coins || 0) + 100
    }).eq('id', user.id);

    // Update friend user
    await db.from('profiles').update({ 
      coins: (friendProfile.coins || 0) + 100
    }).eq('id', friendProfile.id);

    revalidatePath('/monetize');
    return { success: true, message: 'Referral applied successfully! Both you and your friend received 100 coins 🎉' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCommunitySubscriptionPriceAction(communityId: string, priceINR: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    const db = supabase as any;

    const { error } = await db
      .from('communities')
      .update({ subscription_price: priceINR })
      .eq('id', communityId)
      .eq('creator_id', user.id);

    if (error) throw error;

    revalidatePath('/monetize');
    revalidatePath(`/communities/${communityId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createRazorpayOrderAction(amountINR: number, type: 'buy_coins' | 'subscribe_community' | 'boost_reel', targetId?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    const db = supabase as any;

    // Generate a mock secure Razorpay order_id
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const { error } = await db.from('razorpay_orders').insert({
      order_id: orderId,
      user_id: user.id,
      amount: amountINR,
      currency: 'INR',
      type: type,
      target_id: targetId || '',
      status: 'created'
    });

    if (error) throw error;

    return { 
      success: true, 
      orderId, 
      amount: amountINR,
      key: 'rzp_test_mockPremiumKeyIndicoPlatform' 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function verifyRazorpayPaymentAction(orderId: string, paymentId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    const db = supabase as any;

    // Fetch order details
    const { data: order } = await db.from('razorpay_orders').select('*').eq('order_id', orderId).single();
    if (!order) return { success: false, error: 'Order not found' };

    if (order.status === 'completed') {
      return { success: true, message: 'Already processed' };
    }

    // Mark order completed
    await db.from('razorpay_orders').update({ status: 'completed' }).eq('order_id', orderId);

    // Fetch user profile
    const { data: rawProfile } = await db.from('profiles').select('coins, total_earnings').eq('id', user.id).single();
    const profile = rawProfile as any;

    if (order.type === 'buy_coins') {
      // 80 INR gives 100 coins
      const coinsBought = Math.round((order.amount / 80) * 100);
      await db.from('profiles').update({
        coins: (profile?.coins || 0) + coinsBought
      }).eq('id', user.id);
    } 
    else if (order.type === 'subscribe_community') {
      const communityId = order.target_id;
      // Get community details
      const { data: rawComm } = await db.from('communities').select('creator_id, subscription_price').eq('id', communityId).single();
      const comm = rawComm as any;
      if (comm) {
        // Create active subscription for 30 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await db.from('subscriptions').insert({
          subscriber_id: user.id,
          creator_id: comm.creator_id,
          community_id: communityId,
          amount: order.amount,
          status: 'active',
          expires_at: expiresAt.toISOString()
        });

        // Revenue split: 70% creator, 30% indico
        const creatorShare = order.amount * 0.70;
        // Update creator earnings
        const { data: rawCreatorProf } = await db.from('profiles').select('total_earnings, wallet_balance').eq('id', comm.creator_id).single();
        const creatorProf = rawCreatorProf as any;
        if (creatorProf) {
          await db.from('profiles').update({
            total_earnings: (creatorProf.total_earnings || 0) + creatorShare,
            wallet_balance: (creatorProf.wallet_balance || 0) + creatorShare
          }).eq('id', comm.creator_id);
        }

        // Auto join community as member
        await db.from('community_members').insert({
          community_id: communityId,
          user_id: user.id,
          status: 'joined',
          role: 'member'
        });
      }
    }
    else if (order.type === 'boost_reel') {
      const postId = order.target_id;
      // Directly mark post as boosted
      const { data: rawPost } = await db.from('posts').select('boost_coins').eq('id', postId).single();
      const post = rawPost as any;
      if (post) {
        await db.from('posts').update({
          is_boosted: true,
          boost_coins: (post.boost_coins || 0) + 200
        }).eq('id', postId);
      }
    }

    revalidatePath('/monetize');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function boostReelWithCoinsAction(postId: string, coinsCost: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    const db = supabase as any;

    // Check balance
    const { data: rawProfile } = await db.from('profiles').select('coins').eq('id', user.id).single();
    const profile = rawProfile as any;
    if (!profile || (profile.coins || 0) < coinsCost) {
      return { success: false, error: 'Insufficient coins balance. Please buy coins first!' };
    }

    // Deduct coins
    await db.from('profiles').update({
      coins: profile.coins - coinsCost
    }).eq('id', user.id);

    // Boost reel
    const { data: rawPost } = await db.from('posts').select('boost_coins').eq('id', postId).single();
    const post = rawPost as any;
    if (post) {
      await db.from('posts').update({
        is_boosted: true,
        boost_coins: (post.boost_coins || 0) + coinsCost
      }).eq('id', postId);
    }

    revalidatePath('/monetize');
    revalidatePath('/trending');
    return { success: true, message: 'Reel boosted successfully! Indico platform earned from boost 🚀' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePayoutAccountAction(payoutAccount: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    const db = supabase as any;

    const { error } = await db.from('profiles').update({ payout_account: payoutAccount }).eq('id', user.id);
    if (error) throw error;

    revalidatePath('/monetize');
    return { success: true, message: 'Payout account updated successfully!' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function withdrawFundsAction(amount: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };
    const db = supabase as any;

    const { data: rawProfile } = await db.from('profiles').select('wallet_balance, payout_account').eq('id', user.id).single();
    const profile = rawProfile as any;

    if (!profile.payout_account) {
      return { success: false, error: 'Please set up a payout account first' };
    }

    if (!profile.wallet_balance || profile.wallet_balance < amount) {
      return { success: false, error: 'Insufficient funds for withdrawal' };
    }

    // Process withdrawal
    await db.from('profiles').update({
      wallet_balance: profile.wallet_balance - amount
    }).eq('id', user.id);

    revalidatePath('/monetize');
    return { success: true, message: `Withdrawal of ₹${amount} initiated successfully to ${profile.payout_account}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
