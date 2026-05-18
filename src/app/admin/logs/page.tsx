import { auditLogsMemory } from '@/utils/admin';
import { History, Shield, User, Globe, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage() {
  const logs = auditLogsMemory;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'EMERGENCY_LOCKDOWN': return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
      case 'USER_BAN': return <Shield size={16} style={{ color: '#ef4444' }} />;
      case 'USER_VERIFY': return <Shield size={16} style={{ color: '#00f0ff' }} />;
      case 'COMMUNITY_DISABLE': return <Globe size={16} style={{ color: '#eab308' }} />;
      default: return <User size={16} style={{ color: '#94a3b8' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', margin: '0 0 6px 0', letterSpacing: '-0.025em' }}>
          Administrative Audit Trails
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
          Historical track log of every database write, user ban, creator badge, and community closure executed by platform managers.
        </p>
      </div>

      {/* Audit List Table */}
      <div style={{ background: '#0a0a0d', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b' }}>Action Logged</th>
              <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b' }}>Authorized Email</th>
              <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b' }}>Log Context & Details</th>
              <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b' }}>Network & Device</th>
              <th style={{ padding: '16px 24px', fontWeight: '700', color: '#64748b', textAlign: 'right' }}>Logged At</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {/* Action */}
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getActionIcon(log.action)}
                      <span style={{ fontWeight: '700', color: 'white' }}>{log.action}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '18px 24px', color: '#94a3b8', fontWeight: '500' }}>
                    {log.adminEmail}
                  </td>

                  {/* Details */}
                  <td style={{ padding: '18px 24px', color: 'white', maxWidth: '300px', wordBreak: 'break-word' }}>
                    {log.details}
                  </td>

                  {/* IP/Agent */}
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ fontWeight: '600', color: '#64748b', fontSize: '0.8rem' }}>IP: {log.ipAddress}</div>
                    <div style={{ fontSize: '0.7rem', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }} title={log.userAgent}>
                      {log.userAgent}
                    </div>
                  </td>

                  {/* Date */}
                  <td style={{ padding: '18px 24px', textAlign: 'right', color: '#64748b', fontSize: '0.8rem' }}>
                    {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
