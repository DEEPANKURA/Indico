import { createClient } from '@/utils/supabase/server';

export type AdminRole = 'user' | 'moderator' | 'admin' | 'superadmin';

export async function getAdminRole(email: string): Promise<AdminRole> {
  const superadmins = [
    'deepankura2001@gmail.com',
    'indicosocialprivacy@gmail.com',
    'deepankur.singh.indico@gmail.com',
    'admin@indico.social',
    'superadmin@indicosocial.in'
  ];
  
  const admins = [
    'indicosocialmarketing@gmail.com',
    'team@indicosocial.in'
  ];

  if (superadmins.includes(email.toLowerCase())) {
    return 'superadmin';
  }
  if (admins.includes(email.toLowerCase())) {
    return 'admin';
  }
  
  return 'user';
}

export interface AdminSession {
  isAuthorized: boolean;
  role: AdminRole;
  user: {
    id: string;
    email: string;
    username?: string;
    fullName?: string;
  } | null;
}

export async function verifyAdminAccess(requiredRoles: AdminRole[]): Promise<AdminSession> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !user.email) {
      return { isAuthorized: false, role: 'user', user: null };
    }

    const role = await getAdminRole(user.email);
    const isAuthorized = requiredRoles.includes(role);

    return {
      isAuthorized,
      role,
      user: {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || user.email.split('@')[0],
        fullName: user.user_metadata?.full_name || 'Admin Officer'
      }
    };
  } catch (error) {
    console.error('verifyAdminAccess Error:', error);
    return { isAuthorized: false, role: 'user', user: null };
  }
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export let auditLogsMemory: AuditLog[] = [
  {
    id: 'log-1',
    adminEmail: 'indicosocialprivacy@gmail.com',
    action: 'EMERGENCY_LOCKDOWN',
    details: 'System Lockdown status inspected and updated.',
    ipAddress: '103.45.21.144',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'log-2',
    adminEmail: 'indicosocialprivacy@gmail.com',
    action: 'USER_VERIFY',
    details: 'Verified creator badge issued to @beatmaker_prime',
    ipAddress: '103.45.21.144',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
    createdAt: new Date(Date.now() - 7200000).toISOString()
  }
];

export async function logAdminAction(adminEmail: string, action: string, details: string, ip: string = '127.0.0.1', ua: string = 'Server Agent') {
  const newLog: AuditLog = {
    id: `log-${Math.random().toString(36).substring(2, 11)}`,
    adminEmail,
    action,
    details,
    ipAddress: ip,
    userAgent: ua,
    createdAt: new Date().toISOString()
  };
  auditLogsMemory.unshift(newLog);
}
