import { verifyAdminAccess } from '@/utils/admin';
import Link from 'next/link';
import { 
  LayoutDashboard, Users, FileText, AlertTriangle, 
  Globe, BarChart3, ShieldAlert, History, Settings, Lock, ShieldCheck, Home
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await verifyAdminAccess(['superadmin', 'admin', 'moderator']);

  // Access Denied Shield Page if unauthorized
  if (!session.isAuthorized || !session.user) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#0a0a0c',
        color: 'white', padding: '24px', textAlign: 'center', fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '24px',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'
        }}>
          <Lock size={40} style={{ color: '#ef4444' }} />
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '12px', letterSpacing: '-0.025em' }}>
          403 Access Forbidden
        </h1>
        <p style={{ color: '#94a3b8', maxWidth: '460px', lineHeight: '1.6', fontSize: '0.95rem', marginBottom: '32px' }}>
          Your account is not authorized to access the Indico Admin Control Center. Only authorized moderators, administrators, or superadministrators can bypass this safety firewall.
        </p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/" style={{
            padding: '12px 24px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: '600', textDecoration: 'none'
          }}>
            Return Home
          </Link>
          <Link href="/auth" style={{
            padding: '12px 24px', borderRadius: '12px', background: 'var(--accent-primary, #8b5cf6)',
            color: 'white', fontWeight: '600', textDecoration: 'none'
          }}>
            Authenticate Again
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'moderator'] },
    { label: 'Users Control', href: '/admin/users', icon: Users, roles: ['superadmin', 'admin'] },
    { label: 'Posts Feed', href: '/admin/posts', icon: FileText, roles: ['superadmin', 'admin', 'moderator'] },
    { label: 'Moderation Reports', href: '/admin/reports', icon: AlertTriangle, roles: ['superadmin', 'admin', 'moderator'] },
    { label: 'Communities Grid', href: '/admin/communities', icon: Globe, roles: ['superadmin', 'admin'] },
    { label: 'System Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['superadmin', 'admin'] },
    { label: 'Security & Lockdown', href: '/admin/security', icon: ShieldAlert, roles: ['superadmin'] },
    { label: 'Audit Logs', href: '/admin/logs', icon: History, roles: ['superadmin', 'admin'] },
    { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['superadmin'] }
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(session.role));

  return (
    <div style={{
      minHeight: '100vh', background: '#070709', color: 'white',
      display: 'flex', fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Sidebar Drawer */}
      <aside style={{
        width: '260px', borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        background: '#0a0a0d', zIndex: 100
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '24px', display: 'flex', alignItems: 'center', gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00f0ff, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldCheck size={20} style={{ color: 'white' }} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '1rem', letterSpacing: '-0.02em' }}>Indico HQ</div>
            <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: '700', textTransform: 'uppercase' }}>{session.role} MODE</div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {visibleMenuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '12px', color: '#94a3b8',
                fontWeight: '600', fontSize: '0.9rem', textDecoration: 'none',
                transition: 'all 0.2s ease-in-out'
              }}
              className="hover:bg-[rgba(255,255,255,0.03)] hover:text-white"
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer Account block */}
        <div style={{
          padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)'
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '0.9rem'
          }}>
            {session.user.fullName?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {session.user.fullName}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {session.user.email}
            </div>
          </div>
          <Link href="/" style={{ color: '#64748b', marginLeft: 'auto', display: 'flex' }}>
            <Home size={18} className="hover:text-white" />
          </Link>
        </div>
      </aside>

      {/* Main Panel Content Pane */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        {/* Top Header */}
        <header style={{
          padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#070709', zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Indico Social</span>
            <span style={{ color: 'rgba(255,255,255,0.1)' }}>/</span>
            <span style={{ color: 'white', fontWeight: '600', fontSize: '0.85rem' }}>Management Console</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              padding: '6px 12px', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.75rem', fontWeight: '700',
              color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              SECURED SYSTEM
            </div>
          </div>
        </header>

        {/* Nested Routing Content */}
        <div style={{ flex: 1, padding: '32px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
