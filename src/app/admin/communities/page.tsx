import { createClient } from '@/utils/supabase/server';
import { adminDisableCommunityAction } from '@/app/actions/admin';
import { Globe, Users, ShieldAlert, Award, Power, PowerOff } from 'lucide-react';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function AdminCommunitiesPage() {
  const supabase = await createClient();

  const { data: rawComms } = await supabase
    .from('communities')
    .select('*, creator:profiles(username)')
    .order('created_at', { ascending: false });

  const communities = (rawComms || []) as any[];

  const handleToggle = async (formData: FormData) => {
    'use server';
    const id = formData.get('commId') as string;
    const isDisabled = formData.get('isDisabled') === 'true';
    await adminDisableCommunityAction(id, isDisabled);
    revalidatePath('/admin/communities');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
          Communities Grid
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
          Inspect creator community hubs, check access subscription prices, and lock communities that violate platform guidelines.
        </p>
      </div>

      {/* Grid */}
      {communities.length === 0 ? (
        <div style={{ padding: '64px', textAlign: 'center', background: '#0a0a0d', borderRadius: '24px', color: '#64748b' }}>
          No community hubs created yet.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {communities.map((comm) => {
            const isDisabled = (comm.rules || '').includes('[COMMUNITY DISABLED');

            return (
              <div 
                key={comm.id}
                style={{
                  background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px',
                  position: 'relative', overflow: 'hidden'
                }}
              >
                {/* Status indicator line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                  background: isDisabled ? '#ef4444' : comm.color || '#8b5cf6'
                }}></div>

                {/* Banner / Category info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.75rem', fontWeight: '800', color: '#8b5cf6',
                    background: 'rgba(139,92,246,0.1)', padding: '4px 8px', borderRadius: '6px'
                  }}>
                    {comm.category || 'General'}
                  </span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem' }}>
                    <Users size={16} />
                    <span style={{ fontWeight: '700', color: 'white' }}>{comm.member_count ?? 1}</span> members
                  </div>
                </div>

                {/* Details */}
                <div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '800', color: 'white' }}>
                    {comm.name}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
                    {comm.description || 'No description provided.'}
                  </p>
                </div>

                {/* Meta details */}
                <div style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem' 
                }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Creator: </span>
                    <span style={{ color: 'white', fontWeight: '700' }}>@{comm.creator?.username || 'unknown'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Join: </span>
                    <span style={{ color: '#10b981', fontWeight: '800' }}>
                      {parseFloat(comm.join_price || '0') > 0 ? `₹${comm.join_price}` : 'FREE'}
                    </span>
                  </div>
                </div>

                {/* Status warning if disabled */}
                {isDisabled && (
                  <div style={{
                    padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '0.75rem', color: '#ef4444', fontWeight: '700'
                  }}>
                    <ShieldAlert size={16} />
                    SUSPENDED FOR CONTENT VIOLATION
                  </div>
                )}

                {/* Trigger control */}
                <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
                  <form action={handleToggle}>
                    <input type="hidden" name="commId" value={comm.id} />
                    <input type="hidden" name="isDisabled" value={(!isDisabled).toString()} />
                    
                    <button 
                      type="submit"
                      style={{
                        width: '100%', padding: '10px', borderRadius: '12px', border: 'none',
                        background: isDisabled ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: isDisabled ? '#10b981' : '#ef4444',
                        fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }}
                    >
                      {isDisabled ? (
                        <>
                          <Power size={14} /> Restore Community Access
                        </>
                      ) : (
                        <>
                          <PowerOff size={14} /> Suspend Community Access
                        </>
                      )}
                    </button>
                  </form>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
