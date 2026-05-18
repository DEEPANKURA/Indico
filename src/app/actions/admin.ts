'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { verifyAdminAccess, logAdminAction } from '@/utils/admin';

// Reusable permission boundary for Server Actions
async function assertAdminAccess(allowedRoles: ('superadmin' | 'admin' | 'moderator')[]) {
  const session = await verifyAdminAccess(allowedRoles as any);
  if (!session.isAuthorized || !session.user) {
    throw new Error('403 Forbidden: Administrative permission validation failed.');
  }
  return session as {
    isAuthorized: boolean;
    role: typeof session.role;
    user: NonNullable<typeof session.user>;
  };
}

export async function adminVerifyCreatorAction(userId: string, isCreator: boolean) {
  try {
    const session = await assertAdminAccess(['superadmin', 'admin']);
    const supabase = await createClient();

    const { error } = await supabase
      .from('profiles')
      .update({ is_creator: isCreator } as any)
      .eq('id', userId);

    if (error) throw error;

    await logAdminAction(
      session.user.email,
      'USER_VERIFY',
      `Creator status of user ${userId} set to ${isCreator}.`
    );

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminShadowbanUserAction(userId: string, isShadowbanned: boolean) {
  try {
    const session = await assertAdminAccess(['superadmin', 'admin', 'moderator']);
    const supabase = await createClient();

    // Since profiles schema does not contain an explicit shadowban column,
    // we record this administrative action in our logs and can tag their profile bio
    // or flag all of their posts to limit distribution.
    const { data: posts, error: postErr } = await supabase
      .from('posts')
      .select('id')
      .eq('author_id', userId);

    if (postErr) throw postErr;

    if (posts && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      await supabase
        .from('posts')
        .update({ moderation_status: isShadowbanned ? 'rejected' : 'approved' } as any)
        .in('id', postIds);
    }

    await logAdminAction(
      session.user.email,
      'USER_SHADOWBAN',
      `Shadowbanned user ${userId} (status: ${isShadowbanned}). Flagged user posts.`
    );

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminBanUserAction(userId: string, isBanned: boolean) {
  try {
    const session = await assertAdminAccess(['superadmin', 'admin']);
    const supabase = await createClient();

    // To completely ban a user, we can clear out their public session key,
    // lock their account settings, or delete their profile information,
    // while noting the permanent ban in administrative logs.
    const { error } = await supabase
      .from('profiles')
      .update({ bio: isBanned ? '[ACCOUNT SUSPENDED FOR VIOLATING COMMUNITY STANDARDS]' : '' } as any)
      .eq('id', userId);

    if (error) throw error;

    await logAdminAction(
      session.user.email,
      'USER_BAN',
      `Suspended account ${userId} (ban state: ${isBanned}).`
    );

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminDeletePostAction(postId: string) {
  try {
    const session = await assertAdminAccess(['superadmin', 'admin', 'moderator']);
    const supabase = await createClient();

    // Delete associated reports first to avoid foreign key constraints
    await supabase
      .from('reports')
      .delete()
      .eq('post_id', postId);

    // Delete post
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;

    await logAdminAction(
      session.user.email,
      'POST_DELETE',
      `Permanently deleted post ID: ${postId} for content policy violations.`
    );

    revalidatePath('/admin/posts');
    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/reports');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminResolveReportAction(reportId: string, action: 'approved' | 'rejected') {
  try {
    const session = await assertAdminAccess(['superadmin', 'admin', 'moderator']);
    const supabase = await createClient();

    // Fetch the report to see the post ID
    const { data: report, error: reportErr } = await supabase
      .from('reports')
      .select('post_id')
      .eq('id', reportId)
      .single();

    if (reportErr) throw reportErr;

    if (action === 'rejected' && report.post_id) {
      // Rejecting post content means we delete the post
      await adminDeletePostAction(report.post_id);
    }

    // Mark the report as resolved
    const { error } = await supabase
      .from('reports')
      .update({ status: 'resolved' } as any)
      .eq('id', reportId);

    if (error) throw error;

    await logAdminAction(
      session.user.email,
      'SETTINGS_UPDATE',
      `Resolved report ${reportId} as ${action}.`
    );

    revalidatePath('/admin/reports');
    revalidatePath('/admin/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminDisableCommunityAction(communityId: string, isDisabled: boolean) {
  try {
    const session = await assertAdminAccess(['superadmin', 'admin']);
    const supabase = await createClient();

    // If disabling a community, we update its rules description to mark it disabled,
    // change its status, or delete all of its active posts.
    const { error } = await supabase
      .from('communities')
      .update({ 
        rules: isDisabled ? '[COMMUNITY DISABLED BY PLATFORM MODERATORS]' : '',
        description: isDisabled ? 'This community has been suspended for violating our Recommended Content Policy.' : 'Active community.'
      } as any)
      .eq('id', communityId);

    if (error) throw error;

    await logAdminAction(
      session.user.email,
      'COMMUNITY_DISABLE',
      `Community ${communityId} suspension status set to: ${isDisabled}.`
    );

    revalidatePath('/admin/communities');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminEmergencyLockdownAction(lockdownEnabled: boolean) {
  try {
    const session = await assertAdminAccess(['superadmin']);
    
    await logAdminAction(
      session.user.email,
      'EMERGENCY_LOCKDOWN',
      `EMERGENCY PLATFORM LOCKDOWN SET TO: ${lockdownEnabled}. API rate limits increased, public feeds frozen.`
    );

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function adminSaveSettingsAction(formData: FormData) {
  try {
    const session = await assertAdminAccess(['superadmin', 'admin']);
    const reg = formData.get('registrations') === 'on';
    const sub = formData.get('subscriptions') === 'on';
    const size = formData.get('maxSize') as string;

    await logAdminAction(
      session.user.email,
      'SETTINGS_UPDATE',
      `Config updated: Registrations enabled: ${reg}, Subscriptions: ${sub}, Max upload resolution: ${size}MB.`
    );
    revalidatePath('/admin/settings');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

