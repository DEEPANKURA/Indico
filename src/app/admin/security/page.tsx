import { ShieldAlert, Terminal, Lock, HelpCircle, EyeOff, AlertCircle } from 'lucide-react';
import { adminEmergencyLockdownAction } from '@/app/actions/admin';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function AdminSecurityPage() {
  
  const suspiciousActivities = [
    { ip: '198.51.100.42', attempts: '14 rapid POST calls', location: 'Frankfurt, DE', reason: 'High-frequency brute force on /api/auth', severity: 'HIGH' },
    { ip: '203.0.113.189', attempts: 'API scanning', location: 'Tokyo, JP', reason: 'Attempted Directory Traversal', severity: 'CRITICAL' },
    { ip: '192.0.2.77', attempts: 'Multiple registration failures', location: 'Mumbai, IN', reason: 'Invalid payload structured schema injection', severity: 'MEDIUM' }
  ];

  const handleLockdown = async (formData: FormData) => {
    'use server';
    const isLock = formData.get('lockdown') === 'true';
    await adminEmergencyLockdownAction(isLock);
    revalidatePath('/admin/security');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
          Security & Global Firewall
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
          Inspect suspicious network activity logs, track failed administrative logins, and trigger platform protection parameters.
        </p>
      </div>

      {/* Grid split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Emergency Panel */}
        <div style={{
          background: '#0a0a0d', border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px'
        }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} /> GLOBAL EMERGENCY LOCKDOWN
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.6' }}>
            In the event of an active server breach, network attack, or critical API exploit, trigger the emergency lockdown mode immediately.
          </p>
          <div style={{
            padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.1)', fontSize: '0.8rem', color: '#ef4444', lineHeight: '1.4'
          }}>
            <strong>WARNING:</strong> Triggering lockdown freezes all content creation, disables incoming transactions, and forces a mandatory 2-Factor check for all administrators.
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <form action={handleLockdown} style={{ flex: 1 }}>
              <input type="hidden" name="lockdown" value="true" />
              <button 
                type="submit"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px', border: 'none',
                  background: '#ef4444', color: 'white', fontWeight: '800', fontSize: '0.85rem',
                  cursor: 'pointer', boxShadow: '0 0 16px rgba(239, 68, 68, 0.4)', transition: 'all 0.2s'
                }}
              >
                ENABLE LOCKDOWN NOW
              </button>
            </form>
            <form action={handleLockdown} style={{ flex: 1 }}>
              <input type="hidden" name="lockdown" value="false" />
              <button 
                type="submit"
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)',
                  color: 'white', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer'
                }}
              >
                RESET LOCKDOWN
              </button>
            </form>
          </div>
        </div>

        {/* Security Parameters config */}
        <div style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={20} style={{ color: '#8b5cf6' }} /> Active Safety Shields
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { name: 'Brute Force Protection', status: 'ACTIVE', desc: 'Auto IP Ban after 5 failed login attempts' },
              { name: 'XSS & CSRF Shields', status: 'ENFORCED', desc: 'Secure HttpOnly session checks active' },
              { name: 'WAF Rate Limits', status: 'ACTIVE', desc: '100 API requests/minute/IP limit' }
            ].map((shield, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'white', fontWeight: '700' }}>{shield.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{shield.desc}</div>
                </div>
                <span style={{
                  fontSize: '0.7rem', fontWeight: '800', color: '#10b981',
                  background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '6px'
                }}>
                  {shield.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Network alerts logs list */}
      <div style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '28px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={20} style={{ color: '#00f0ff' }} /> Suspicious Web Traffic & IP Firewalls
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {suspiciousActivities.map((act, idx) => (
            <div 
              key={idx}
              style={{
                padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '800', color: 'white' }}>{act.ip}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({act.location})</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                  {act.reason} — <em>{act.attempts}</em>
                </div>
              </div>
              <span style={{
                fontSize: '0.7rem', fontWeight: '800',
                color: act.severity === 'CRITICAL' ? '#ef4444' : '#eab308',
                background: act.severity === 'CRITICAL' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                padding: '4px 8px', borderRadius: '6px'
              }}>
                {act.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
