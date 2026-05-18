import { createClient } from '@/utils/supabase/server';
import { 
  adminVerifyCreatorAction, adminShadowbanUserAction, adminBanUserAction 
} from '@/app/actions/admin';
import { Search, ShieldAlert, BadgeCheck, Ban, Check, UserMinus } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }> 
}) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q || '';

  const supabase = await createClient();

  // Search profiles matching query in username or full_name
  let dbQuery = supabase.from('profiles').select('*');
  
  if (q) {
    dbQuery = dbQuery.or(`username.ilike.%${q}%,full_name.ilike.%${q}%`);
  }

  const { data: rawUsers } = await dbQuery.limit(30);
  const users = (rawUsers || []) as any[];


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
            Users Control Center
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
            Search profiles, modify creator credentials, suspend accounts, and configure shadowbans.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <form method="GET" style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
        <input 
          type="text" 
          name="q"
          placeholder="Search by username or name..."
          defaultValue={q}
          style={{
            width: '100%', padding: '12px 16px 12px 42px', borderRadius: '12px',
            background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)',
            color: 'white', fontSize: '0.9rem', outline: 'none'
          }}
        />
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#64748b' }} />
      </form>

      {/* User Table Grid */}
      <div style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b' }}>User Identity</th>
              <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b' }}>Account Class</th>
              <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b' }}>Wallet Balance</th>
              <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b' }}>Moderation Badges</th>
              <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '48px', color: '#64748b', textAlign: 'center' }}>
                  No profiles matching search parameters.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSuspended = (user.bio || '').includes('[ACCOUNT SUSPENDED');
                const verifyAction = adminVerifyCreatorAction.bind(null, user.id, !user.is_creator);
                const shadowAction = adminShadowbanUserAction.bind(null, user.id, true);
                const banAction = adminBanUserAction.bind(null, user.id, !isSuspended);

                return (
                  <tr 
                    key={user.id} 
                    style={{ 
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isSuspended ? 'rgba(239, 68, 68, 0.02)' : 'transparent'
                    }}
                  >
                    {/* User Identity cell */}
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '700', fontSize: '0.85rem'
                        }}>
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            @{user.username}
                            {user.is_creator && <BadgeCheck size={16} style={{ color: '#00f0ff' }} />}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.full_name || 'No full name'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Account Class */}
                    <td style={{ padding: '18px 24px' }}>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: '700',
                        color: user.is_creator ? '#00f0ff' : '#94a3b8',
                        background: user.is_creator ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.04)',
                        padding: '4px 8px', borderRadius: '6px'
                      }}>
                        {user.is_creator ? 'CREATOR' : 'MEMBER'}
                      </span>
                    </td>

                    {/* Wallet Balance */}
                    <td style={{ padding: '18px 24px', fontWeight: '700', color: 'white' }}>
                      ₹{parseFloat(user.wallet_balance || '0.00').toFixed(2)}
                    </td>

                    {/* Status Badges */}
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isSuspended && (
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            SUSPENDED
                          </span>
                        )}
                        {!isSuspended && (
                          <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions buttons */}
                    <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        
                        {/* Toggle Creator Verified badge */}
                        <form action={verifyAction}>
                          <button 
                            type="submit" 
                            title={user.is_creator ? "Revoke Creator Status" : "Promote to Creator"}
                            style={{
                              padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                              background: user.is_creator ? 'rgba(0,240,255,0.1)' : 'rgba(255,255,255,0.03)',
                              color: user.is_creator ? '#00f0ff' : '#64748b'
                            }}
                          >
                            <BadgeCheck size={16} />
                          </button>
                        </form>

                        {/* Toggle Shadowban */}
                        <form action={shadowAction}>
                          <button 
                            type="submit" 
                            title="Shadowban User"
                            style={{
                              padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                              background: 'rgba(255,255,255,0.03)', color: '#eab308'
                            }}
                          >
                            <ShieldAlert size={16} />
                          </button>
                        </form>

                        {/* Toggle Suspension/Ban */}
                        <form action={banAction}>
                          <button 
                            type="submit" 
                            title={isSuspended ? "Unsuspend Account" : "Suspend Account"}
                            style={{
                              padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                              background: isSuspended ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: isSuspended ? '#10b981' : '#ef4444'
                            }}
                          >
                            {isSuspended ? <Check size={16} /> : <Ban size={16} />}
                          </button>
                        </form>

                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
