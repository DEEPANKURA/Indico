'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, TrendingUp, MessageSquare, Users, Radio, Video, BarChart2, DollarSign, Bell, Settings, User } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: Compass, label: 'Explore', href: '/explore' },
    { icon: TrendingUp, label: 'Trending', href: '/trending' },
    { icon: MessageSquare, label: 'Messages', href: '/messages', badge: 2 },
    { icon: Users, label: 'Communities', href: '/communities' },
    { icon: Radio, label: 'Live', href: '/live' },
    { icon: User, label: 'Profile', href: '/profile' },
  ];

  const creatorTools = [
    { icon: Video, label: 'Studio', href: '/studio' },
    { icon: BarChart2, label: 'Analytics', href: '/analytics' },
    { icon: DollarSign, label: 'Monetize', href: '/monetize' },
    { icon: Settings, label: 'AI Tools', href: '/ai-tools', neon: true },
  ];

  return (
    <aside className="sidebar hide-on-mobile" style={{
      width: '260px',
      height: '100vh',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      background: 'var(--bg-primary)'
    }}>
      <div style={{ padding: '0 24px', marginBottom: '32px' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ 
            width: '32px', height: '32px', 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-neon))',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '18px',
            boxShadow: 'var(--shadow-neon)'
          }}>I</div>
          <span style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            Indico
          </span>
        </Link>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }}>
        <p className="text-xs text-muted" style={{ padding: '0 12px', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase' }}>
          Creator-First
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
            <Link key={i} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '12px', borderRadius: '12px',
              color: isActive ? 'white' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-glass-hover)' : 'transparent',
              transition: 'all var(--transition-fast)',
              position: 'relative', textDecoration: 'none'
            }}>
              <item.icon size={22} style={{ color: isActive ? 'var(--accent-secondary)' : 'inherit' }} />
              <span style={{ fontWeight: isActive ? '600' : '500' }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  position: 'absolute', right: '12px',
                  background: 'var(--accent-primary)', color: 'white',
                  fontSize: '12px', fontWeight: 'bold',
                  padding: '2px 6px', borderRadius: '10px'
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
            );
          })}
        </div>

        <div style={{ margin: '32px 0 16px 0', borderTop: '1px solid var(--border-light)' }}></div>
        
        <p className="text-xs text-muted" style={{ padding: '0 12px', marginBottom: '10px', fontWeight: '600', textTransform: 'uppercase' }}>
          Creator Tools
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {creatorTools.map((item, i) => (
            <Link key={i} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '12px', borderRadius: '12px',
              color: item.neon ? 'var(--accent-neon)' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}>
              <item.icon size={22} />
              <span style={{ fontWeight: '500' }}>{item.label}</span>
              {item.neon && (
                 <span className="badge badge-primary" style={{ marginLeft: 'auto' }}>NEW</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px 24px', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link href="/upload" className="btn-primary w-full" style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', textDecoration: 'none', padding: '12px' }}>
          <Video size={18} />
          <span>Upload</span>
        </Link>
        <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.15s' }}>
          <Settings size={18} />
          <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
