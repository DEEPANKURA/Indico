'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Compass, TrendingUp, MessageSquare, Users,
  Radio, Video, BarChart2, DollarSign, Settings, User, Sparkles,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home,          label: 'Home',        href: '/' },
    { icon: Compass,       label: 'Explore',     href: '/explore' },
    { icon: TrendingUp,    label: 'Trending',    href: '/trending' },
    { icon: MessageSquare, label: 'Messages',    href: '/messages', badge: 2 },
    { icon: Users,         label: 'Communities', href: '/communities' },
    { icon: Radio,         label: 'Live',        href: '/live' },
    { icon: User,          label: 'Profile',     href: '/profile' },
  ];

  const creatorTools = [
    { icon: Video,    label: 'Studio',   href: '/studio' },
    { icon: BarChart2, label: 'Analytics', href: '/analytics' },
    { icon: DollarSign, label: 'Monetize', href: '/monetize' },
  ];

  return (
    <aside className="sidebar" style={{
      height: '100dvh',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div className="sidebar-logo" style={{ padding: '0 24px', marginBottom: '32px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-neon))',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '18px',
            boxShadow: 'var(--shadow-neon)',
          }}>I</div>
          <span className="sidebar-logo-text" style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
            Indico
          </span>
        </Link>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 12px' }}>
        <p className="sidebar-section-title text-xs text-muted" style={{ padding: '0 12px', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase' }}>
          Creator-First
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <Link key={i} href={item.href}
                className="sidebar-nav-link"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px', borderRadius: '12px',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
                  transition: 'all var(--transition-fast)',
                  position: 'relative', textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}>
                <item.icon size={22} style={{ color: isActive ? 'var(--accent-secondary)' : 'inherit', flexShrink: 0 }} />
                <span className="sidebar-label" style={{ fontWeight: isActive ? '600' : '500' }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    position: 'absolute', right: '12px',
                    background: 'var(--accent-primary)', color: 'white',
                    fontSize: '12px', fontWeight: 'bold',
                    padding: '2px 6px', borderRadius: '10px',
                  }} className="sidebar-label">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Creator Tools */}
        <div className="sidebar-creator-section">
          <div style={{ margin: '28px 0 14px 0', borderTop: '1px solid var(--border-light)' }} />
          <p className="sidebar-section-title text-xs text-muted" style={{ padding: '0 12px', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase' }}>
            Creator Tools
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {creatorTools.map((item, i) => (
              <Link key={i} href={item.href}
                className="sidebar-nav-link"
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px', borderRadius: '12px',
                  color: 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)',
                  whiteSpace: 'nowrap',
                }}>
                <item.icon size={22} style={{ flexShrink: 0 }} />
                <span className="sidebar-label" style={{ fontWeight: '500' }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link href="/upload" className="btn-primary sidebar-upload-btn"
          style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', textDecoration: 'none', padding: '12px', borderRadius: '12px' }}>
          <Video size={18} style={{ flexShrink: 0 }} />
          <span className="sidebar-label">Upload</span>
        </Link>
        <Link href="/settings" className="sidebar-settings-link"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.15s', justifyContent: 'flex-start' }}>
          <Settings size={18} style={{ flexShrink: 0 }} />
          <span className="sidebar-settings-label sidebar-label" style={{ fontSize: '0.9rem', fontWeight: '500' }}>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
